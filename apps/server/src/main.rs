use axum::Router;
use axum::extract::DefaultBodyLimit;
use brier_config::AppConfig;
use brier_database::{connect, run_migrations};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let _ = dotenvy::dotenv();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = AppConfig::from_env()?;

    let db = connect(&config.server.database_url).await?;
    run_migrations(&db).await?;

    let state = brier_api::AppState::new(&config, db);

    // 可选导出：OPENAPI_OUT=<path> cargo run 时把 OpenAPI spec 写入指定文件
    // （供 Orval 等工具消费，如 OPENAPI_OUT=apps/web/openapi.json）。
    if let Ok(path) = std::env::var("OPENAPI_OUT") {
        std::fs::write(&path, brier_api::docs::ApiDoc::json())?;
        tracing::info!("OpenAPI spec exported to {}", path);
    }

    let index_path = format!("{}/index.html", config.server.frontend_dir);
    let serve_dir = ServeDir::new(&config.server.frontend_dir).fallback(ServeFile::new(&index_path));

    let api_router = brier_api::router(state);

    let app = Router::new()
        .merge(api_router)
        .fallback_service(serve_dir)
        .layer(DefaultBodyLimit::max(10 * 1024 * 1024))
        .layer(TraceLayer::new_for_http());

    let addr = format!("{}:{}", config.server.host, config.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Brier server listening on http://{}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}
