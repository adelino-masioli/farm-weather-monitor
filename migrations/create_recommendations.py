from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
import os
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

def migrate():
    print("\nStarting migration to create recommendations collection...")
    
    # Initialize Appwrite client
    client = Client()
    client.set_endpoint(os.getenv('APPWRITE_ENDPOINT'))
    client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
    client.set_key(os.getenv('APPWRITE_API_KEY'))
    
    # Initialize database service
    databases = Databases(client)
    database_id = os.getenv('APPWRITE_DATABASE_ID')
    collection_id = 'weather_recommendations'
    
    try:
        # Delete existing collection if it exists
        try:
            print("Deleting existing collection...")
            databases.delete_collection(
                database_id=database_id,
                collection_id=collection_id
            )
            print("✓ Deleted existing collection")
            # Wait for deletion to complete
            time.sleep(2)
        except Exception as e:
            if 'not found' not in str(e).lower():
                raise e
            print("Collection did not exist")

        # Create recommendations collection
        print("\nCreating new collection...")
        collection = databases.create_collection(
            database_id=database_id,
            collection_id=collection_id,
            name='Weather Recommendations',
            permissions=['read("any")', 'create("any")', 'update("any")', 'delete("any")']
        )
        print("✓ Created recommendations collection")
        
        # Add attributes
        print("\nAdding attributes...")
        databases.create_string_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key='category',
            size=50,
            required=True
        )
        print("✓ Added category attribute")
        
        databases.create_string_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key='condition_type',
            size=50,
            required=True
        )
        print("✓ Added condition_type attribute")
        
        databases.create_string_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key='condition_value',
            size=50,
            required=True
        )
        print("✓ Added condition_value attribute")
        
        databases.create_string_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key='operator',
            size=10,
            required=True
        )
        print("✓ Added operator attribute")
        
        databases.create_string_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key='recommendation_text',
            size=500,
            required=True
        )
        print("✓ Added recommendation_text attribute")
        
        databases.create_string_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key='priority',
            size=10,
            required=True
        )
        print("✓ Added priority attribute")

        # Wait for attributes to be ready
        print("\nWaiting for attributes to be ready...")
        time.sleep(5)
        
        # Add some initial recommendations
        initial_recommendations = [
            # Temperature-based recommendations
            {
                'category': 'temperature',
                'condition_type': 'temp',
                'condition_value': '30',
                'operator': '>',
                'recommendation_text': 'Watch for signs of heat stress in crops. Consider additional irrigation.',
                'priority': '1'
            },
            {
                'category': 'temperature',
                'condition_type': 'temp',
                'condition_value': '10',
                'operator': '<',
                'recommendation_text': 'Protect sensitive crops from frost damage. Consider using frost protection methods.',
                'priority': '1'
            },
            {
                'category': 'temperature',
                'condition_type': 'temp',
                'condition_value': '20,25',
                'operator': 'between',
                'recommendation_text': 'Optimal conditions for crop development. Good time for field operations.',
                'priority': '2'
            },
            
            # Humidity-based recommendations
            {
                'category': 'humidity',
                'condition_type': 'humidity',
                'condition_value': '80',
                'operator': '>',
                'recommendation_text': 'High humidity alert. Monitor for fungal diseases. Consider fungicide application.',
                'priority': '1'
            },
            {
                'category': 'humidity',
                'condition_type': 'humidity',
                'condition_value': '30',
                'operator': '<',
                'recommendation_text': 'Low humidity alert. Increase irrigation to prevent water stress.',
                'priority': '1'
            },
            
            # Wind-based recommendations
            {
                'category': 'wind',
                'condition_type': 'wind_speed',
                'condition_value': '40',
                'operator': '>',
                'recommendation_text': 'Strong winds alert. Delay spraying operations and secure equipment.',
                'priority': '1'
            },
            {
                'category': 'wind',
                'condition_type': 'wind_speed',
                'condition_value': '20',
                'operator': '<',
                'recommendation_text': 'Favorable conditions for spraying operations.',
                'priority': '2'
            },
            
            # Rain-based recommendations
            {
                'category': 'rain',
                'condition_type': 'rain',
                'condition_value': '0',
                'operator': '>',
                'recommendation_text': 'Recent rainfall detected. Adjust irrigation schedule accordingly.',
                'priority': '1'
            }
        ]
        
        print("\nAdding initial recommendations...")
        for rec in initial_recommendations:
            try:
                result = databases.create_document(
                    database_id=database_id,
                    collection_id=collection_id,
                    document_id=ID.unique(),
                    data=rec,
                    permissions=[
                        "read(\"any\")",
                        "update(\"any\")",
                        "delete(\"any\")"
                    ]
                )
                print(f"✓ Added recommendation for {rec['category']}: {rec['recommendation_text'][:50]}...")
            except Exception as e:
                print(f"Error adding recommendation: {str(e)}")
        
        print("\n✓ Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        raise e

if __name__ == '__main__':
    migrate()
