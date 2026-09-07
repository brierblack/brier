use brier_error::{BrierError, Result};
use brier_type::id::*;
use brier_type::*;

use crate::entity::{
    agent, agent_task, agent_team, agent_team_member, session, session_message, user_connect_token,
    work_computer,
};

pub trait DbErrExt {
    fn to_brier(self) -> BrierError;
}

impl DbErrExt for sea_orm::DbErr {
    fn to_brier(self) -> BrierError {
        BrierError::Database(self.to_string())
    }
}

pub(crate) fn parse_enum<T: serde::de::DeserializeOwned>(s: &str, label: &str) -> Result<T> {
    serde_json::from_value(serde_json::Value::String(s.to_string()))
        .map_err(|e| BrierError::Validation(format!("invalid {}: {} ({})", label, s, e)))
}

pub(crate) fn enum_to_string<T: serde::Serialize>(value: &T) -> String {
    serde_json::to_string(value)
        .unwrap_or_default()
        .trim_matches('"')
        .to_string()
}

// --- WorkComputer ---

impl TryFrom<work_computer::Model> for WorkComputer {
    type Error = BrierError;

    fn try_from(m: work_computer::Model) -> Result<Self> {
        Ok(Self {
            id: WorkComputerId(m.id),
            user_id: UserId(m.user_id),
            name: m.name,
            computer_type: parse_enum(&m.computer_type, "WorkComputerType")?,
            host: m.host,
            os: m.os,
            status: parse_enum(&m.status, "WorkComputerStatus")?,
            last_seen_at: m.last_seen_at,
            runtimes: m
                .runtimes
                .as_deref()
                .map(|json| {
                    serde_json::from_str::<Vec<String>>(json)
                        .unwrap_or_else(|_| Vec::new())
                })
                .unwrap_or_default(),
            version: m.version,
            created_at: m.created_at,
            updated_at: m.updated_at,
        })
    }
}

impl From<WorkComputer> for work_computer::ActiveModel {
    fn from(wc: WorkComputer) -> Self {
        Self {
            id: sea_orm::Set(wc.id.0),
            user_id: sea_orm::Set(wc.user_id.0),
            name: sea_orm::Set(wc.name),
            computer_type: sea_orm::Set(enum_to_string(&wc.computer_type)),
            host: sea_orm::Set(wc.host),
            os: sea_orm::Set(wc.os),
            status: sea_orm::Set(enum_to_string(&wc.status)),
            last_seen_at: sea_orm::Set(wc.last_seen_at),
            runtimes: sea_orm::Set(Some(serde_json::to_string(&wc.runtimes).unwrap_or_default())),
            version: sea_orm::Set(wc.version),
            created_at: sea_orm::Set(wc.created_at),
            updated_at: sea_orm::Set(wc.updated_at),
        }
    }
}

// --- Agent ---

impl TryFrom<agent::Model> for Agent {
    type Error = BrierError;

    fn try_from(m: agent::Model) -> Result<Self> {
        Ok(Self {
            id: AgentId(m.id),
            workspace_id: WorkspaceId(m.workspace_id),
            creator_id: UserId(m.creator_id),
            work_computer_id: m.work_computer_id.map(WorkComputerId),
            name: m.name,
            description: m.description,
            avatar: m.avatar,
            status: parse_enum(&m.status, "AgentStatus")?,
            visibility: parse_enum(&m.visibility, "AgentVisibility")?,
            public_scope: m
                .public_scope
                .as_deref()
                .map(|s| parse_enum(s, "PublicScope"))
                .transpose()?,
            runtime: m.runtime,
            workdir: m.workdir,
            last_active: m.last_active,
            created_at: m.created_at,
            updated_at: m.updated_at,
        })
    }
}

impl From<Agent> for agent::ActiveModel {
    fn from(a: Agent) -> Self {
        Self {
            id: sea_orm::Set(a.id.0),
            workspace_id: sea_orm::Set(a.workspace_id.0),
            creator_id: sea_orm::Set(a.creator_id.0),
            work_computer_id: sea_orm::Set(a.work_computer_id.map(|id| id.0)),
            name: sea_orm::Set(a.name),
            description: sea_orm::Set(a.description),
            avatar: sea_orm::Set(a.avatar),
            status: sea_orm::Set(enum_to_string(&a.status)),
            visibility: sea_orm::Set(enum_to_string(&a.visibility)),
            public_scope: sea_orm::Set(a.public_scope.map(|s| enum_to_string(&s))),
            runtime: sea_orm::Set(a.runtime),
            workdir: sea_orm::Set(a.workdir),
            last_active: sea_orm::Set(a.last_active),
            created_at: sea_orm::Set(a.created_at),
            updated_at: sea_orm::Set(a.updated_at),
        }
    }
}

// --- AgentTeam ---

impl TryFrom<agent_team::Model> for AgentTeam {
    type Error = BrierError;

    fn try_from(m: agent_team::Model) -> Result<Self> {
        Ok(Self {
            id: AgentTeamId(m.id),
            workspace_id: WorkspaceId(m.workspace_id),
            creator_id: UserId(m.creator_id),
            primary_agent_id: m.primary_agent_id.map(AgentId),
            name: m.name,
            description: m.description,
            mode: parse_enum(&m.mode, "TeamMode")?,
            status: parse_enum(&m.status, "TeamStatus")?,
            created_at: m.created_at,
            updated_at: m.updated_at,
        })
    }
}

