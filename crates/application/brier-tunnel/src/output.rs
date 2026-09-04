//! 服务端任务输出批量缓冲（单写者架构）。
//!
//! CLI 侧已按 16KB/50ms 微批上报，本组件把同一 task 的若干帧在服务端再聚合
//! 一个周期（100ms），以"一次 DB UPDATE + 一次 SSE 输出事件"的粒度落库与推送，
//! 降低高频输出对数据库与事件总线的压力，同时保持 ~100ms 的端到端增量延迟。
//!
//! 架构：所有缓冲状态与 DB 写入收敛到**单一后台 writer 任务**（mpsc 命令驱动），
//! 从根源避免并发 append 与任务终态（complete/error）之间的时序竞争：
//! - [`OutputBatcher::push`]：把输出帧投递给 writer 累积（不直接 IO）；
//! - [`OutputBatcher::flush_task`]：向 writer 请求"该任务残余输出已全部落库"的
//!   ack，dispatch 收到 ack 后才执行 finish/fail，保证输出不丢、顺序不乱；
//! - writer 每 100ms 周期 flush 全部缓冲任务，长输出不会无限堆积在内存。
//!
//! 丢弃语义：append 命中 DB 的 status 过滤（仅 pending/running）失败时整批丢弃，
//! 不会给已终态任务补写输出。
//!
//! 增量语义：每个推送事件携带该块在任务累计输出中的起始 `offset`（字节），
//! 前端可据快照长度做去重与补缺，避免"快照已含该段 + 事件再追加"导致的重复渲染。

use std::collections::HashMap;
use std::time::Duration;

use brier_core::event_bus::EventBus;
use brier_type::id::{TaskId, UserId, WorkComputerId, WorkspaceId};
use sea_orm::DatabaseConnection;
use tokio::sync::{mpsc, oneshot};

use crate::publish_task_output_event;

/// writer 周期 flush 间隔。
const FLUSH_INTERVAL: Duration = Duration::from_millis(100);

/// 单个 task 未落库缓冲的字节硬上限，超过立即触发一次该 task 的 flush。
const FLUSH_BYTES_HARD_CAP: usize = 256 * 1024;

enum Cmd {
    Push {
        task_id: TaskId,
        computer_id: WorkComputerId,
        user_id: UserId,
        workspace_id: WorkspaceId,
        data: String,
    },
    FlushTask {
        task_id: TaskId,
        ack: oneshot::Sender<()>,
    },
}

struct PendingTask {
    computer_id: WorkComputerId,
    user_id: UserId,
    workspace_id: WorkspaceId,
    chunks: Vec<String>,
    bytes: usize,
}

/// 任务输出批量器（Clone 为共享句柄，底层命令通道唯一）。
#[derive(Clone)]
pub struct OutputBatcher {
    tx: mpsc::UnboundedSender<Cmd>,
}

