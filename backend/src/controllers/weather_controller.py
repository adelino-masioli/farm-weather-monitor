from flask import Blueprint, jsonify, request

class WeatherController:
    def __init__(self, weather_service):
        self.weather_service = weather_service
        self.bp = Blueprint('weather', __name__)
        self.register_routes()

    def register_routes(self):
        self.bp.route('/api/weather/current', methods=['GET'])(self.get_current_weather)
        self.bp.route('/api/weather/history', methods=['GET'])(self.get_weather_history)

    def get_current_weather(self):
        try:
            weather_data = self.weather_service.get_latest_weather()
            if weather_data is None:
                weather_data = self.weather_service.update_weather_data()
            return jsonify(weather_data if weather_data else {})
        except Exception as e:
            print(f"Error in get_current_weather: {str(e)}")
            return jsonify({'error': str(e)}), 500

    def get_weather_history(self):
        try:
            limit = request.args.get('limit', 10, type=int)
            history = self.weather_service.get_weather_history(limit)
            return jsonify(history)
        except Exception as e:
            print(f"Error in get_weather_history: {str(e)}")
            return jsonify({'error': str(e)}), 500