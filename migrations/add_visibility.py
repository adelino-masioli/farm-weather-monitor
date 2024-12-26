from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate():
    print("\nStarting migration to add visibility field...")
    
    # Initialize Appwrite client
    client = Client()
    client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
    client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
    client.set_key(os.getenv('APPWRITE_API_KEY'))
    
    # Initialize database service
    databases = Databases(client)
    database_id = os.getenv('APPWRITE_DATABASE_ID')
    collection_id = os.getenv('APPWRITE_COLLECTION_ID')
    
    try:
        # Add visibility attribute
        databases.create_string_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key='visibility',
            size=255,
            required=False
        )
        print("✓ Successfully added visibility field to collection")
        
    except Exception as e:
        if 'Attribute already exists' in str(e):
            print("ℹ Visibility field already exists in collection")
        else:
            print(f"✗ Error adding visibility field: {str(e)}")
            raise e

if __name__ == '__main__':
    migrate()
