/*
/ Drive.ts
/
/ File containing functions and logic required for frontend handling of a drive
/ Will provide the communication with the backend and pass necessary information to API calls
/
/ Summary:
/ 
/
/
*/
import { Document } from "./document"; 

// Function to create a document via POST API of documentData recieved from frontend
export async function create_document(documentData: Document): Promise<Boolean> {
    try {
        const apiUrl = 'http://localhost:3001/api/document/'

        // Format the timestamp in the format expected by the backend (NaiveDateTime)
        const now = new Date().toISOString().replace('Z', '');

        // Create Payload
        const payload = {
            name: documentData.name,
            content: "",
            created_at: now,
            updated_at: now
        }

        console.log("Sending Create Document Payload:", payload);

        // Call API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        if(!response.ok) {
            const errorText = await response.text();
            console.error("Document Creation Failed:", response.status, errorText);
            return false;
        }
    } catch (error) {
        console.error('Error creating document:', error);
		return false;
    }

    return true;
}

// Function to delete document from database 
export async function delete_document(documentData: Document): Promise<Boolean> {
    try {
        const apiUrl = `http://localhost:3001/api/document/${documentData.id}/`;

        // create the payload
        const payload = {
            id: documentData.id
        }

        console.log("Sending Delete Document Payload:", payload);

        // Call API
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        if(!response.ok) {
            const errorText = await response.text();
            console.error("Document Deletion Failed:", response.status, errorText);
            return false;
        }

    } catch (error) {
        console.error('Error deleting document:', error);
		return false;
    }
    return true;
}