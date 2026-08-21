use sea_orm::{Database, DatabaseConnection};
use sea_orm_migration::MigratorTrait;

use hive_error::Result;

use crate::migration::Migrator;

pub async fn connect(database_url: &str) -> Result<DatabaseConnection> {
    let db = Database::connect(database_url).await?;
    tracing::info!("database connected");
    Ok(db)
}

pub async fn run_migrations(db: &DatabaseConnection) -> Result<()> {
    Migrator::up(db, None).await?;
    tracing::info!("database migrations completed");
    Ok(())
}
