from appwrite.services.databases import Databases
from appwrite.query import Query
import os

class WeatherModel:
    def __init__(self, databases, database_id, collection_id='weather_recommendations'):
        self.databases = databases
        self.database_id = database_id
        self.collection_id = collection_id

    def save_weather_data(self, weather_data):
        try:
            document = self.databases.create_document(
                database_id=self.database_id,
                collection_id=self.collection_id,
                document_id='unique()',
                data=weather_data
            )
            return document
        except Exception as e:
            print(f"Error saving weather data: {str(e)}")
            return None

    def get_latest_record(self):
        try:
            # Using the correct query syntax for the latest version of Appwrite SDK
            documents = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.collection_id,
                queries=[
                    Query.order_desc('$createdAt'),  # Using order_desc instead of orderDesc
                    Query.limit(1)
                ]
            )
            if documents and hasattr(documents, 'documents') and len(documents.documents) > 0:
                return documents.documents[0]
            return None
        except Exception as e:
            print(f"Error getting latest weather record: {str(e)}")
            return None

    def get_history(self, limit=10):
        try:
            # Using the correct query syntax for the latest version of Appwrite SDK
            documents = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.collection_id,
                queries=[
                    Query.order_desc('$createdAt'),  # Using order_desc instead of orderDesc
                    Query.limit(limit)
                ]
            )
            return documents.documents if hasattr(documents, 'documents') else []
        except Exception as e:
            print(f"Error getting weather history: {str(e)}")
            return []
