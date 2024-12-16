from flask import Flask, render_template, jsonify
from flask_cors import CORS
from weather_monitor import WeatherMonitor
import threading
import schedule
import time
import os

app = Flask(__name__)
CORS(app)

# Initialize weather monitor
weather_monitor = WeatherMonitor()
current_weather_data = None
current_recommendations = None

def update_weather_data():
    global current_weather_data, current_recommendations
    weather_data = weather_monitor.get_current_weather()
    if weather_data:
        current_weather_data = weather_data
        current_recommendations = weather_monitor.analyze_conditions(weather_data)

# Background task to update weather data
def background_task():
    while True:
        schedule.run_pending()
        time.sleep(60)

# Schedule weather updates every 30 minutes
schedule.every(30).minutes.do(update_weather_data)

# Start background thread
threading.Thread(target=background_task, daemon=True).start()

@app.route('/')
def index():
    farm_lat = float(os.getenv('FARM_LATITUDE'))
    farm_lon = float(os.getenv('FARM_LONGITUDE'))
    return render_template('index.html', 
                         farm_lat=farm_lat,
                         farm_lon=farm_lon)

@app.route('/api/weather')
def get_weather():
    if current_weather_data is None:
        update_weather_data()
    
    if current_weather_data:
        return jsonify({
            'weather': current_weather_data,
            'recommendations': current_recommendations
        })
    return jsonify({'error': 'Unable to fetch weather data'}), 500

if __name__ == '__main__':
    # Initial weather data fetch
    update_weather_data()
    
    # Get port from environment variable for Railway deployment
    port = int(os.environ.get('PORT', 8080))
    
    # In production, debug should be False
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(host='0.0.0.0', port=port, debug=debug)
