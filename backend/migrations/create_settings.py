from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_settings_collection():
    # Initialize Appwrite client
    client = Client()
    client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
    client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
    client.set_key(os.getenv('APPWRITE_API_KEY'))

    # Initialize database
    databases = Databases(client)
    database_id = os.getenv('APPWRITE_DATABASE_ID')

    try:
        # Delete existing settings collection if it exists
        try:
            settings_collection = databases.get_collection(
                database_id=database_id,
                collection_id='settings'
            )
            if settings_collection:
                databases.delete_collection(
                    database_id=database_id,
                    collection_id='settings'
                )
                print("Deleted existing settings collection")
        except Exception as e:
            print("Collection doesn't exist or error:", str(e))

        # Create new settings collection
        collection = databases.create_collection(
            database_id=database_id,
            collection_id='settings',
            name='Settings',
            permissions=[
                "create(\"any\")",
                "read(\"any\")",
                "update(\"any\")",
                "delete(\"any\")"
            ]
        )
        
        # Add attributes
        databases.create_string_attribute(
            database_id=database_id,
            collection_id='settings',
            key='units',
            size=10,
            required=True
        )
        
        databases.create_integer_attribute(
            database_id=database_id,
            collection_id='settings',
            key='update_frequency',
            required=True,
            min=60,  # Minimum 1 minute
            max=3600  # Maximum 1 hour
        )
        
        databases.create_float_attribute(
            database_id=database_id,
            collection_id='settings',
            key='farm_latitude',
            required=True,
            min=-90,
            max=90
        )
        
        databases.create_float_attribute(
            database_id=database_id,
            collection_id='settings',
            key='farm_longitude',
            required=True,
            min=-180,
            max=180
        )
        
        databases.create_boolean_attribute(
            database_id=database_id,
            collection_id='settings',
            key='extreme_weather_alerts',
            required=True,
            default=True
        )
        
        databases.create_boolean_attribute(
            database_id=database_id,
            collection_id='settings',
            key='daily_report',
            required=True,
            default=True
        )

        print("Created settings collection with attributes")

        # Add initial settings
        initial_settings = {
            'units': 'metric',
            'update_frequency': 300,  # 5 minutes
            'farm_latitude': float(os.getenv('FARM_LATITUDE', '0')),
            'farm_longitude': float(os.getenv('FARM_LONGITUDE', '0')),
            'extreme_weather_alerts': True,
            'daily_report': True
        }

        databases.create_document(
            database_id=database_id,
            collection_id='settings',
            document_id='default',
            data=initial_settings,
            permissions=[
                "read(\"any\")",
                "update(\"any\")",
                "delete(\"any\")"
            ]
        )

        print("Added initial settings")
        print("Settings collection created successfully!")

    except Exception as e:
        print(f"Error creating settings collection: {str(e)}")
        raise e

if __name__ == "__main__":
    create_settings_collection()
