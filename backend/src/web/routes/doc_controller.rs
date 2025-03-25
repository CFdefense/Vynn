// src/controllers/user_controller.rs
// Request Handlers
use crate::models::document::{CreateDocumentPayload, Document, UpdateDocumentPayload};
use crate::models::permission::{CreatePermissionPayload, UpdatePermissionPayload};
use crate::{Error, Result};
use axum::routing::{delete, get, post, put};
use axum::{
    extract::{Extension, Json, Path},
    Router,
};
use serde_json::{json, Value};
use sqlx::PgPool;
use tower_cookies::Cookies;
use axum::http::StatusCode;
use axum::response::IntoResponse;

// Helper function to extract user ID from auth cookie
fn get_user_id_from_cookie(cookies: &Cookies) -> Option<i32> {
    cookies.get("auth-token")
        .and_then(|cookie| {
            let value = cookie.value();
            // Parse user ID from cookie value (format: "user-{id}.exp.sign")
            value.strip_prefix("user-")
                .and_then(|s| s.split('.').next())
                .and_then(|id_str| id_str.parse::<i32>().ok())
        })
}

/// GET handler for retrieving a document by ID.
/// Accessible via: GET /api/document/:id
pub async fn api_get_document(
    cookies: Cookies,
    Path(document_id): Path<i32>,
    Extension(pool): Extension<PgPool>,
) -> impl axum::response::IntoResponse {
    println!("->> {:<12} - get_document", "HANDLER");

    // Get user ID from cookie
    let user_id = match get_user_id_from_cookie(&cookies) {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(json!({
            "error": "Not authenticated"
        }))).into_response()
    };

    // Check if document exists first
    let doc_exists = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM documents WHERE id = $1) as exists",
        document_id
    )
    .fetch_one(&pool)
    .await;

    if let Ok(result) = doc_exists {
        if !result.exists.unwrap_or(false) {
            // Document doesn't exist
            return (StatusCode::NOT_FOUND, Json(json!({
                "error": "Document not found"
            }))).into_response();
        }
    }

    // Check if user has permission to access this document
    match check_document_permission(&pool, user_id, document_id, "viewer").await {
        Ok(has_permission) => {
            if !has_permission {
                return (StatusCode::FORBIDDEN, Json(json!({
                    "error": "You don't have permission to access this document"
                }))).into_response();
            }
        },
        Err(_) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "error": "Failed to check document permissions"
            }))).into_response();
        }
    }

    let result = sqlx::query_as!(
        Document,
        r#"SELECT 
            id, 
            name, 
            content, 
            created_at, 
            updated_at, 
            user_id 
        FROM documents WHERE id = $1"#,
        document_id
    )
    .fetch_one(&pool)
    .await;

    match result {
        Ok(document) => (StatusCode::OK, Json(document)).into_response(),
        Err(e) => {
            println!("Error fetching document: {:?}", e);
            (StatusCode::NOT_FOUND, Json(json!({
                "error": "Document not found"
            }))).into_response()
        },
    }
}

/// POST handler for creating a new document.
/// Accessible via: POST /api/document
pub async fn api_create_document(
    cookies: Cookies,
    Extension(pool): Extension<PgPool>,
    Json(mut payload): Json<CreateDocumentPayload>,
) -> impl axum::response::IntoResponse {
    use axum::http::StatusCode;
    use axum::response::IntoResponse;
    
    println!("->> {:<12} - create_document", "HANDLER");

    // Validate inputs
    if payload.name.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({
            "error": "Document name cannot be empty"
        }))).into_response();
    }

    // Get user ID from cookie
    let user_id = match get_user_id_from_cookie(&cookies) {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(json!({
            "error": "Not authenticated"
        }))).into_response()
    };

    // Override the user_id in the payload with the authenticated user
    payload.user_id = Some(user_id);

    // First insert the document
    let result = sqlx::query!(
        "INSERT INTO documents (name, content, user_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id",
        payload.name,
        payload.content,
        payload.user_id,
        payload.created_at,
        payload.updated_at
    )
    .fetch_one(&pool)
    .await;

    // Check if insertion was successful
    match result {
        Ok(record) => {
            // Also add owner permission
            match sqlx::query!(
                "INSERT INTO document_permissions (document_id, user_id, role)
                VALUES ($1, $2, 'owner')",
                record.id,
                user_id
            )
            .execute(&pool)
            .await {
                Ok(_) => {
                    // Permission granted successfully
                },
                Err(e) => {
                    println!("Error granting document permission: {:?}", e);
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                        "error": "Document created but failed to grant owner permission"
                    }))).into_response();
                }
            }

            // Then fetch the document by id
            let document = sqlx::query_as!(
                Document,
                r#"SELECT 
                    id, 
                    name, 
                    content,
                    created_at,
                    updated_at,
                    user_id 
                FROM documents WHERE id = $1"#,
                record.id
            )
            .fetch_one(&pool)
            .await;

            match document {
                Ok(document) => (StatusCode::CREATED, Json(document)).into_response(),
                Err(e) => {
                    println!("Error fetching newly created document: {:?}", e);
                    // Even though we couldn't fetch it, creation was successful
                    (StatusCode::CREATED, Json(json!({
                        "id": record.id,
                        "message": "Document created successfully"
                    }))).into_response()
                }
            }
        }
        Err(e) => {
            println!("Error creating document: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "error": "Failed to create document"
            }))).into_response()
        }
    }
}

