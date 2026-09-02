use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::Utc;
use serde::{Deserialize, Serialize};

use brier_error::BrierError;
use brier_type::enums::{WorkComputerStatus, WorkComputerType};
use brier_type::id::WorkComputerId;
use brier_type::WorkComputer;

use crate::error::ApiError;
use crate::routes::current_user;
use crate::AppState;

#[derive(Deserialize, utoipa::ToSchema)]
pub struct CreateWorkComputerRequest {
    pub name: String,
    pub computer_type: WorkComputerType,
    pub host: String,
    pub os: String,
}

/// 接入令牌响应：原文只在生成时返回一次，服务端仅存哈希。
#[derive(Serialize, utoipa::ToSchema)]
pub struct ConnectTokenResponse {
    pub token: String,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/api/work-computers",
            get(list_work_computers).post(create_work_computer),
        )
        .route(
            "/api/work-computers/connect-token",
            post(create_connect_token),
        )
        .route(
            "/api/work-computers/{computer_id}",
            get(get_work_computer).delete(delete_work_computer),
        )
}

#[utoipa::path(
    get,
    path = "/api/work-computers",
    responses(
        (status = 200, description = "当前用户的工作电脑列表", body = [WorkComputer]),
        (status = 401, description = "未登录")
    )
)]
pub(crate) async fn list_work_computers(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<WorkComputer>>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let computers =
        brier_agent::repository::list_work_computers_by_user(&state.db, user.id).await?;
    Ok(Json(computers))
}

#[utoipa::path(
    post,
    path = "/api/work-computers",
    request_body = CreateWorkComputerRequest,
    responses(
        (status = 200, description = "创建成功", body = WorkComputer),
        (status = 401, description = "未登录"),
        (status = 400, description = "请求体不合法")
    )
)]
pub(crate) async fn create_work_computer(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<CreateWorkComputerRequest>,
) -> Result<Json<WorkComputer>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let now = Utc::now();
    let wc = WorkComputer {
        id: WorkComputerId::new(),
        user_id: user.id,
        name: req.name,
        computer_type: req.computer_type,
        host: req.host,
        os: req.os,
        status: WorkComputerStatus::Offline,
        last_seen_at: None,
        created_at: now,
        updated_at: now,
    };
    let created = brier_agent::repository::create_work_computer(&state.db, wc).await?;
    Ok(Json(created))
}

/// 生成/刷新当前用户的接入令牌（BRIER_TOKEN），供 CLI 隧道连接使用。
/// 每用户仅保留一个活动令牌：再次调用即旧令牌失效。
#[utoipa::path(
    post,
    path = "/api/work-computers/connect-token",
    responses(
        (status = 200, description = "接入令牌（原文仅此一次返回，请立即使用）", body = ConnectTokenResponse),
        (status = 401, description = "未登录")
    )
)]
pub(crate) async fn create_connect_token(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<ConnectTokenResponse>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let token = brier_crypto::generate_token();
    let hash = brier_crypto::hash_token(&token);
    brier_agent::repository::set_connect_token(&state.db, user.id, &hash).await?;
    Ok(Json(ConnectTokenResponse { token }))
}

#[utoipa::path(
    get,
    path = "/api/work-computers/{computer_id}",
    params(("computer_id" = WorkComputerId, Path, description = "工作电脑 ID")),
    responses(
        (status = 200, description = "工作电脑详情", body = WorkComputer),
        (status = 401, description = "未登录"),
        (status = 404, description = "工作电脑不存在")
    )
)]
pub(crate) async fn get_work_computer(
    State(state): State<AppState>,
    Path(computer_id): Path<WorkComputerId>,
    headers: HeaderMap,
) -> Result<Json<WorkComputer>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let wc = brier_agent::repository::get_work_computer(&state.db, computer_id)
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("work computer not found".into())))?;
    if wc.user_id != user.id {
        return Err(ApiError(BrierError::NotFound("work computer not found".into())));
    }
    Ok(Json(wc))
}

/// 删除工作电脑（需本人；关联的 Agent 自动解除绑定）。
#[utoipa::path(
    delete,
    path = "/api/work-computers/{computer_id}",
    params(("computer_id" = WorkComputerId, Path, description = "工作电脑 ID")),
    responses(
        (status = 200, description = "删除成功"),
        (status = 401, description = "未登录"),
        (status = 404, description = "工作电脑不存在")
    )
)]
pub(crate) async fn delete_work_computer(
    State(state): State<AppState>,
    Path(computer_id): Path<WorkComputerId>,
    headers: HeaderMap,
) -> Result<Json<()>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let wc = brier_agent::repository::get_work_computer(&state.db, computer_id)
        .await?
        .ok_or_else(|| ApiError(BrierError::NotFound("work computer not found".into())))?;
    if wc.user_id != user.id {
        return Err(ApiError(BrierError::NotFound("work computer not found".into())));
    }
    brier_agent::repository::delete_work_computer(&state.db, computer_id).await?;
    Ok(Json(()))
}
