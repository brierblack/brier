use axum::Router;
use axum::extract::DefaultBodyLimit;
use hive_config::AppConfig;
use hive_database::{connect, run_migrations};
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

    let state = hive_api::AppState::new(&config, db);

    let index_path = format!("{}/index.html", config.server.frontend_dir);
    let serve_dir = ServeDir::new(&config.server.frontend_dir).fallback(ServeFile::new(&index_path));

    let api_router = hive_api::router(state);

    let app = Router::new()
        .merge(api_router)
        .fallback_service(serve_dir)
        .layer(DefaultBodyLimit::max(10 * 1024 * 1024))
        .layer(TraceLayer::new_for_http());

    let addr = format!("{}:{}", config.server.host, config.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Hive server listening on http://{}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}