async fn check_document_permission(
    pool: &PgPool,
    user_id: i32,
    document_id: i32,
    required_role: &str,
) -> Result<bool> {
    let result = sqlx::query!(
        r#"SELECT role FROM document_permissions 
           WHERE document_id = $1 AND user_id = $2"#,
        document_id,
        user_id
    )
    .fetch_optional(pool)
    .await;

    match result {
        Ok(Some(record)) => {
            let has_permission = match required_role {
                "viewer" => true, // Any role can view
                "editor" => record.role == "editor" || record.role == "owner",
                "owner" => record.role == "owner",
                _ => false,
            };

            Ok(has_permission)
        }
        Ok(None) => Ok(false),
        Err(e) => {
            println!("Error checking permission: {:?}", e);
            Err(Error::PermissionError)
        }
    }
}

pub async fn api_update_document(
    cookies: Cookies,
    Path(document_id): Path<i32>,
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<UpdateDocumentPayload>,
) -> impl axum::response::IntoResponse {
    println!("->> {:<12} - update_document", "HANDLER");

    // Validate inputs
    if payload.name.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({
            "error": "Document name cannot be empty"
        }))).into_response();
    }

    // Get user ID from cookie
    let user_id = match get_user_id_from_cookie(&cookies) {
        Some(id) => id,
        None => return (StatusCode::UNAUTHORIZED, Json(json!({
            "error": "Not authenticated"
        }))).into_response()
    };

    // Check if document exists
    let doc_exists = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM documents WHERE id = $1) as exists",
        document_id
    )
    .fetch_one(&pool)
    .await;

    if let Ok(result) = doc_exists {
        if !result.exists.unwrap_or(false) {
            // Document doesn't exist
            return (StatusCode::NOT_FOUND, Json(json!({
                "error": "Document not found"
            }))).into_response();
        }
    } else {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
            "error": "Failed to check if document exists"
        }))).into_response();
    }

    // Check if user has permission to edit this document
    match check_document_permission(&pool, user_id, document_id, "editor").await {
        Ok(has_permission) => {
            if !has_permission {
                return (StatusCode::FORBIDDEN, Json(json!({
                    "error": "You don't have permission to edit this document"
                }))).into_response();
            }
        },
        Err(_) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "error": "Failed to check document permissions"
            }))).into_response();
        }
    }

    // Update document
    let result = sqlx::query!(
        "UPDATE documents
         SET name = $1, content = $2, updated_at = $3
         WHERE id = $4 RETURNING id, name, content, created_at, updated_at, user_id",
        payload.name,
        payload.content,
        payload.updated_at,
        document_id
    )
    .fetch_one(&pool)
    .await;

    match result {
        Ok(row) => {
            let document = Document {
                id: row.id,
                name: row.name,
                content: row.content,
                created_at: row.created_at,
                updated_at: row.updated_at,
                user_id: row.user_id,
            };
            
            (StatusCode::OK, Json(document)).into_response()
        },
        Err(e) => {
            println!("Error updating document: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "error": "Failed to update document"
            }))).into_response()
        },
    }
}

/// Grant permission to a user for a document
pub async fn grant_document_permission(
    cookies: Cookies,
    Path(document_id): Path<i32>,
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<CreatePermissionPayload>,
) -> Result<Json<Value>> {
    println!("->> {:<12} - grant_document_permission", "HANDLER");

    // Get user ID from cookie
    let user_id = match get_user_id_from_cookie(&cookies) {
        Some(id) => id,
        None => return Err(Error::AuthError)
    };

    // Check if user is the owner
    let has_permission = check_document_permission(&pool, user_id, document_id, "owner").await?;
    if !has_permission {
        return Err(Error::PermissionDeniedError);
    }

    // Insert permission
    let result = sqlx::query!(
        "INSERT INTO document_permissions (document_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (document_id, user_id) 
        DO UPDATE SET role = $3
        RETURNING document_id",
        document_id,
        payload.user_id,
        payload.role
    )
    .fetch_one(&pool)
    .await;

    match result {
        Ok(_) => Ok(Json(json!({
            "result": {
                "success": true
            }
        }))),
        Err(e) => {
            println!("Error creating document permission: {:?}", e);
            Err(Error::PermissionError)
        }
    }
}

