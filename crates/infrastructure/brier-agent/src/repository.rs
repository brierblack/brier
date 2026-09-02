use brier_error::Result;
use brier_type::id::*;
use brier_type::{Agent, AgentTeam, WorkComputer};
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::convert::DbErrExt;
use crate::entity::{agent, agent_team, work_computer};

// ---- Agent ----

pub async fn list_agents_by_workspace(
    db: &DatabaseConnection,
    workspace_id: WorkspaceId,
) -> Result<Vec<Agent>> {
    let models = agent::Entity::find()
        .filter(agent::Column::WorkspaceId.eq(workspace_id.0))
        .all(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    models.into_iter().map(Agent::try_from).collect()
}

pub async fn get_agent(db: &DatabaseConnection, agent_id: AgentId) -> Result<Option<Agent>> {
    let model = agent::Entity::find_by_id(agent_id.0)
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    model.map(Agent::try_from).transpose()
}

pub async fn create_agent(db: &DatabaseConnection, agent: Agent) -> Result<Agent> {
    let active: agent::ActiveModel = agent.into();
    let model = active.insert(db).await.map_err(DbErrExt::to_brier)?;
    Agent::try_from(model)
}

pub async fn update_agent(db: &DatabaseConnection, agent: Agent) -> Result<Agent> {
    let active: agent::ActiveModel = agent.into();
    let model = active.update(db).await.map_err(DbErrExt::to_brier)?;
    Agent::try_from(model)
}

pub async fn delete_agent(db: &DatabaseConnection, agent_id: AgentId) -> Result<()> {
    agent::Entity::delete_by_id(agent_id.0)
        .exec(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(())
}

// ---- AgentTeam ----

pub async fn list_teams_by_workspace(
    db: &DatabaseConnection,
    workspace_id: WorkspaceId,
) -> Result<Vec<AgentTeam>> {
    let models = agent_team::Entity::find()
        .filter(agent_team::Column::WorkspaceId.eq(workspace_id.0))
        .all(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    models.into_iter().map(AgentTeam::try_from).collect()
}

pub async fn get_team(db: &DatabaseConnection, team_id: AgentTeamId) -> Result<Option<AgentTeam>> {
    let model = agent_team::Entity::find_by_id(team_id.0)
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    model.map(AgentTeam::try_from).transpose()
}

pub async fn create_team(db: &DatabaseConnection, team: AgentTeam) -> Result<AgentTeam> {
    let active: agent_team::ActiveModel = team.into();
    let model = active.insert(db).await.map_err(DbErrExt::to_brier)?;
    AgentTeam::try_from(model)
}

// ---- WorkComputer ----

pub async fn list_work_computers_by_user(
    db: &DatabaseConnection,
    user_id: UserId,
) -> Result<Vec<WorkComputer>> {
    let models = work_computer::Entity::find()
        .filter(work_computer::Column::UserId.eq(user_id.0))
        .all(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    models.into_iter().map(WorkComputer::try_from).collect()
}

pub async fn get_work_computer(
    db: &DatabaseConnection,
    computer_id: WorkComputerId,
) -> Result<Option<WorkComputer>> {
    let model = work_computer::Entity::find_by_id(computer_id.0)
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    model.map(WorkComputer::try_from).transpose()
}

pub async fn create_work_computer(
    db: &DatabaseConnection,
    wc: WorkComputer,
) -> Result<WorkComputer> {
    let active: work_computer::ActiveModel = wc.into();
    let model = active.insert(db).await.map_err(DbErrExt::to_brier)?;
    WorkComputer::try_from(model)
}
