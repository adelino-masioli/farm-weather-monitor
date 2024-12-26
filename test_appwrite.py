from appwrite.client import Client
from appwrite.services.databases import Databases
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("\nTesting Appwrite connection...")

# Initialize Appwrite client
client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
client.set_key(os.getenv('APPWRITE_API_KEY'))

# Initialize database
databases = Databases(client)
database_id = os.getenv('APPWRITE_DATABASE_ID')

print("\nConfiguration:")
print(f"Endpoint: {os.getenv('APPWRITE_ENDPOINT')}")
print(f"Project ID: {os.getenv('APPWRITE_PROJECT_ID')}")
print(f"Database ID: {database_id}")
print(f"API Key: {os.getenv('APPWRITE_API_KEY')}")

try:
    print("\nTrying to list collections...")
    collections = databases.list_collections(database_id=database_id)
    print("\nCollections:", collections)
except Exception as e:
    print("\nError:", str(e))
    print("Error type:", type(e).__name__)
