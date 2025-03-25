#[cfg(test)]
mod document_edge_tests {
    use reqwest::{Client, StatusCode};
    use serde_json::{json, Value};
    use std::time::Duration;

    const API_URL: &str = "http://localhost:3001/api/document";

    // Helper function to get a new HTTP client
    fn get_client() -> Client {
        Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .expect("Failed to create HTTP client")
    }

    // Helper function to create a test document
    async fn create_test_document(client: &Client, name: &str) -> Result<Value, reqwest::Error> {
        let response = client
            .post(API_URL)
            .json(&json!({
                "name": name,
                "content": "Test document content",
                "created_at": chrono::Utc::now().to_rfc3339(),
                "updated_at": chrono::Utc::now().to_rfc3339()
            }))
            .send()
            .await?;

        response.json().await
    }

    #[tokio::test]
    async fn test_get_nonexistent_document() {
        let client = get_client();
        
        // Try to get a document with a non-existent ID
        let response = client
            .get(&format!("{}/{}", API_URL, 99999)) // Using a very large ID that likely doesn't exist
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        
        // Check that the response is proper JSON with an error message
        let error_response: Value = response.json().await.expect("Failed to parse JSON");
        assert!(error_response["error"].is_string());
    }

    #[tokio::test]
    async fn test_update_nonexistent_document() {
        let client = get_client();
        
        // Try to update a document with a non-existent ID
        let response = client
            .post(&format!("{}/{}", API_URL, 99999)) // Using a very large ID that likely doesn't exist
            .json(&json!({
                "name": "Updated Name",
                "content": "Updated content",
                "updated_at": chrono::Utc::now().to_rfc3339()
            }))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        
        // Check that the response is proper JSON with an error message
        let error_response: Value = response.json().await.expect("Failed to parse JSON");
        assert!(error_response["error"].is_string());
    }

    #[tokio::test]
    async fn test_create_document_empty_name() {
        let client = get_client();
        
        // Try to create a document with an empty name
        let response = client
            .post(API_URL)
            .json(&json!({
                "name": "",
                "content": "Test document with empty name",
                "created_at": chrono::Utc::now().to_rfc3339(),
                "updated_at": chrono::Utc::now().to_rfc3339()
            }))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        
        // Check that the response is proper JSON with an error message
        let error_response: Value = response.json().await.expect("Failed to parse JSON");
        assert!(error_response["error"].is_string());
    }

    #[tokio::test]
    async fn test_update_document_empty_name() {
        let client = get_client();
        
        // First create a valid document
        let test_document = create_test_document(&client, "Document for Empty Name Update Test")
            .await
            .expect("Failed to create test document");

        let document_id = test_document["id"]
            .as_i64()
            .expect("Failed to get document ID");
        
        // Try to update the document with an empty name
        let response = client
            .post(&format!("{}/{}", API_URL, document_id))
            .json(&json!({
                "name": "",
                "content": "Updated content with empty name",
                "updated_at": chrono::Utc::now().to_rfc3339()
            }))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        
        // Check that the response is proper JSON with an error message
        let error_response: Value = response.json().await.expect("Failed to parse JSON");
        assert!(error_response["error"].is_string());
    }

    #[tokio::test]
    async fn test_unauthorized_access() {
        // This test requires a separate HTTP client without existing cookies/auth
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .cookie_store(false) // Disable cookie store to prevent auth
            .build()
            .expect("Failed to create HTTP client");
        
        // Try to get a document without authentication
        let response = client
            .get(&format!("{}/{}", API_URL, 1)) // Try to get document with ID 1
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        
        // Check that the response is proper JSON with an error message
        let error_response: Value = response.json().await.expect("Failed to parse JSON");
        assert!(error_response["error"].is_string());
    }
} 