#[cfg(test)]
mod project_tests {
    use request::{Client, StatusCode};
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
    async fn test_create_project() {
        let client = get_client();

        // Create a test project
        let response = client
            .post(API_URL)
            .json(&json!({
                "name": "Test Project",
                "description": "This is a test project"
            }))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::OK);

        let project: Value = response.json().await.expect("Failed to parse JSON");

        assert!(project["id"].is_number());
        assert_eq!(project["name"], "Test Project");
        assert_eq!(project["description"], "This is a test project");
    }

    #[tokio::test]
    async fn test_get_projects() {
        let client = get_client();

        // Create a test project to ensure there's at least one
        let test_project = create_test_project(&client, "Project for Get Test")
            .await
            .expect("Failed to create test project");

        // Get all projects
        let response = client
            .get(API_URL)
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::OK);

        let projects: Vec<Value> = response.json().await.expect("Failed to parse JSON");

        // Verify we have at least one project
        assert!(!projects.is_empty());
    }

    #[tokio::test]
    async fn test_get_project_by_id() {
        let client = get_client();

        // Create a test project
        let test_project = create_test_project(&client, "Project for GetById Test")
            .await
            .expect("Failed to create test project");

        let project_id = test_project["id"]
            .as_i64()
            .expect("Failed to get project ID");

        // Get project by ID
        let response = client
            .get(&format!("{}/{}", API_URL, project_id))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::OK);

        let project: Value = response.json().await.expect("Failed to parse JSON");

        assert_eq!(project["id"], json!(project_id));
        assert_eq!(project["name"], "Project for GetById Test");
    }

    #[tokio::test]
    async fn test_update_project() {
        let client = get_client();

        // Create a test project
        let test_project = create_test_project(&client, "Project for Update Test")
            .await
            .expect("Failed to create test project");

        let project_id = test_project["id"]
            .as_i64()
            .expect("Failed to get project ID");

        // Update the project
        let response = client
            .put(&format!("{}/{}", API_URL, project_id))
            .json(&json!({
                "name": "Updated Project Name",
                "description": "Updated project description"
            }))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::OK);

        let updated_project: Value = response.json().await.expect("Failed to parse JSON");

        assert_eq!(updated_project["id"], json!(project_id));
        assert_eq!(updated_project["name"], "Updated Project Name");
        assert_eq!(
            updated_project["description"],
            "Updated project description"
        );
    }

    #[tokio::test]
    async fn test_delete_project() {
        let client = get_client();

        // Create a test project
        let test_project = create_test_project(&client, "Project for Delete Test")
            .await
            .expect("Failed to create test project");

        let project_id = test_project["id"]
            .as_i64()
            .expect("Failed to get project ID");

        // Delete the project
        let response = client
            .delete(&format!("{}/{}", API_URL, project_id))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::NO_CONTENT);

        // Try to get the deleted project - should return 404
        let response = client
            .get(&format!("{}/{}", API_URL, project_id))
            .send()
            .await
            .expect("Failed to send request");

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }
}