impl OutputBatcher {
    /// 创建批量器并启动后台 writer。**须在 tokio runtime 内调用。**
    pub fn new(db: DatabaseConnection, event_bus: EventBus) -> Self {
        let (tx, mut rx) = mpsc::unbounded_channel::<Cmd>();
        tokio::spawn(async move {
            let mut pending: HashMap<TaskId, PendingTask> = HashMap::new();
            // 每个 task 已成功落库的总字节数（用于计算下一个事件块的 offset）
            let mut flushed: HashMap<TaskId, usize> = HashMap::new();
            let mut ticker = tokio::time::interval(FLUSH_INTERVAL);
            ticker.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
            loop {
                tokio::select! {
                    _ = ticker.tick() => {
                        flush_all(&db, &event_bus, &mut pending, &mut flushed).await;
                    }
                    cmd = rx.recv() => {
                        match cmd {
                            Some(Cmd::Push { task_id, computer_id, user_id, workspace_id, data }) => {
                                let is_new = !pending.contains_key(&task_id)
                                    && !flushed.contains_key(&task_id);
                                let entry = pending.entry(task_id).or_insert_with(|| PendingTask {
                                    computer_id,
                                    user_id,
                                    workspace_id,
                                    chunks: Vec::new(),
                                    bytes: 0,
                                });
                                let data_len = data.len();
                                entry.chunks.push(data);
                                entry.bytes = entry.bytes.saturating_add(data_len);
                                // 服务重启后 flushed 记账丢失：以 DB 中已有输出长度为 offset 基线，
                                // 保证续跑任务的事件 offset 与前端快照长度对齐（不重复、不丢块）。
                                if is_new {
                                    let base = match brier_agent::repository::get_agent_task(
                                        &db,
                                        task_id,
                                    )
                                    .await
                                    {
                                        Ok(Some(t)) => t.output.len(),
                                        _ => 0,
                                    };
                                    flushed.insert(task_id, base);
                                }
                                if entry.bytes >= FLUSH_BYTES_HARD_CAP {
                                    if let Some(e) = pending.remove(&task_id) {
                                        write_task(&db, &event_bus, task_id, e, &mut flushed).await;
                                    }
                                }
                            }
                            Some(Cmd::FlushTask { task_id, ack }) => {
                                if let Some(e) = pending.remove(&task_id) {
                                    write_task(&db, &event_bus, task_id, e, &mut flushed).await;
                                }
                                // 已进入终态：清掉 offset 记账（后续不会再有输出）
                                flushed.remove(&task_id);
                                // ack 失败说明请求方已取消等待，无副作用
                                let _ = ack.send(());
                            }
                            None => break,
                        }
                    }
                }
            }
        });
        Self { tx }
    }

    /// 累积一条输出帧（异步投递，不阻塞隧道主循环）。
    pub fn push(
        &self,
        task_id: TaskId,
        computer_id: WorkComputerId,
        user_id: UserId,
        workspace_id: WorkspaceId,
        data: &str,
    ) {
        let _ = self.tx.send(Cmd::Push {
            task_id,
            computer_id,
            user_id,
            workspace_id,
            data: data.to_string(),
        });
    }

    /// 等待指定任务已累积输出全部落库（终态前置步骤）。
    pub async fn flush_task(&self, task_id: &TaskId) {
        let (ack, rx) = oneshot::channel();
        if self.tx.send(Cmd::FlushTask { task_id: *task_id, ack }).is_err() {
            return;
        }
        let _ = rx.await;
    }
}

/// 把全部缓冲任务拼接落库并推送（writer 专用，天然串行）。
async fn flush_all(
    db: &DatabaseConnection,
    event_bus: &EventBus,
    pending: &mut HashMap<TaskId, PendingTask>,
    flushed: &mut HashMap<TaskId, usize>,
) {
    if pending.is_empty() {
        return;
    }
    for (task_id, entry) in pending.drain() {
        write_task(db, event_bus, task_id, entry, flushed).await;
    }
}

/// 拼接缓冲并执行一次 DB append + 一次 SSE 输出事件（writer 专用）。
async fn write_task(
    db: &DatabaseConnection,
    event_bus: &EventBus,
    task_id: TaskId,
    entry: PendingTask,
    flushed: &mut HashMap<TaskId, usize>,
) {
    if entry.chunks.is_empty() {
        return;
    }
    let offset = *flushed.get(&task_id).unwrap_or(&0);
    let data = entry.chunks.concat();
    let now = chrono::Utc::now();
    match brier_agent::repository::append_task_output(
        db,
        task_id,
        entry.computer_id,
        &data,
        now,
    )
    .await
    {
        Ok(true) => {
            flushed.insert(task_id, offset + data.len());
            publish_task_output_event(
                event_bus,
                entry.user_id,
                task_id,
                entry.workspace_id,
                offset,
                &data,
            )
            .await;
        }
        Ok(false) => {
            // 任务已不在 pending/running（终态或非本机任务）：整批丢弃，不推送
        }
        Err(e) => {
            tracing::warn!(task_id = %task_id, error = %e, "flush task output failed");
        }
    }
}