/// Get all users with access to a document
pub async fn get_document_users(
    cookies: Cookies,
    Path(document_id): Path<i32>,
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Value>> {
    println!("->> {:<12} - get_document_users", "HANDLER");

    // Get user ID from cookie
    let user_id = match get_user_id_from_cookie(&cookies) {
        Some(id) => id,
        None => return Err(Error::AuthError)
    };

    // Check if user has at least viewer access
    let has_permission = check_document_permission(&pool, user_id, document_id, "viewer").await?;
    if !has_permission {
        return Err(Error::PermissionDeniedError);
    }

    // Query users with permission to this document
    let rows = sqlx::query!(
        r#"
        SELECT 
            u.id, 
            u.name, 
            u.email, 
            dp.role 
        FROM 
            users u
        JOIN 
            document_permissions dp ON u.id = dp.user_id
        WHERE 
            dp.document_id = $1
        "#,
        document_id
    )
    .fetch_all(&pool)
    .await;

    match rows {
        Ok(records) => {
            let users: Vec<serde_json::Value> = records
                .into_iter()
                .map(|record| {
                    json!({
                        "id": record.id,
                        "name": record.name,
                        "email": record.email,
                        "role": record.role
                    })
                })
                .collect();

            Ok(Json(json!({ "users": users })))
        }
        Err(e) => {
            println!("Error fetching document users: {:?}", e);
            Err(Error::DatabaseError)
        }
    }
}

/// Update a user's permission for a document
pub async fn update_document_permission(
    cookies: Cookies,
    Path(document_id): Path<i32>,
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<UpdatePermissionPayload>,
) -> Result<Json<Value>> {
    println!("->> {:<12} - update_document_permission", "HANDLER");

    // Get user ID from cookie
    let user_id = match get_user_id_from_cookie(&cookies) {
        Some(id) => id,
        None => return Err(Error::AuthError)
    };

    // Check if user is the owner
    let has_permission = check_document_permission(&pool, user_id, document_id, "owner").await?;
    if !has_permission {
        return Err(Error::PermissionDeniedError);
    }

    // Prevent owners from downgrading their own access
    if user_id == payload.user_id && payload.role != "owner" {
        return Err(Error::PermissionError);
    }

    // Update permission
    let result = sqlx::query!(
        "UPDATE document_permissions 
         SET role = $1 
         WHERE document_id = $2 AND user_id = $3
         RETURNING document_id",
        payload.role,
        document_id,
        payload.user_id
    )
    .fetch_one(&pool)
    .await;

    match result {
        Ok(_) => Ok(Json(json!({
            "result": {
                "success": true
            }
        }))),
        Err(e) => {
            println!("Error updating document permission: {:?}", e);
            Err(Error::PermissionError)
        }
    }
}

/// Remove a user's permission for a document
pub async fn remove_document_permission(
    cookies: Cookies,
    Path((document_id, target_user_id)): Path<(i32, i32)>,
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Value>> {
    println!("->> {:<12} - remove_document_permission", "HANDLER");

    // Get user ID from cookie
    let user_id = match get_user_id_from_cookie(&cookies) {
        Some(id) => id,
        None => return Err(Error::AuthError)
    };

    // Check if user is the owner
    let has_permission = check_document_permission(&pool, user_id, document_id, "owner").await?;
    if !has_permission {
        return Err(Error::PermissionDeniedError);
    }

    // Prevent owners from removing their own access
    if user_id == target_user_id {
        return Err(Error::PermissionError);
    }

    // Delete permission
    let result = sqlx::query!(
        "DELETE FROM document_permissions 
         WHERE document_id = $1 AND user_id = $2
         RETURNING document_id",
        document_id,
        target_user_id
    )
    .fetch_one(&pool)
    .await;

    match result {
        Ok(_) => Ok(Json(json!({
            "result": {
                "success": true
            }
        }))),
        Err(e) => {
            println!("Error removing document permission: {:?}", e);
            Err(Error::PermissionError)
        }
    }
}

pub fn doc_routes() -> Router {
    Router::new()
        .route("/api/document", post(api_create_document))
        .route("/api/document/:id", get(api_get_document))
        .route("/api/document/:id", post(api_update_document))
        .route("/api/document/:id/permissions", get(get_document_users))
        .route("/api/document/:id/permissions", post(grant_document_permission))
        .route("/api/document/:id/permissions", put(update_document_permission))
        .route("/api/document/:id/permissions/:user_id", delete(remove_document_permission))
}
