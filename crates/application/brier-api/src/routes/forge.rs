use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::Json;
use brier_contract::repo::RepoInfo;
use brier_error::BrierError;

use crate::error::ApiError;
use crate::routes::current_user;
use crate::AppState;

/// 列出指定 provider 下当前用户的仓库（需登录 + 已绑定该 provider 令牌）。
/// 未注册的 provider 返回 404；provider 有配置但未绑定令牌返回 Auth 错误。
#[utoipa::path(
    get,
    path = "/api/{provider}/repos",
    params(("provider", description = "代码托管平台名，如 github / gitee")),
    responses(
        (status = 200, description = "仓库列表", body = [RepoInfo]),
        (status = 401, description = "未登录或未绑定令牌"),
        (status = 404, description = "未知 provider")
    )
)]
pub(crate) async fn list_repos(
    State(state): State<AppState>,
    Path(provider): Path<String>,
    headers: HeaderMap,
) -> Result<Json<Vec<RepoInfo>>, ApiError> {
    let user = current_user(&state, &headers).await?;
    let provider_obj = state
        .providers
        .get_repository(&provider)
        .ok_or_else(|| ApiError(BrierError::NotFound(format!("unknown provider: {provider}"))))?;
    let token = brier_user::repository::get_provider_token(&state.db, user.id, &provider)
        .await?
        .ok_or_else(|| ApiError(BrierError::Auth(format!("{provider} token not found"))))?;
    let repos = provider_obj.list_repos(&token).await?;
    Ok(Json(repos))
}
