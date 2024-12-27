from appwrite.client import Client
from appwrite.services.databases import Databases
import os

def init_appwrite():
    try:
        client = Client()
        client.set_endpoint(os.getenv('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'))
        client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
        client.set_key(os.getenv('APPWRITE_API_KEY'))

        databases = Databases(client)
        database_id = os.getenv('APPWRITE_DATABASE_ID')
        
        return databases, database_id
    except Exception as e:
        print(f"Error initializing Appwrite client: {str(e)}")
        return None, None
