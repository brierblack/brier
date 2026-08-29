//! OpenAPI 文档聚合与导出。
//!
//! 所有标注了 `#[utoipa::path]` 的 handler 在此聚合，生成 OpenAPI 3.1 spec；
//! Swagger UI 挂载于 `/docs`，spec JSON 暴露于 `/api-docs/openapi.json`。
//! 也可通过 `ApiDoc::json()` 在构建期导出 `openapi.json`（供 Orval 等工具消费）。

use brier_contract::repo::RepoInfo;
use brier_type::{User, Workspace};
use utoipa::OpenApi;

use crate::routes::workspace::CreateWorkspaceRequest;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Brier API",
        description = "AI Agent 工作空间平台",
        version = "0.1.0"
    ),
    paths(
        crate::routes::auth::provider_login,
        crate::routes::auth::provider_callback,
        crate::routes::auth::auth_me,
        crate::routes::auth::logout,
        crate::routes::workspace::create_workspace,
        crate::routes::workspace::list_workspaces,
        crate::routes::forge::list_repos,
    ),
    components(schemas(User, Workspace, RepoInfo, CreateWorkspaceRequest))
)]
pub struct ApiDoc;

impl ApiDoc {
    /// 序列化完整 OpenAPI spec（JSON 字符串），用于导出到文件。
    pub fn json() -> String {
        ApiDoc::openapi().to_json().expect("serialize openapi spec")
    }
}

/// HTTP handler：返回完整 OpenAPI spec（`GET /api-docs/openapi.json`）。
pub async fn serve_openapi_json() -> axum::Json<utoipa::openapi::OpenApi> {
    axum::Json(ApiDoc::openapi())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn openapi_serializes_with_paths_and_schemas() {
        let json = ApiDoc::json();
        assert!(json.contains("Brier API"));
        assert!(json.contains("/api/auth/me"));
        assert!(json.contains("/api/{provider}/repos"));
        assert!(json.contains("RepoInfo"));
        assert!(json.contains("Workspace"));
    }

    /// 导出 spec 到文件：`OPENAPI_OUT=apps/web/openapi.json cargo test -p brier-api export_openapi_json`
    /// 相对路径基于 workspace 根（crate 目录上溯 3 级）解析，与运行目录无关。
    #[test]
    fn export_openapi_json() {
        if let Ok(path) = std::env::var("OPENAPI_OUT") {
            let p = std::path::PathBuf::from(&path);
            let p = if p.is_absolute() {
                p
            } else {
                std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                    .ancestors()
                    .nth(3)
                    .expect("workspace root")
                    .join(p)
            };
            std::fs::write(&p, ApiDoc::json()).expect("write openapi.json");
        }
    }
}
