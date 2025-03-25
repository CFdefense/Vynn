#[cfg(test)]
mod project_edge_tests {
    use reqwest::{Client, StatusCode};
    use serde_json::{json, Value};
    use std::env;
    use std::time::Duration;

    const API_URL: &str = "http://localhost:3001/api/projects";

    // Helper function to get a new HTTP client
    fn get_client() -> Client {
        Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .expect("Failed to create HTTP client")
    }

    // Helper function to create a test project
    async fn create_test_project(client: &Client, name: &str) -> Result<Value, reqwest::Error> {
        let response = client
            .post(API_URL)
            .json(&json!({
                "name": name,
                "description": "Test project description"
            }))
            .send()
            .await?;

        response.json().await
    }

    #[tokio::test]
    async fn test_get_nonexistent_project() {
        let client = get_client();
        
        // Try to get a project with a non-existent ID
        let response = client
            .get(&format!("{}/{}", API_URL, 99999)) // Using a very large ID that likely doesn't exist
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_update_nonexistent_project() {
        let client = get_client();
        
        // Try to update a project with a non-existent ID
        let response = client
            .put(&format!("{}/{}", API_URL, 99999)) // Using a very large ID that likely doesn't exist
            .json(&json!({
                "name": "Updated Name",
                "description": "Updated description"
            }))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_delete_nonexistent_project() {
        let client = get_client();
        
        // Try to delete a project with a non-existent ID
        let response = client
            .delete(&format!("{}/{}", API_URL, 99999)) // Using a very large ID that likely doesn't exist
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_create_project_invalid_data() {
        let client = get_client();
        
        // Try to create a project with invalid data (missing required name)
        let response = client
            .post(API_URL)
            .json(&json!({
                "description": "Test project with missing name"
            }))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_create_project_empty_name() {
        let client = get_client();
        
        // Try to create a project with an empty name
        let response = client
            .post(API_URL)
            .json(&json!({
                "name": "",
                "description": "Test project with empty name"
            }))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_update_project_invalid_data() {
        let client = get_client();
        
        // Create a test project
        let test_project = create_test_project(&client, "Project for Invalid Update Test")
            .await
            .expect("Failed to create test project");

        let project_id = test_project["id"]
            .as_i64()
            .expect("Failed to get project ID");
        
        // Try to update the project with invalid data (empty name)
        let response = client
            .put(&format!("{}/{}", API_URL, project_id))
            .json(&json!({
                "name": ""
            }))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_concurrent_updates() {
        let client = get_client();
        
        // Create a test project
        let test_project = create_test_project(&client, "Project for Concurrent Update Test")
            .await
            .expect("Failed to create test project");

        let project_id = test_project["id"]
            .as_i64()
            .expect("Failed to get project ID");
        
        // Create a second client for concurrent updates
        let client2 = get_client();
        
        // Send two update requests concurrently
        let update1 = client
            .put(&format!("{}/{}", API_URL, project_id))
            .json(&json!({
                "name": "Updated Name 1",
                "description": "Updated description 1"
            }))
            .send();
            
        let update2 = client2
            .put(&format!("{}/{}", API_URL, project_id))
            .json(&json!({
                "name": "Updated Name 2",
                "description": "Updated description 2"
            }))
            .send();
        
        // Wait for both updates
        let (response1, response2) = tokio::join!(update1, update2);
        
        // Both should succeed, but with different data
        assert!(response1.expect("Failed to get response 1").status().is_success());
        assert!(response2.expect("Failed to get response 2").status().is_success());
        
        // Get the project to see final state
        let response = client
            .get(&format!("{}/{}", API_URL, project_id))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::OK);
        
        let project: Value = response.json().await.expect("Failed to parse JSON");
        
        // One of the updates should have won, but we don't know which one
        let name = project["name"].as_str().unwrap();
        assert!(name == "Updated Name 1" || name == "Updated Name 2");
    }
} 