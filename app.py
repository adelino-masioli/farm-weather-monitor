from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from weather_monitor import WeatherMonitor
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
from appwrite.query import Query
import threading
import schedule
import time
import os
from dotenv import load_dotenv
import json
import traceback

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Appwrite client
try:
    client = Client()
    client.set_endpoint(os.getenv('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'))
    client.set_project(os.getenv('APPWRITE_PROJECT_ID'))
    client.set_key(os.getenv('APPWRITE_API_KEY'))  # Use API key instead of relying on user authentication

    # Initialize database
    databases = Databases(client)
    database_id = os.getenv('APPWRITE_DATABASE_ID')
    collection_id = 'weather_recommendations'
    
    try:
        collection = databases.get_collection(
            database_id=database_id,
            collection_id=collection_id
        )
        print("Successfully connected to Appwrite collection")
    except Exception as e:
        print("Error accessing collection:", str(e))
        collection = None
        
except Exception as e:
    print("Error initializing Appwrite client:", str(e))
    databases = None
    collection = None

# Initialize weather monitor
weather_monitor = WeatherMonitor(
    api_key=os.getenv('OPENWEATHERMAP_API_KEY'),
    farm_lat=float(os.getenv('FARM_LATITUDE', '0')),
    farm_lon=float(os.getenv('FARM_LONGITUDE', '0'))
)

current_weather_data = None
current_recommendations = None

def save_weather_data(weather_data):
    print("\n=== DEBUG: save_weather_data called ===")
    print("Weather data received:", json.dumps(weather_data, indent=2))
    try:
        print("\nAttempting to save weather data...")
        
        # Extract main weather data
        main_data = weather_data.get('main', {})
        wind_data = weather_data.get('wind', {})
        weather_info = weather_data.get('weather', [{}])[0]
        coord_data = weather_data.get('coord', {})
        sys_data = weather_data.get('sys', {})
        
        # Create the document data
        document_data = {
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'temperature': str(main_data.get('temp', '')),
            'feels_like': str(main_data.get('feels_like', '')),
            'humidity': str(main_data.get('humidity', '')),
            'wind_speed': str(wind_data.get('speed', '')),
            'wind_direction': str(wind_data.get('deg', '')),
            'wind_gust': str(wind_data.get('gust', wind_data.get('speed', ''))),
            'description': weather_info.get('description', ''),
            'icon': weather_info.get('icon', ''),
            'location': str({
                'lat': str(coord_data.get('lat', '')),
                'lon': str(coord_data.get('lon', '')),
                'name': weather_data.get('name', '')
            }),
            'sun': str({
                'sunrise': str(sys_data.get('sunrise', '')),
                'sunset': str(sys_data.get('sunset', ''))
            }),
            'pressure': str(main_data.get('pressure', '')),
            'visibility': str(weather_data.get('visibility', ''))
        }
        
        print("\nDocument data to save:", json.dumps(document_data, indent=2))
        
        try:
            print("\nCalling Appwrite create_document with:")
            print(f"Database ID: {database_id}")
            print(f"Collection ID: {collection_id}")
            print(f"Document ID: {ID.unique()}")
            
            result = databases.create_document(
                database_id=database_id,
                collection_id=collection_id,
                document_id=ID.unique(),
                data=document_data,
                permissions=[]
            )
            
            print('\nWeather data saved successfully to Appwrite!')
            print('Document ID:', result['$id'])
            return result
        except Exception as e:
            print('\nError creating document in Appwrite:')
            print('Error type:', type(e).__name__)
            print('Error message:', str(e))
            print('Error details:', getattr(e, 'details', 'No details available'))
            return None
            
    except Exception as e:
        print('\nError formatting weather data:')
        print('Error type:', type(e).__name__)
        print('Error message:', str(e))
        return None

