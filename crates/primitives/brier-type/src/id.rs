use serde::{Deserialize, Serialize};
use uuid::Uuid;

macro_rules! define_id {
    ($name:ident, $doc:expr) => {
        #[doc = $doc]
        #[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
        pub struct $name(pub Uuid);

        impl $name {
            pub fn new() -> Self {
                Self(Uuid::new_v4())
            }
        }

        impl std::fmt::Display for $name {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", self.0)
            }
        }

        impl std::str::FromStr for $name {
            type Err = uuid::Error;

            fn from_str(s: &str) -> Result<Self, Self::Err> {
                Ok(Self(Uuid::parse_str(s)?))
            }
        }
    };
}

define_id!(UserId, "用户唯一标识");
define_id!(WorkspaceId, "工作空间唯一标识");
define_id!(WorkComputerId, "工作电脑唯一标识");
define_id!(AgentId, "Agent 唯一标识");
define_id!(AgentTeamId, "Agent 团队唯一标识");
define_id!(TaskId, "Agent 任务唯一标识");
define_id!(SessionId, "会话唯一标识");
define_id!(SessionMessageId, "会话消息唯一标识");
