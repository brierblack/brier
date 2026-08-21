use thiserror::Error;

pub type Result<T> = std::result::Result<T, HiveError>;

#[derive(Debug, Error)]
pub enum HiveError {
    #[error("config error: {0}")]
    Config(String),

    #[error("auth error: {0}")]
    Auth(String),

    #[error("github api error: {0}")]
    GithubApi(String),

    #[error("jwt error: {0}")]
    Jwt(String),

    #[error("server error: {0}")]
    Server(String),

    #[error("database error: {0}")]
    Database(String),

    #[error("entity not found: {0}")]
    NotFound(String),

    #[error("validation error: {0}")]
    Validation(String),

    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Db(#[from] sea_orm::DbErr),
}
