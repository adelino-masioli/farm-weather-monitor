import { Appwrite, ID } from 'appwrite';

const client = new Appwrite();

// Initialize Appwrite client
client
    .setEndpoint(window.APPWRITE_CONFIG.endpoint)
    .setProject(window.APPWRITE_CONFIG.projectId);

// Collection ID for weather records
const COLLECTION_ID = 'weather_records';

export { client, COLLECTION_ID };
