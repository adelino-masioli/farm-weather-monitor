from flask import Blueprint, jsonify, request

class WeatherController:
    def __init__(self, weather_service):
        self.weather_service = weather_service
        self.bp = Blueprint('weather', __name__)
        self.register_routes()

    def register_routes(self):
        self.bp.route('/api/weather/current', methods=['GET'])(self.get_current_weather)
        self.bp.route('/api/weather/history', methods=['GET'])(self.get_weather_history)
        self.bp.route('/api/settings', methods=['GET'])(self.get_current_settings)
        self.bp.route('/api/settings', methods=['POST'])(self.update_settings)

    def get_current_weather(self):
        try:
            print("Fetching current weather...")
            weather_data = self.weather_service.get_latest_weather()
            print(f"Weather data: {weather_data}")
            if weather_data is None:
                print("No weather data available, fetching new data...")
                weather_data = self.weather_service.update_weather_data()
                print(f"New weather data: {weather_data}")
            return jsonify(weather_data if weather_data else {})
        except Exception as e:
            print(f"Error in get_current_weather: {str(e)}")
            return jsonify({'error': str(e)}), 500

    def get_weather_history(self):
        try:
            print("Fetching weather history...")
            limit = request.args.get('limit', 10, type=int)
            history = self.weather_service.get_weather_history(limit)
            print(f"Weather history: {history}")
            return jsonify(history)
        except Exception as e:
            print(f"Error in get_weather_history: {str(e)}")
            return jsonify({'error': str(e)}), 500

    def get_current_settings(self):
        try:
            print("Fetching current settings...")
            settings = self.weather_service.get_current_settings()
            print(f"Settings: {settings}")
            return jsonify(settings)
        except Exception as e:
            print(f"Error in get_current_settings: {str(e)}")
            return jsonify({'error': str(e)}), 500

    def update_settings(self):
        try:
            print("Updating settings...")
            data = request.get_json()
            print(f"Received settings data: {data}")
            latitude = data.get('latitude')
            longitude = data.get('longitude')
            
            if not latitude or not longitude:
                print("Missing latitude or longitude")
                return jsonify({'error': 'Missing latitude or longitude'}), 400

            updated_settings = self.weather_service.update_settings(latitude, longitude)
            print(f"Updated settings: {updated_settings}")
            # Trigger a weather update with new coordinates
            self.weather_service.update_weather_data()
            return jsonify(updated_settings)
        except Exception as e:
            print(f"Error in update_settings: {str(e)}")
            return jsonify({'error': str(e)}), 500
