use brier_error::{BrierError, Result};
use brier_type::id::*;
use brier_type::*;

use crate::entity::{agent, agent_team, agent_team_member, work_computer};

pub trait DbErrExt {
    fn to_brier(self) -> BrierError;
}

impl DbErrExt for sea_orm::DbErr {
    fn to_brier(self) -> BrierError {
        BrierError::Database(self.to_string())
    }
}

fn parse_enum<T: serde::de::DeserializeOwned>(s: &str, label: &str) -> Result<T> {
    serde_json::from_value(serde_json::Value::String(s.to_string()))
        .map_err(|e| BrierError::Validation(format!("invalid {}: {} ({})", label, s, e)))
}

fn enum_to_string<T: serde::Serialize>(value: &T) -> String {
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
            icon: m.icon,
            color: m.color,
            status: parse_enum(&m.status, "AgentStatus")?,
            visibility: parse_enum(&m.visibility, "AgentVisibility")?,
            public_scope: m
                .public_scope
                .as_deref()
                .map(|s| parse_enum(s, "PublicScope"))
                .transpose()?,
            runtime: m.runtime,
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
            icon: sea_orm::Set(a.icon),
            color: sea_orm::Set(a.color),
            status: sea_orm::Set(enum_to_string(&a.status)),
            visibility: sea_orm::Set(enum_to_string(&a.visibility)),
            public_scope: sea_orm::Set(a.public_scope.map(|s| enum_to_string(&s))),
            runtime: sea_orm::Set(a.runtime),
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
