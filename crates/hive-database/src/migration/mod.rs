pub mod m20250821_000001_initial;

use sea_orm_migration::MigratorTrait;

pub struct Migrator;

impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn sea_orm_migration::MigrationTrait>> {
        vec![Box::new(m20250821_000001_initial::Migration)]
    }
}
