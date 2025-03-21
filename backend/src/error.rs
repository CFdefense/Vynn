pub type Result<T> = core::result::Result<T, Error>; // Export Type

use axum::response::IntoResponse;
use axum::http::StatusCode;
use axum::response::Response;

#[derive(Debug)]
pub enum Error {
    // Database Errors
    MigrationExecutionError,
    MigrationKeyError,
    DatabaseConnectionError,

    // User Errors
    UserUpdateError,
    UserNotFoundError,
    UserCreationError,
    LoginFailError,
    AuthError,

    // Document Errors
    DocumentNotFoundError,
    DocumentUpdateError,
    DocumentCreationError,
    
    // General Errors
    InvalidRequestFormatError,

    // Document Permission Errors
    PermissionError,
    PermissionDeniedError,

    // Signup errors
    EmailAlreadyExistsError,
    DatabaseError,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        println!("->> {:<12} - {self:?}", "ERROR");
        match self {
            Self::LoginFailError => (StatusCode::INTERNAL_SERVER_ERROR, "UNHANDLED_CLIENT_ERROR").into_response(),
            Self::DatabaseConnectionError => (StatusCode::INTERNAL_SERVER_ERROR, "UNHANDLED_SERVER_ERROR").into_response(),
            Self::UserNotFoundError => (StatusCode::INTERNAL_SERVER_ERROR, "UNHANDLED_CLIENT_ERROR").into_response(),
            Self::UserCreationError => (StatusCode::INTERNAL_SERVER_ERROR, "UNHANDLED_CLIENT_ERROR").into_response(),
            Self::InvalidRequestFormatError => (StatusCode::INTERNAL_SERVER_ERROR, "UNHANDLED_CLIENT_ERROR").into_response(),
            Self::MigrationExecutionError => (StatusCode::INTERNAL_SERVER_ERROR, "UNHANDLED_CLIENT_ERROR").into_response(),
            Self::MigrationKeyError => (StatusCode::INTERNAL_SERVER_ERROR, "UNHANDLED_CLIENT_ERROR").into_response(),
            Self::UserUpdateError=> (StatusCode::INTERNAL_SERVER_ERROR, "UNHANDLED_CLIENT_ERROR").into_response(),
            Self::DocumentNotFoundError => (StatusCode::INTERNAL_SERVER_ERROR, "UNHANDLED_CLIENT_ERROR").into_response(),
            Self::PermissionError => (StatusCode::INTERNAL_SERVER_ERROR, "PERMISSION_ERROR").into_response(),
            Self::PermissionDeniedError => (StatusCode::FORBIDDEN, "PERMISSION_DENIED").into_response(),
            Self::DocumentUpdateError => (StatusCode::INTERNAL_SERVER_ERROR, "UNHANDLED_CLIENT_ERROR").into_response(),
            Self::EmailAlreadyExistsError => (StatusCode::CONFLICT, "EMAIL_ALREADY_EXISTS").into_response(),
            Self::DatabaseError => (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR").into_response(),
            Self::AuthError => (StatusCode::UNAUTHORIZED, "AUTHENTICATION_REQUIRED").into_response(),
            Self::DocumentCreationError => (StatusCode::INTERNAL_SERVER_ERROR, "DOCUMENT_CREATION_ERROR").into_response(),
        }
    }
}
