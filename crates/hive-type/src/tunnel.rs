use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StreamType {
    Stdout,
    Stderr,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum ServerMessage {
    AuthOk {
        #[serde(rename = "computerId")]
        computer_id: String,
    },
    AuthFailed {
        reason: String,
    },
    HeartbeatAck {
        timestamp: u64,
    },
    TaskStart {
        #[serde(rename = "taskId")]
        task_id: String,
        runtime: String,
        command: String,
        args: Vec<String>,
        cwd: Option<String>,
        env: Option<HashMap<String, String>>,
    },
    TaskCancel {
        #[serde(rename = "taskId")]
        task_id: String,
    },
    QueryRuntimes,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum ClientMessage {
    Auth {
        token: String,
        hostname: String,
        os: String,
        runtimes: Vec<String>,
    },
    Heartbeat {
        timestamp: u64,
    },
    TaskOutput {
        #[serde(rename = "taskId")]
        task_id: String,
        stream: StreamType,
        data: String,
    },
    TaskComplete {
        #[serde(rename = "taskId")]
        task_id: String,
        #[serde(rename = "exitCode")]
        exit_code: i32,
    },
    TaskError {
        #[serde(rename = "taskId")]
        task_id: String,
        error: String,
    },
    RuntimeInfo {
        runtimes: Vec<String>,
    },
}