impl From<AgentTeam> for agent_team::ActiveModel {
    fn from(t: AgentTeam) -> Self {
        Self {
            id: sea_orm::Set(t.id.0),
            workspace_id: sea_orm::Set(t.workspace_id.0),
            creator_id: sea_orm::Set(t.creator_id.0),
            primary_agent_id: sea_orm::Set(t.primary_agent_id.map(|id| id.0)),
            name: sea_orm::Set(t.name),
            description: sea_orm::Set(t.description),
            mode: sea_orm::Set(enum_to_string(&t.mode)),
            status: sea_orm::Set(enum_to_string(&t.status)),
            created_at: sea_orm::Set(t.created_at),
            updated_at: sea_orm::Set(t.updated_at),
        }
    }
}

// --- AgentTeamMember ---

impl From<agent_team_member::Model> for AgentTeamMember {
    fn from(m: agent_team_member::Model) -> Self {
        Self {
            team_id: AgentTeamId(m.team_id),
            agent_id: AgentId(m.agent_id),
            created_at: m.created_at,
        }
    }
}

impl From<AgentTeamMember> for agent_team_member::ActiveModel {
    fn from(atm: AgentTeamMember) -> Self {
        Self {
            team_id: sea_orm::Set(atm.team_id.0),
            agent_id: sea_orm::Set(atm.agent_id.0),
            created_at: sea_orm::Set(atm.created_at),
        }
    }
}

// --- Session / SessionMessage ---

impl TryFrom<session::Model> for Session {
    type Error = BrierError;

    fn try_from(m: session::Model) -> Result<Self> {
        Ok(Self {
            id: SessionId(m.id),
            workspace_id: WorkspaceId(m.workspace_id),
            creator_id: UserId(m.creator_id),
            agent_id: AgentId(m.agent_id),
            title: m.title,
            created_at: m.created_at,
            updated_at: m.updated_at,
        })
    }
}

impl From<Session> for session::ActiveModel {
    fn from(s: Session) -> Self {
        Self {
            id: sea_orm::Set(s.id.0),
            workspace_id: sea_orm::Set(s.workspace_id.0),
            creator_id: sea_orm::Set(s.creator_id.0),
            agent_id: sea_orm::Set(s.agent_id.0),
            title: sea_orm::Set(s.title),
            created_at: sea_orm::Set(s.created_at),
            updated_at: sea_orm::Set(s.updated_at),
        }
    }
}

impl TryFrom<session_message::Model> for SessionMessage {
    type Error = BrierError;

    fn try_from(m: session_message::Model) -> Result<Self> {
        Ok(Self {
            id: SessionMessageId(m.id),
            session_id: SessionId(m.session_id),
            role: parse_enum(&m.role, "MessageRole")?,
            content: m.content,
            agent_id: m.agent_id.map(AgentId),
            task_id: m.task_id.map(TaskId),
            created_at: m.created_at,
        })
    }
}

impl From<SessionMessage> for session_message::ActiveModel {
    fn from(m: SessionMessage) -> Self {
        Self {
            id: sea_orm::Set(m.id.0),
            session_id: sea_orm::Set(m.session_id.0),
            role: sea_orm::Set(enum_to_string(&m.role)),
            content: sea_orm::Set(m.content),
            agent_id: sea_orm::Set(m.agent_id.map(|id| id.0)),
            task_id: sea_orm::Set(m.task_id.map(|id| id.0)),
            created_at: sea_orm::Set(m.created_at),
        }
    }
}

// --- AgentTask ---

impl TryFrom<agent_task::Model> for AgentTask {
    type Error = BrierError;

    fn try_from(m: agent_task::Model) -> Result<Self> {
        Ok(Self {
            id: TaskId(m.id),
            workspace_id: WorkspaceId(m.workspace_id),
            creator_id: UserId(m.creator_id),
            agent_id: AgentId(m.agent_id),
            computer_id: m.computer_id.map(WorkComputerId),
            title: m.title,
            prompt: m.prompt,
            command: m.command,
            runtime: m.runtime,
            status: parse_enum(&m.status, "TaskStatus")?,
            priority: parse_enum(&m.priority, "TaskPriority")?,
            source: parse_enum(&m.source, "TaskSource")?,
            output: m.output,
            exit_code: m.exit_code,
            error: m.error,
            started_at: m.started_at,
            finished_at: m.finished_at,
            created_at: m.created_at,
            updated_at: m.updated_at,
        })
    }
}

impl From<AgentTask> for agent_task::ActiveModel {
    fn from(t: AgentTask) -> Self {
        Self {
            id: sea_orm::Set(t.id.0),
            workspace_id: sea_orm::Set(t.workspace_id.0),
            creator_id: sea_orm::Set(t.creator_id.0),
            agent_id: sea_orm::Set(t.agent_id.0),
            computer_id: sea_orm::Set(t.computer_id.map(|id| id.0)),
            title: sea_orm::Set(t.title),
            prompt: sea_orm::Set(t.prompt),
            command: sea_orm::Set(t.command),
            runtime: sea_orm::Set(t.runtime),
            status: sea_orm::Set(enum_to_string(&t.status)),
            priority: sea_orm::Set(enum_to_string(&t.priority)),
            source: sea_orm::Set(enum_to_string(&t.source)),
            output: sea_orm::Set(t.output),
            exit_code: sea_orm::Set(t.exit_code),
            error: sea_orm::Set(t.error),
            started_at: sea_orm::Set(t.started_at),
            finished_at: sea_orm::Set(t.finished_at),
            created_at: sea_orm::Set(t.created_at),
            updated_at: sea_orm::Set(t.updated_at),
        }
    }
}
