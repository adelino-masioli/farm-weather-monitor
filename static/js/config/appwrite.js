// Create Appwrite client
const { Client, Databases, ID } = Appwrite;

const client = new Client();

// Initialize Appwrite client
client
    .setEndpoint(window.APPWRITE_CONFIG.endpoint)
    .setProject(window.APPWRITE_CONFIG.projectId);

// Initialize Databases SDK
const databases = new Databases(client);

// Collection ID for weather records
const COLLECTION_ID = 'weather_records';

export { databases, COLLECTION_ID, ID };
