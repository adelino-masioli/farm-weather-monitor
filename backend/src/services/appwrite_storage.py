from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
import os
from datetime import datetime

class AppwriteStorageService:
    def __init__(self):
        self.client = Client()
        self.client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
        self.client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
        self.client.set_key(os.getenv('APPWRITE_API_KEY'))
        
        self.database = Databases(self.client)
        self.database_id = os.getenv('APPWRITE_DATABASE_ID')
        self.collection_id = os.getenv('APPWRITE_COLLECTION_ID')

    def save_weather_data(self, weather_data: dict):
        try:
            # Add timestamp if not present
            if 'timestamp' not in weather_data:
                weather_data['timestamp'] = datetime.utcnow().isoformat()
            
            # Create document in Appwrite
            document = self.database.create_document(
                database_id=self.database_id,
                collection_id=self.collection_id,
                document_id=ID.unique(),
                data=weather_data
            )
            return weather_data
        except Exception as e:
            print(f"Error saving weather data to Appwrite: {str(e)}")
            return None

    def get_latest_weather(self):
        try:
            # Query the latest record
            result = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.collection_id,
                queries=[
                    'orderDesc("timestamp")',
                    'limit(1)'
                ]
            )
            
            if result['total'] > 0:
                return result['documents'][0]
            return None
        except Exception as e:
            print(f"Error getting latest weather from Appwrite: {str(e)}")
            return None

    def get_weather_history(self, limit=10):
        try:
            result = self.database.list_documents(
                database_id=self.database_id,
                collection_id=self.collection_id,
                queries=[
                    'orderDesc("timestamp")',
                    f'limit({limit})'
                ]
            )
            return result['documents']
        except Exception as e:
            print(f"Error getting weather history from Appwrite: {str(e)}")
            return []

    def get_settings(self):
        return {
            'latitude': os.getenv('FARM_LAT', '40.7128'),
            'longitude': os.getenv('FARM_LON', '-74.0060')
        }

    def update_settings(self, settings: dict):
        # For now, settings are stored in environment variables
        # You might want to create a separate collection for settings in Appwrite
        return settings