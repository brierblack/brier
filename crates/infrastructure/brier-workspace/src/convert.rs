use brier_error::BrierError;
use brier_type::id::*;
use brier_type::*;

use crate::entity::{workspace, workspace_member};

pub trait DbErrExt {
    fn to_brier(self) -> BrierError;
}

impl DbErrExt for sea_orm::DbErr {
    fn to_brier(self) -> BrierError {
        BrierError::Database(self.to_string())
    }
}

fn json_to_vec(v: &serde_json::Value) -> Vec<String> {
    serde_json::from_value(v.clone()).unwrap_or_default()
}

fn vec_to_json(v: &[String]) -> serde_json::Value {
    serde_json::to_value(v).unwrap_or_default()
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
