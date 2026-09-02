use sea_orm::{Database, DatabaseConnection};
use sea_orm_migration::MigratorTrait;

use brier_error::{BrierError, Result};

use crate::migration::Migrator;

trait DbErrExt {
    fn to_brier(self) -> BrierError;
}

impl DbErrExt for sea_orm::DbErr {
    fn to_brier(self) -> BrierError {
        BrierError::Database(self.to_string())
    }
}

pub async fn connect(database_url: &str) -> Result<DatabaseConnection> {
    let db = Database::connect(database_url)
        .await
        .map_err(DbErrExt::to_brier)?;
    tracing::info!("database connected");
    Ok(db)
}

pub async fn run_migrations(db: &DatabaseConnection) -> Result<()> {
    Migrator::up(db, None)
        .await
        .map_err(DbErrExt::to_brier)?;
    tracing::info!("database migrations completed");
    Ok(())
}
