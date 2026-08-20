mod auth;
mod jwt;

use axum::routing::get;
use axum::Router;
use hive_config::AppConfig;
use hive_github_auth::GithubAuth;
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = AppConfig::from_env()?;

    let state = auth::AppState {
        github_auth: GithubAuth::new(config.github.clone()),
        jwt_secret: config.server.jwt_secret.clone(),
        frontend_url: config.server.frontend_url.clone(),
    };

    let index_path = format!("{}/index.html", config.server.frontend_dir);
    let serve_dir = ServeDir::new(&config.server.frontend_dir).fallback(ServeFile::new(&index_path));

    let app = Router::new()
        .route("/api/auth/github", get(auth::github_login))
        .route("/api/auth/github/callback", get(auth::github_callback))
        .route("/api/auth/me", get(auth::auth_me))
        .route("/api/auth/logout", get(auth::logout))
        .nest_service("/", serve_dir)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("{}:{}", config.server.host, config.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Hive server listening on http://{}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}
