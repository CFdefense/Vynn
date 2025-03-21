// src/models/project.rs
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDateTime};

// Helper for datetime conversion
pub(crate) trait DateTimeHelper {
    fn to_utc_datetime(self) -> DateTime<Utc>;
}

impl DateTimeHelper for NaiveDateTime {
    fn to_utc_datetime(self) -> DateTime<Utc> {
        DateTime::from_naive_utc_and_offset(self, Utc)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Payload for creating a new project
#[derive(Debug, Deserialize)]
pub struct CreateProjectPayload {
    pub name: String,
    pub description: Option<String>,
}

// Payload for updating an existing project
#[derive(Debug, Deserialize)]
pub struct UpdateProjectPayload {
    pub name: Option<String>,
    pub description: Option<String>,
}