def get_latest_weather_record():
    try:
        print("\nFetching latest weather record from Appwrite...")
        
        # Query the latest record, sorted by timestamp in descending order
        result = databases.list_documents(
            database_id=database_id,
            collection_id=collection_id,
            queries=[
                Query.order_desc('timestamp'),
                Query.limit(1)
            ]
        )
        
        print("\nQuery result:", json.dumps(result, indent=2))
        
        if result and result['documents']:
            latest_record = result['documents'][0]
            print("\nLatest record found:", latest_record['$id'])
            print("Record data:", json.dumps(latest_record, indent=2))
            
            # Parse the location and sun data from strings back to dictionaries
            try:
                location_data = eval(latest_record['location'])
                sun_data = eval(latest_record['sun'])
            except Exception as e:
                print("\nError parsing location/sun data:", str(e))
                location_data = {}
                sun_data = {}
            
            # Format the data to match the expected structure
            weather_data = {
                'main': {
                    'temp': float(latest_record['temperature']),
                    'feels_like': float(latest_record['feels_like']),
                    'humidity': float(latest_record['humidity']),
                    'pressure': float(latest_record['pressure'])
                },
                'wind': {
                    'speed': float(latest_record['wind_speed']),
                    'deg': float(latest_record['wind_direction']),
                    'gust': float(latest_record['wind_gust'])
                },
                'weather': [{
                    'description': latest_record['description'],
                    'icon': latest_record['icon']
                }],
                'name': location_data.get('name', ''),
                'coord': {
                    'lat': float(location_data.get('lat', 0)),
                    'lon': float(location_data.get('lon', 0))
                },
                'sys': {
                    'sunrise': int(sun_data.get('sunrise', 0)),
                    'sunset': int(sun_data.get('sunset', 0))
                },
                'visibility': int(latest_record.get('visibility', 0)),
                'timestamp': latest_record['timestamp']  # Include the timestamp from database
            }
            
            print("\nFormatted weather data:", json.dumps(weather_data, indent=2))
            return weather_data
        else:
            print("No weather records found")
            return None
            
    except Exception as e:
        print('Error fetching latest weather record:', str(e))
        print('Error type:', type(e).__name__)
        return None

def get_recommendations(weather_data):
    try:
        print("\nFetching recommendations from database...")
        print("Database ID:", database_id)
        print("Weather data:", json.dumps(weather_data, indent=2))
        
        # Get all recommendations from the collection
        result = databases.list_documents(
            database_id=database_id,
            collection_id='weather_recommendations',
            queries=[
                Query.order_desc('priority')  # Higher priority first
            ]
        )
        
        print("\nAPI Response:", json.dumps(result, indent=2))
        
        if not result or not result['documents']:
            print("No recommendations found in database")
            return []
            
        print("\nFound recommendations in database:", len(result['documents']))
        recommendations = []
        for rec in result['documents']:
            condition_met = False
            value = None
            
            # Get the weather value based on condition type
            if rec['condition_type'] == 'temp':
                value = weather_data['main']['temp']
            elif rec['condition_type'] == 'humidity':
                value = weather_data['main']['humidity']
            elif rec['condition_type'] == 'wind_speed':
                value = weather_data['wind']['speed'] * 3.6  # Convert to km/h
            elif rec['condition_type'] == 'rain':
                value = weather_data.get('rain', {}).get('1h', 0)
                
            print(f"\nChecking recommendation: {rec['category']} - {rec['condition_type']} {rec['operator']} {rec['condition_value']}")
            print(f"Current value: {value}")
                
            if value is not None:
                # Check the condition based on operator
                if rec['operator'] == '>':
                    condition_met = value > float(rec['condition_value'])
                elif rec['operator'] == '<':
                    condition_met = value < float(rec['condition_value'])
                elif rec['operator'] == 'between':
                    min_val, max_val = map(float, rec['condition_value'].split(','))
                    condition_met = min_val <= value <= max_val
                    
                print(f"Condition met: {condition_met}")
                    
            if condition_met:
                recommendation = {
                    'category': rec['category'],
                    'text': rec['recommendation_text'],
                    'priority': int(rec['priority'])  # Convert string priority to integer
                }
                recommendations.append(recommendation)
                print(f"Added recommendation: {recommendation}")
        
        print(f"\nFound {len(recommendations)} applicable recommendations")
        return recommendations
        
    except Exception as e:
        print('Error getting recommendations:', str(e))
        print('Error type:', type(e).__name__)
        print('Error traceback:', traceback.format_exc())
        return []

def update_weather_data():
    global current_weather_data, current_recommendations
    try:
        print("\n=== Updating Weather Data ===")
        weather_data = weather_monitor.get_current_weather()
        if weather_data:
            print("Weather data received successfully")
            current_weather_data = weather_data
            current_recommendations = get_recommendations(weather_data)
            
            # Save to Appwrite
            print("\nAttempting to save to Appwrite...")
            save_result = save_weather_data(weather_data)
            
            if save_result:
                print("✓ Weather data update complete and saved to Appwrite")
                print(f"Document ID: {save_result['$id']}")
            else:
                print("✗ Weather data updated but failed to save to Appwrite")
        else:
            print("✗ No weather data received from monitor")
    except Exception as e:
        print('✗ Error in update_weather_data:', str(e))
        print('Error type:', type(e).__name__)

# Background task to update weather data
def background_task():
    while True:
        schedule.run_pending()
        time.sleep(60)

# Schedule weather updates every 30 minutes
schedule.every(30).minutes.do(update_weather_data)

# Start background thread
threading.Thread(target=background_task, daemon=True).start()

