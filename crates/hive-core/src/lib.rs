pub use hive_error::{HiveError, Result};
use serde::{Deserialize, Serialize};

pub mod tunnel;

pub mod auth {
    use super::{Deserialize, Serialize};

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct UserInfo {
        pub id: u64,
        pub login: String,
        pub name: Option<String>,
        pub email: Option<String>,
        pub avatar_url: Option<String>,
    }

    pub trait AuthProvider {
        fn provider_name(&self) -> &str;
    }
}
