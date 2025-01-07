import os
from typing import Tuple, Optional
from backend.src.models.settings import Settings

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID

class SettingsService:
    DEFAULT_SETTINGS = Settings(
        units="metric",              # string
        update_frequency=60,         # integer
        farm_latitude=-23.550520,    # float
        farm_longitude=-46.633308,   # float
        extreme_weather_alerts=False, # boolean
        daily_report=False           # boolean
    )

    def __init__(self):
        self.client = Client()
        self.client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
        self.client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
        self.client.set_key(os.getenv('APPWRITE_API_KEY'))
        self.database = Databases(self.client)
        self.database_id = os.getenv('APPWRITE_DATABASE_ID')
        self.collection_id = os.getenv('APPWRITE_COLLECTION_SETTINGS_ID')
        self.settings_document_id = os.getenv('APPWRITE_SETTINGS_DOCUMENT_ID')

    def get_settings(self) -> Tuple[Optional[Settings], Optional[str]]:
        """Retrieve current settings"""
        try:
            result = self.database.get_document(
                database_id=self.database_id,
                collection_id=self.collection_id,
                document_id=self.settings_document_id
            )
            # Usar o result diretamente, sem acessar ['data']
            settings = Settings.from_dict(result)
            return settings, None
            
        except Exception as e:
            if "Document with the requested ID could not be found" in str(e):
                try:
                    created = self.database.create_document(
                        database_id=self.database_id,
                        collection_id=self.collection_id,
                        document_id=self.settings_document_id,
                        data=self.DEFAULT_SETTINGS.to_dict()
                    )
                    return self.DEFAULT_SETTINGS, None
                except Exception as create_e:
                    error_msg = f"Error creating default settings in Appwrite: {str(create_e)}"
                    print(error_msg)
                    return self.DEFAULT_SETTINGS, error_msg
            else:
                error_msg = f"Error getting settings from Appwrite: {str(e)}"
                print(error_msg)
                return self.DEFAULT_SETTINGS, error_msg
            
    def update_settings(self, settings_data: dict) -> Tuple[Optional[dict], Optional[str]]:
        """Update settings with new values"""
        try:
            response = self.database.update_document(
                database_id=self.database_id,
                collection_id=self.collection_id,
                document_id=self.settings_document_id,
                data=settings_data
            )
            return response, None
        except Exception as e:
            error_msg = f"Error updating settings: {str(e)}"
            print(error_msg)
            return None, error_msg