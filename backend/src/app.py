from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
import schedule
import threading
import time

from backend.src.services.weather_service import WeatherService
from backend.src.controllers.weather_controller import WeatherController

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "https://your-production-domain.com"]}})

    # Initialize components
    weather_service = WeatherService(
        api_key=os.getenv('OPENWEATHERMAP_API_KEY')
    )
    weather_controller = WeatherController(weather_service)

    # Register routes
    app.register_blueprint(weather_controller.bp)

    return app, weather_service

def background_task(weather_service):
    while True:
        schedule.run_pending()
        time.sleep(1)

def main():
    app, weather_service = create_app()

    # Schedule weather updates
    schedule.every(30).minutes.do(weather_service.update_weather_data)

    # Initial weather data fetch
    print("\nFetching initial weather data...")
    weather_service.update_weather_data()

    # Start the background task in a separate thread
    bg_thread = threading.Thread(target=background_task, args=(weather_service,))
    bg_thread.daemon = True
    bg_thread.start()

    # Run the Flask app
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8000)))

if __name__ == '__main__':
    main()
