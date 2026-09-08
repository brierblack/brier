use brier_error::Result;
use brier_type::enums::{AgentVisibility, PublicScope};
use brier_type::id::*;
use brier_type::{Agent, AgentTask, AgentTeam, Session, SessionMessage, WorkComputer};
use chrono::{DateTime, Utc};
use sea_orm::sea_query::extension::postgres::PgExpr;
use sea_orm::sea_query::Expr;
use sea_orm::sea_query::OnConflict;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set,
};

use crate::convert::{enum_to_string, DbErrExt};
use crate::entity::{
    agent, agent_task, agent_team, session, session_message, user_connect_token, work_computer,
};

/// Agent 字段级更新请求（None = 保持不变；work_computer_id 传 Some 表示换绑）。
pub struct AgentUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub avatar: Option<String>,
    pub runtime: Option<String>,
    /// 显式模型名；Some(None) = 清空（由 runtime 决定），None = 保持不变。
    pub model: Option<Option<String>>,
    pub workdir: Option<String>,
    pub visibility: Option<AgentVisibility>,
    pub public_scope: Option<PublicScope>,
    pub work_computer_id: Option<WorkComputerId>,
    /// 绑定/换绑时写入的电脑名（仅当 work_computer_id 为 Some 时生效）。
    pub work_computer_name: Option<String>,
}

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

