use chrono::Utc;
use brier_error::{BrierError, Result};
use brier_type::id::UserId;
use brier_type::User;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    QueryFilter, TransactionTrait,
};

use crate::convert::DbErrExt;
use crate::entity::{user, user_identity};

/// 第三方身份提供方提供的用户资料（用于创建/更新账户本体）。
pub struct IdentityProfile<'a> {
    pub username: &'a str,
    pub name: Option<&'a str>,
    pub email: Option<&'a str>,
    pub avatar_url: Option<&'a str>,
}

pub async fn find_user_by_id(db: &DatabaseConnection, id: UserId) -> Result<Option<User>> {
    let model = user::Entity::find_by_id(id.0)
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(model.map(User::try_from).transpose()?)
}

/// 按 (provider, provider_uid) 查找用户（OAuth 登录的主入口）。
pub async fn find_user_by_provider(
    db: &DatabaseConnection,
    provider: &str,
    provider_uid: &str,
) -> Result<Option<User>> {
    let identity = user_identity::Entity::find()
        .filter(user_identity::Column::Provider.eq(provider))
        .filter(user_identity::Column::ProviderUid.eq(provider_uid))
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    let Some(identity) = identity else {
        return Ok(None);
    };
    let user_model = user::Entity::find_by_id(identity.user_id)
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(user_model.map(User::try_from).transpose()?)
}

/// 通过第三方身份查找或创建用户；登录成功后更新资料与 last_login_at。
/// user + identity 的创建在事务内完成，避免出现悬空身份。
pub async fn find_or_create_user_by_identity(
    db: &DatabaseConnection,
    provider: &str,
    provider_uid: &str,
    profile: &IdentityProfile<'_>,
    access_token: Option<&str>,
) -> Result<User> {
    // 已存在：更新资料 + access_token + last_login_at
    if let Some(identity) = user_identity::Entity::find()
        .filter(user_identity::Column::Provider.eq(provider))
        .filter(user_identity::Column::ProviderUid.eq(provider_uid))
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?
    {
        let now = Utc::now();
        let mut user_active: user::ActiveModel = user::Entity::find_by_id(identity.user_id)
            .one(db)
            .await
            .map_err(DbErrExt::to_brier)?
            .ok_or_else(|| BrierError::NotFound("user not found".into()))?
            .into();
        user_active.name = sea_orm::Set(profile.name.map(|s| s.to_string()));
        user_active.email = sea_orm::Set(profile.email.map(|s| s.to_string()));
        user_active.avatar_url = sea_orm::Set(profile.avatar_url.map(|s| s.to_string()));
        user_active.last_login_at = sea_orm::Set(Some(now));
        user_active.updated_at = sea_orm::Set(now);
        let model = user_active.update(db).await.map_err(DbErrExt::to_brier)?;

        let mut identity_active: user_identity::ActiveModel = identity.into();
        identity_active.access_token = sea_orm::Set(access_token.map(|s| s.to_string()));
        identity_active.updated_at = sea_orm::Set(now);
        identity_active.update(db).await.map_err(DbErrExt::to_brier)?;

        return User::try_from(model);
    }

    // 不存在：事务内创建 user + identity
    let txn = db.begin().await.map_err(DbErrExt::to_brier)?;
    let now = Utc::now();
    let username = unique_username(&txn, profile.username).await?;

    let user_model = user::ActiveModel {
        username: sea_orm::Set(username),
        name: sea_orm::Set(profile.name.map(|s| s.to_string())),
        email: sea_orm::Set(profile.email.map(|s| s.to_string())),
        avatar_url: sea_orm::Set(profile.avatar_url.map(|s| s.to_string())),
        last_login_at: sea_orm::Set(Some(now)),
        updated_at: sea_orm::Set(now),
        ..Default::default()
    }
    .insert(&txn)
    .await
    .map_err(DbErrExt::to_brier)?;

    user_identity::ActiveModel {
        user_id: sea_orm::Set(user_model.id),
        provider: sea_orm::Set(provider.to_string()),
        provider_uid: sea_orm::Set(provider_uid.to_string()),
        access_token: sea_orm::Set(access_token.map(|s| s.to_string())),
        created_at: sea_orm::Set(now),
        updated_at: sea_orm::Set(now),
        ..Default::default()
    }
    .insert(&txn)
    .await
    .map_err(DbErrExt::to_brier)?;

    txn.commit().await.map_err(DbErrExt::to_brier)?;
    User::try_from(user_model)
}

/// 生成唯一 username：base 被占用时追加 4 位随机后缀。
async fn unique_username(txn: &DatabaseTransaction, base: &str) -> Result<String> {
    let taken = user::Entity::find()
        .filter(user::Column::Username.eq(base))
        .one(txn)
        .await
        .map_err(DbErrExt::to_brier)?
        .is_some();
    if taken {
        let suffix: String = uuid::Uuid::new_v4().simple().to_string()[..4].to_string();
        Ok(format!("{base}-{suffix}"))
    } else {
        Ok(base.to_string())
    }
}

/// 获取指定 Provider 的访问令牌（如 GitHub API 调用所需）。
pub async fn get_provider_token(
    db: &DatabaseConnection,
    user_id: UserId,
    provider: &str,
) -> Result<Option<String>> {
    let identity = user_identity::Entity::find()
        .filter(user_identity::Column::UserId.eq(user_id.0))
        .filter(user_identity::Column::Provider.eq(provider))
        .one(db)
        .await
        .map_err(DbErrExt::to_brier)?;
    Ok(identity.and_then(|m| m.access_token))
}
