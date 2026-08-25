use std::collections::HashMap;
use std::sync::Arc;

use hive_type::tunnel::ServerMessage;
use tokio::sync::{mpsc, RwLock};

pub type ConnectionSender = mpsc::UnboundedSender<ServerMessage>;

#[derive(Clone, Default)]
pub struct ConnectionRegistry {
    connections: Arc<RwLock<HashMap<String, ConnectionSender>>>,
}

impl ConnectionRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn register(&self, key: &str, sender: ConnectionSender) {
        let mut conns = self.connections.write().await;
        if let Some(old) = conns.insert(key.to_string(), sender) {
            tracing::info!(key, "replaced existing tunnel connection");
            let _ = old.send(ServerMessage::AuthFailed {
                reason: "replaced by new connection".into(),
            });
        } else {
            tracing::info!(key, "tunnel connection registered");
        }
    }

    pub async fn unregister(&self, key: &str) {
        let removed = self.connections.write().await.remove(key);
        if removed.is_some() {
            tracing::info!(key, "tunnel connection unregistered");
        }
    }

    pub async fn send(&self, key: &str, message: ServerMessage) -> bool {
        let conns = self.connections.read().await;
        match conns.get(key) {
            Some(sender) => sender.send(message).is_ok(),
            None => false,
        }
    }

    pub async fn is_online(&self, key: &str) -> bool {
        self.connections.read().await.contains_key(key)
    }

    pub async fn online_keys(&self) -> Vec<String> {
        self.connections.read().await.keys().cloned().collect()
    }
}
