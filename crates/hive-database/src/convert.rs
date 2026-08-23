use hive_error::{HiveError, Result};
use hive_type::id::*;
use hive_type::*;

use crate::entity::{
    agent, agent_team, agent_team_member, user, work_computer, workspace, workspace_member,
};

fn parse_enum<T: serde::de::DeserializeOwned>(s: &str, label: &str) -> Result<T> {
    serde_json::from_value(serde_json::Value::String(s.to_string()))
        .map_err(|e| HiveError::Validation(format!("invalid {}: {} ({})", label, s, e)))
}

fn enum_to_string<T: serde::Serialize>(value: &T) -> String {
    serde_json::to_string(value)
        .unwrap_or_default()
        .trim_matches('"')
        .to_string()
}

fn json_to_vec(v: &serde_json::Value) -> Vec<String> {
    serde_json::from_value(v.clone()).unwrap_or_default()
}

fn vec_to_json(v: &[String]) -> serde_json::Value {
    serde_json::to_value(v).unwrap_or_default()
}

// --- User ---

impl From<user::Model> for User {
    fn from(m: user::Model) -> Self {
        Self {
            id: UserId(m.id),
            github_id: m.github_id,
            login: m.login,
            name: m.name,
            email: m.email,
            avatar_url: m.avatar_url,
            github_access_token: m.github_access_token,
            created_at: m.created_at,
            updated_at: m.updated_at,
        }
    }
}

impl From<User> for user::ActiveModel {
    fn from(u: User) -> Self {
        Self {
            id: sea_orm::Set(u.id.0),
            github_id: sea_orm::Set(u.github_id),
            login: sea_orm::Set(u.login),
            name: sea_orm::Set(u.name),
            email: sea_orm::Set(u.email),
            avatar_url: sea_orm::Set(u.avatar_url),
            github_access_token: sea_orm::Set(u.github_access_token),
            created_at: sea_orm::Set(u.created_at),
            updated_at: sea_orm::Set(u.updated_at),
        }
    }
}

// --- Workspace ---

impl From<workspace::Model> for Workspace {
    fn from(m: workspace::Model) -> Self {
        Self {
            id: WorkspaceId(m.id),
            creator_id: UserId(m.creator_id),
            name: m.name,
            slug: m.slug,
            description: m.description,
            avatar: m.avatar,
            instructions: m.instructions,
            repositories: m
                .repositories
                .as_ref()
                .map(|v| json_to_vec(v))
                .unwrap_or_default(),
            auto_pr_review: m.auto_pr_review,
            auto_issue_assign: m.auto_issue_assign,
            created_at: m.created_at,
            updated_at: m.updated_at,
        }
    }
}

impl From<Workspace> for workspace::ActiveModel {
    fn from(w: Workspace) -> Self {
        Self {
            id: sea_orm::Set(w.id.0),
            creator_id: sea_orm::Set(w.creator_id.0),
            name: sea_orm::Set(w.name),
            slug: sea_orm::Set(w.slug),
            description: sea_orm::Set(w.description),
            avatar: sea_orm::Set(w.avatar),
            instructions: sea_orm::Set(w.instructions),
            repositories: sea_orm::Set(Some(vec_to_json(&w.repositories))),
            auto_pr_review: sea_orm::Set(w.auto_pr_review),
            auto_issue_assign: sea_orm::Set(w.auto_issue_assign),
            created_at: sea_orm::Set(w.created_at),
            updated_at: sea_orm::Set(w.updated_at),
        }
    }
}

// --- WorkComputer ---

impl TryFrom<work_computer::Model> for WorkComputer {
    type Error = HiveError;

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
    type Error = HiveError;

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
    type Error = HiveError;

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

// --- WorkspaceMember ---

impl From<workspace_member::Model> for WorkspaceMember {
    fn from(m: workspace_member::Model) -> Self {
        Self {
            workspace_id: WorkspaceId(m.workspace_id),
            user_id: UserId(m.user_id),
            created_at: m.created_at,
        }
    }
}

impl From<WorkspaceMember> for workspace_member::ActiveModel {
    fn from(wm: WorkspaceMember) -> Self {
        Self {
            workspace_id: sea_orm::Set(wm.workspace_id.0),
            user_id: sea_orm::Set(wm.user_id.0),
            created_at: sea_orm::Set(wm.created_at),
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
