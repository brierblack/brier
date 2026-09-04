use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

/// 每用户 SSE 事件广播。
///
/// 按 user_id 维护一组 broadcast channel：用户首次订阅时创建，之后复用；
/// `publish` 在无订阅者时静默丢弃（不为无人监听的用户建 channel）。
/// 事件负载为 JSON 字符串（见 `brier_type::work_computer_event`）。
#[derive(Clone, Default)]
pub struct EventBus {
    users: Arc<RwLock<HashMap<Uuid, broadcast::Sender<String>>>>,
}

impl EventBus {
    pub fn new() -> Self {
        Self::default()
    }

    /// 订阅指定用户的事件流；channel 不存在时创建（容量 256，容纳任务输出增量事件）。
    pub async fn subscribe(&self, user_id: Uuid) -> broadcast::Receiver<String> {
        let mut users = self.users.write().await;
        match users.get(&user_id) {
            Some(tx) => tx.subscribe(),
            None => {
                let (tx, rx) = broadcast::channel(256);
                users.insert(user_id, tx);
                rx
            }
        }
    }

    /// 向指定用户广播事件（无订阅者时静默丢弃）。
    pub async fn publish(&self, user_id: Uuid, payload: String) {
        let users = self.users.read().await;
        if let Some(tx) = users.get(&user_id) {
            let _ = tx.send(payload);
        }
    }
}
