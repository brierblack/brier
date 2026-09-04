//! task_id → workspace_id 的进程内共享索引。
//!
//! 隧道收到的 `TaskOutput` 上行消息只携带 task_id（CLI 不知道工作空间概念），
//! 而推送 SSE 输出事件与按会话过滤都需要 workspace_id。此索引由 `brier-api`
//! 在任务创建/取消时登记与清理，隧道在广播输出事件时 O(1) 查询，避免每帧查库。
//!
//! 索引失效兜底：任务若由旧版本流程创建（未登记），dispatch 会查库一次回填，
//! 详见 `dispatch::resolve_workspace`。

use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use brier_type::id::{TaskId, WorkspaceId};

/// 进程内任务归属索引（task_id → workspace_id）。
#[derive(Clone, Default)]
pub struct TaskWorkspaces {
    inner: Arc<RwLock<HashMap<TaskId, WorkspaceId>>>,
}

impl TaskWorkspaces {
    pub fn new() -> Self {
        Self::default()
    }

    /// 查询任务所属工作空间。
    pub fn get(&self, task_id: &TaskId) -> Option<WorkspaceId> {
        self.inner.read().ok()?.get(task_id).copied()
    }

    /// 登记任务归属（任务创建成功后调用）。
    pub fn insert(&self, task_id: TaskId, workspace_id: WorkspaceId) {
        if let Ok(mut m) = self.inner.write() {
            m.insert(task_id, workspace_id);
        }
    }

    /// 移除任务归属（任务进入终态后调用，防止索引无限增长）。
    pub fn remove(&self, task_id: &TaskId) {
        if let Ok(mut m) = self.inner.write() {
            m.remove(task_id);
        }
    }
}