def get_settings():
    """Get settings from environment variables"""
    return {
        'units': 'metric',
        'update_frequency': 300,
        'farm_latitude': float(os.getenv('FARM_LATITUDE', '0')),
        'farm_longitude': float(os.getenv('FARM_LONGITUDE', '0')),
        'extreme_weather_alerts': True,
        'daily_report': True
    }

@app.route('/api/settings', methods=['GET'])
def get_current_settings():
    """Get current settings"""
    try:
        settings = get_settings()
        return jsonify(settings)
    except Exception as e:
        print('Error getting settings:', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update settings"""
    try:
        settings = request.get_json()
        
        # Validate settings
        if not settings:
            return jsonify({'error': 'No settings provided'}), 400
            
        # Update environment variables
        if settings.get('location'):
            os.environ['FARM_LATITUDE'] = str(settings['location']['latitude'])
            os.environ['FARM_LONGITUDE'] = str(settings['location']['longitude'])
            
            # Save to .env file
            with open('.env', 'r') as f:
                lines = f.readlines()
            
            with open('.env', 'w') as f:
                for line in lines:
                    if not line.startswith(('FARM_LATITUDE=', 'FARM_LONGITUDE=')):
                        f.write(line)
                f.write(f"FARM_LATITUDE={settings['location']['latitude']}\n")
                f.write(f"FARM_LONGITUDE={settings['location']['longitude']}\n")
        
        return jsonify({'message': 'Settings updated successfully'})
        
    except Exception as e:
        print('Error updating settings:', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return render_template('index.html', 
                         active_page='dashboard',
                         farm_lat=os.getenv('FARM_LATITUDE', '0'),
                         farm_lon=os.getenv('FARM_LONGITUDE', '0'))

@app.route('/location')
def location():
    return render_template('location.html',
                         active_page='location',
                         farm_lat=os.getenv('FARM_LATITUDE', '0'),
                         farm_lon=os.getenv('FARM_LONGITUDE', '0'))

@app.route('/settings')
def settings():
    return render_template('settings.html',
                         active_page='settings',
                         farm_lat=os.getenv('FARM_LATITUDE', '0'),
                         farm_lon=os.getenv('FARM_LONGITUDE', '0'))

@app.route('/api/weather')
def get_weather():
    try:
        print("\n=== GET /api/weather called ===")
        
        # Try to get latest record from database first
        weather_data = get_latest_weather_record()
        print("\nGot weather data from database:", "Yes" if weather_data else "No")
        
        if not weather_data:
            print("\nNo data in database, fetching from OpenWeatherMap...")
            # If no data in database, fetch from OpenWeatherMap
            weather_data = weather_monitor.get_current_weather()
            if weather_data:
                print("\nSaving new weather data to database...")
                save_weather_data(weather_data)
        
        if weather_data:
            print("\nGetting recommendations...")
            recommendations = []
            if databases and collection:
                try:
                    recommendations = get_recommendations(weather_data)
                except Exception as e:
                    print("Error getting recommendations:", str(e))
            
            print("\nReturning weather data and recommendations to client")
            return jsonify({
                'weather': weather_data,
                'recommendations': recommendations
            })
        else:
            print("\nNo weather data available")
            return jsonify({'error': 'No weather data available'}), 404
            
    except Exception as e:
        print('\nError in get_weather:', str(e))
        print('Error type:', type(e).__name__)
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-save')
def test_save():
    print("\n/api/test-save endpoint called")
    try:
        # Get current weather
        weather_data = weather_monitor.get_current_weather()
        if weather_data:
            # Try to save it
            result = save_weather_data(weather_data)
            if result:
                return jsonify({
                    'success': True,
                    'message': 'Weather data saved successfully',
                    'document_id': result['$id']
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Failed to save weather data'
                }), 500
        else:
            return jsonify({
                'success': False,
                'message': 'No weather data available'
            }), 500
    except Exception as e:
        print('Error in test-save:', str(e))
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/weather/history')
def get_weather_history():
    try:
        history = []
        if databases and collection:
            try:
                # Get weather history from Appwrite
                result = databases.list_documents(
                    database_id=database_id,
                    collection_id=collection_id,
                    queries=[
                        Query.limit(24),  # Last 24 records
                        Query.order_desc('$createdAt')
                    ]
                )
                history = [doc['weather_data'] for doc in result['documents']]
            except Exception as e:
                print("Error getting weather history:", str(e))
        
        return jsonify({
            'history': history
        })
    except Exception as e:
        print("Error getting weather history:", str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initial weather data fetch
    print("\nFetching initial weather data...")
    update_weather_data()
    
    # Run the Flask app
    print("\nStarting Flask app...")
    app.run(host='0.0.0.0', port=8080, debug=True)