/// 字段级更新（读改写）：None 字段保持不变；不存在返回 None。
pub async fn update_agent_fields(
    db: &DatabaseConnection,
    agent_id: AgentId,
    patch: AgentUpdate,
    now: DateTime<Utc>,
) -> Result<Option<Agent>> {
    let Some(m) = agent::Entity::find_by_id(agent_id.0)
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?
    else {
        return Ok(None);
    };

    let am = agent::ActiveModel {
        id: Set(m.id),
        workspace_id: Set(m.workspace_id),
        creator_id: Set(m.creator_id),
        work_computer_id: Set(patch.work_computer_id.map(|id| id.0).or(m.work_computer_id)),
        // 冗余的电脑名：绑定/换绑时随 id 一起写入（路由层保证已查出最新名字），未绑定时保留原值
        work_computer_name: Set(if patch.work_computer_id.is_some() {
            patch.work_computer_name.or(m.work_computer_name)
        } else {
            m.work_computer_name
        }),
        name: Set(patch.name.unwrap_or(m.name)),
        description: Set(patch.description.or(m.description)),
        avatar: Set(patch.avatar.or(m.avatar)),
        status: Set(m.status),
        visibility: Set(
            patch
                .visibility
                .map(|v| enum_to_string(&v))
                .unwrap_or(m.visibility),
        ),
        public_scope: Set(patch.public_scope.map(|s| enum_to_string(&s)).or(m.public_scope)),
        runtime: Set(patch.runtime.or(m.runtime)),
        model: Set(match &patch.model {
            Some(next) => next.clone(),
            None => m.model,
        }),
        concurrency: Set(m.concurrency),
        workdir: Set(patch.workdir.or(m.workdir)),
        last_active: Set(m.last_active),
        created_at: Set(m.created_at),
        updated_at: Set(now),
    };
    let model = am.update(db).await.map_err(DbErrExt::to_brier)?;
    Ok(Some(Agent::try_from(model)?))
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

/// 按工作电脑查询其上的 Agent（跨工作空间，Agent.work_computer_id 关联）。
pub async fn list_agents_by_work_computer(
    db: &DatabaseConnection,
    computer_id: WorkComputerId,
) -> Result<Vec<Agent>> {
    let models = agent::Entity::find()
        .filter(agent::Column::WorkComputerId.eq(computer_id.0))
        .all(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    models.into_iter().map(Agent::try_from).collect()
}

pub async fn create_work_computer(
    db: &DatabaseConnection,
    wc: WorkComputer,
) -> Result<WorkComputer> {
    let active: work_computer::ActiveModel = wc.into();
    let model = active.insert(db).await.map_err(DbErrExt::to_brier)?;
    WorkComputer::try_from(model)
}

// ---- WorkComputer：隧道接入（BRIER_TOKEN）----

/// 写入/刷新用户的接入令牌哈希（每用户一个活动令牌，冲突即覆盖）。
pub async fn set_connect_token(
    db: &DatabaseConnection,
    user_id: UserId,
    token_hash: &str,
) -> Result<()> {
    let now = Utc::now();
    user_connect_token::Entity::insert(user_connect_token::ActiveModel {
        id: Set(uuid::Uuid::new_v4()),
        user_id: Set(user_id.0),
        token_hash: Set(token_hash.to_string()),
        created_at: Set(now),
    })
    .on_conflict(
        OnConflict::column(user_connect_token::Column::UserId)
            .update_column(user_connect_token::Column::TokenHash)
            .update_column(user_connect_token::Column::CreatedAt)
            .to_owned(),
    )
    .exec(db)
    .await
    .map_err(DbErrExt::to_brier)?;
    Ok(())
}

/// 按令牌哈希反查所属用户（隧道握手鉴权）。
pub async fn find_user_by_connect_token(
    db: &DatabaseConnection,
    token_hash: &str,
) -> Result<Option<UserId>> {
    let model = user_connect_token::Entity::find()
        .filter(user_connect_token::Column::TokenHash.eq(token_hash))
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(model.map(|m| UserId(m.user_id)))
}

/// 按 (user_id, hostname) 查找电脑（upsert 前置查询）。
pub async fn find_work_computer_by_user_host(
    db: &DatabaseConnection,
    user_id: UserId,
    host: &str,
) -> Result<Option<work_computer::Model>> {
    let model = work_computer::Entity::find()
        .filter(work_computer::Column::UserId.eq(user_id.0))
        .filter(work_computer::Column::Host.eq(host))
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(model)
}

/// CLI Auth 上报：按 hostname 有则更新、无则创建，置 online 并回写心跳与版本。
pub async fn upsert_online_work_computer(
    db: &DatabaseConnection,
    user_id: UserId,
    hostname: &str,
    os: &str,
    runtimes: Option<&[String]>,
    version: Option<&str>,
    now: DateTime<Utc>,
) -> Result<work_computer::Model> {
    let runtimes_json = runtimes.map(|r| serde_json::to_string(r).unwrap_or_default());

    if let Some(existing) =
        find_work_computer_by_user_host(db, user_id, hostname).await?
    {
        let active = work_computer::ActiveModel {
            id: Set(existing.id),
            os: Set(os.to_string()),
            status: Set("online".to_string()),
            last_seen_at: Set(Some(now)),
            runtimes: Set(runtimes_json),
            version: Set(version.map(|v| v.to_string())),
            updated_at: Set(now),
            ..Default::default()
        };
        let model = active.update(db).await.map_err(DbErrExt::to_brier)?;
        return Ok(model);
    }

    let model = work_computer::ActiveModel {
        id: Set(uuid::Uuid::new_v4()),
        user_id: Set(user_id.0),
        name: Set(hostname.to_string()),
        computer_type: Set("local".to_string()),
        host: Set(hostname.to_string()),
        os: Set(os.to_string()),
        status: Set("online".to_string()),
        last_seen_at: Set(Some(now)),
        runtimes: Set(runtimes_json),
        version: Set(version.map(|v| v.to_string())),
        created_at: Set(now),
        updated_at: Set(now),
    }
    .insert(db)
    .await
    .map_err(DbErrExt::to_brier)?;
    Ok(model)
}

/// 心跳落点：更新 last_seen_at（registry 在线由连接维护）。
pub async fn touch_work_computer_heartbeat(
    db: &DatabaseConnection,
    computer_id: WorkComputerId,
    now: DateTime<Utc>,
) -> Result<()> {
    let active = work_computer::ActiveModel {
        id: Set(computer_id.0),
        last_seen_at: Set(Some(now)),
        updated_at: Set(now),
        ..Default::default()
    };
    active.update(db).await.map_err(DbErrExt::to_brier)?;
    Ok(())
}

/// 断开连接时置 offline。
pub async fn mark_work_computer_offline(
    db: &DatabaseConnection,
    computer_id: WorkComputerId,
) -> Result<()> {
    let now = Utc::now();
    let active = work_computer::ActiveModel {
        id: Set(computer_id.0),
        status: Set("offline".to_string()),
        updated_at: Set(now),
        ..Default::default()
    };
    active.update(db).await.map_err(DbErrExt::to_brier)?;
    Ok(())
}

/// 删除工作电脑（关联 agents.work_computer_id 由 FK ON DELETE SET NULL 自动清空，
/// 冗余的 work_computer_name 在此同步置空，避免残留已删除电脑的名字）。
pub async fn delete_work_computer(
    db: &DatabaseConnection,
    computer_id: WorkComputerId,
) -> Result<()> {
    agent::Entity::update_many()
        .set(agent::ActiveModel {
            work_computer_name: Set(None),
            ..Default::default()
        })
        .filter(agent::Column::WorkComputerId.eq(computer_id.0))
        .exec(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    work_computer::Entity::delete_by_id(computer_id.0)
        .exec(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(())
}

// ---- AgentTask ----

pub async fn list_agent_tasks_by_workspace(
    db: &DatabaseConnection,
    workspace_id: WorkspaceId,
) -> Result<Vec<AgentTask>> {
    let models = agent_task::Entity::find()
        .filter(agent_task::Column::WorkspaceId.eq(workspace_id.0))
        .order_by_desc(agent_task::Column::CreatedAt)
        .all(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    models.into_iter().map(AgentTask::try_from).collect()
}

pub async fn get_agent_task(db: &DatabaseConnection, task_id: TaskId) -> Result<Option<AgentTask>> {
    let model = agent_task::Entity::find_by_id(task_id.0)
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    model.map(AgentTask::try_from).transpose()
}

pub async fn create_agent_task(db: &DatabaseConnection, task: AgentTask) -> Result<AgentTask> {
    let active: agent_task::ActiveModel = task.into();
    let model = active.insert(db).await.map_err(DbErrExt::to_brier)?;
    AgentTask::try_from(model)
}

/// 任务从 pending 推进为 running（下发成功）；已非 pending（如并发收到完成）则不改。
pub async fn mark_task_running(
    db: &DatabaseConnection,
    task_id: TaskId,
    now: DateTime<Utc>,
) -> Result<bool> {
    let res = agent_task::Entity::update_many()
        .set(agent_task::ActiveModel {
            status: Set("running".to_string()),
            started_at: Set(Some(now)),
            updated_at: Set(now),
            ..Default::default()
        })
        .filter(agent_task::Column::Id.eq(task_id.0))
        .filter(agent_task::Column::Status.eq("pending"))
        .exec(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(res.rows_affected > 0)
}

/// 追加任务输出（仅运行中的任务；原子拼接避免并发 chunk 互相覆盖）。
pub async fn append_task_output(
    db: &DatabaseConnection,
    task_id: TaskId,
    computer_id: WorkComputerId,
    data: &str,
    now: DateTime<Utc>,
) -> Result<bool> {
    let res = agent_task::Entity::update_many()
        .col_expr(
            agent_task::Column::Output,
            Expr::col(agent_task::Column::Output).concat(data.to_string()),
        )
        .col_expr(agent_task::Column::UpdatedAt, Expr::value(now))
        .filter(agent_task::Column::Id.eq(task_id.0))
        .filter(agent_task::Column::ComputerId.eq(computer_id.0))
        .filter(agent_task::Column::Status.is_in(["pending", "running"]))
        .exec(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(res.rows_affected > 0)
}

/// 任务结束（正常退出）；仅运行/等待中的任务可推进，返回更新后的任务。
pub async fn finish_task(
    db: &DatabaseConnection,
    task_id: TaskId,
    computer_id: WorkComputerId,
    exit_code: i32,
    now: DateTime<Utc>,
) -> Result<Option<AgentTask>> {
    let res = agent_task::Entity::update_many()
        .set(agent_task::ActiveModel {
            status: Set("completed".to_string()),
            exit_code: Set(Some(exit_code)),
            finished_at: Set(Some(now)),
            updated_at: Set(now),
            ..Default::default()
        })
        .filter(agent_task::Column::Id.eq(task_id.0))
        .filter(agent_task::Column::ComputerId.eq(computer_id.0))
        .filter(agent_task::Column::Status.is_in(["pending", "running"]))
        .exec(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    if res.rows_affected == 0 {
        return Ok(None);
    }
    get_agent_task(db, task_id).await
}

/// 任务失败（runtime 执行报错）；返回更新后的任务。
pub async fn fail_task(
    db: &DatabaseConnection,
    task_id: TaskId,
    computer_id: WorkComputerId,
    error: &str,
    now: DateTime<Utc>,
) -> Result<Option<AgentTask>> {
    let res = agent_task::Entity::update_many()
        .set(agent_task::ActiveModel {
            status: Set("failed".to_string()),
            error: Set(Some(error.to_string())),
            finished_at: Set(Some(now)),
            updated_at: Set(now),
            ..Default::default()
        })
        .filter(agent_task::Column::Id.eq(task_id.0))
        .filter(agent_task::Column::ComputerId.eq(computer_id.0))
        .filter(agent_task::Column::Status.is_in(["pending", "running"]))
        .exec(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    if res.rows_affected == 0 {
        return Ok(None);
    }
    get_agent_task(db, task_id).await
}

/// 取消任务（用户手动取消）；返回更新后的任务，已终态返回 None。
pub async fn cancel_agent_task(
    db: &DatabaseConnection,
    task_id: TaskId,
    now: DateTime<Utc>,
) -> Result<Option<AgentTask>> {
    let res = agent_task::Entity::update_many()
        .set(agent_task::ActiveModel {
            status: Set("cancelled".to_string()),
            finished_at: Set(Some(now)),
            updated_at: Set(now),
            ..Default::default()
        })
        .filter(agent_task::Column::Id.eq(task_id.0))
        .filter(agent_task::Column::Status.is_in(["pending", "running"]))
        .exec(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    if res.rows_affected == 0 {
        return Ok(None);
    }
    get_agent_task(db, task_id).await
}

/// 刷新 Agent 最近活跃时间（任务创建/结束时调用）。
pub async fn touch_agent_activity(
    db: &DatabaseConnection,
    agent_id: AgentId,
    now: DateTime<Utc>,
) -> Result<()> {
    let active = agent::ActiveModel {
        id: Set(agent_id.0),
        last_active: Set(Some(now)),
        updated_at: Set(now),
        ..Default::default()
    };
    active.update(db).await.map_err(DbErrExt::to_brier)?;
    Ok(())
}

// ---- Session / SessionMessage ----

pub async fn list_sessions_by_workspace(
    db: &DatabaseConnection,
    workspace_id: WorkspaceId,
) -> Result<Vec<Session>> {
    let models = session::Entity::find()
        .filter(session::Column::WorkspaceId.eq(workspace_id.0))
        .order_by_desc(session::Column::UpdatedAt)
        .all(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    models.into_iter().map(Session::try_from).collect()
}

pub async fn get_session(db: &DatabaseConnection, session_id: SessionId) -> Result<Option<Session>> {
    let model = session::Entity::find_by_id(session_id.0)
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    model.map(Session::try_from).transpose()
}

pub async fn create_session(db: &DatabaseConnection, s: Session) -> Result<Session> {
    let active: session::ActiveModel = s.into();
    let model = active.insert(db).await.map_err(DbErrExt::to_brier)?;
    Session::try_from(model)
}

pub async fn delete_session(db: &DatabaseConnection, session_id: SessionId) -> Result<()> {
    session::Entity::delete_by_id(session_id.0)
        .exec(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(())
}

pub async fn list_messages_by_session(
    db: &DatabaseConnection,
    session_id: SessionId,
) -> Result<Vec<SessionMessage>> {
    let models = session_message::Entity::find()
        .filter(session_message::Column::SessionId.eq(session_id.0))
        .order_by_asc(session_message::Column::CreatedAt)
        .all(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    models.into_iter().map(SessionMessage::try_from).collect()
}

/// 追加一条消息并刷新会话 updated_at（列表排序依据）。
pub async fn append_session_message(
    db: &DatabaseConnection,
    msg: SessionMessage,
    now: DateTime<Utc>,
) -> Result<SessionMessage> {
    let active: session_message::ActiveModel = msg.into();
    let model = active.insert(db).await.map_err(DbErrExt::to_brier)?;
    session::Entity::update_many()
        .set(session::ActiveModel {
            updated_at: Set(now),
            ..Default::default()
        })
        .filter(session::Column::Id.eq(model.session_id))
        .exec(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    SessionMessage::try_from(model)
}
