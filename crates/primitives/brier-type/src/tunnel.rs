use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StreamType {
    Stdout,
    Stderr,
}

/// 子进程执行形态（随 task-start 下发，与 daemon TS 侧 ExecMode 镜像）：
/// - pipe：非交互，stdout/stderr 管道直传（默认）
/// - pty：伪终端交互，可接收 task-input 写入（AI 提问等场景）
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExecMode {
    Pipe,
    Pty,
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
        /// 自然语言指令（AI runtime 模式下由 CLI 拼成该 runtime 的参数；
        /// 旧版 CLI 无此字段时忽略）。命令模式下为 None。
        #[serde(default)]
        prompt: Option<String>,
        /// 执行形态（pty 交互/pipe 非交互）；缺省为 None（daemon 按 pipe 执行，向后兼容）。
        #[serde(default, rename = "execMode")]
        exec_mode: Option<ExecMode>,
        /// 续接上一 CLI 会话（如 opencode 的 session ID）；缺省不续接。
        #[serde(default, rename = "resumeSessionId")]
        resume_session_id: Option<String>,
    },
    TaskCancel {
        #[serde(rename = "taskId")]
        task_id: String,
    },
    /// 向运行中任务写入输入（pty = 模拟击键；pipe = 写 stdin）。
    TaskInput {
        #[serde(rename = "taskId")]
        task_id: String,
        data: String,
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
        /// 接入 CLI 版本（旧版客户端可能不带该字段）。
        #[serde(default)]
        version: Option<String>,
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
