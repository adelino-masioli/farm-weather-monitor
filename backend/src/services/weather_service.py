from backend.src.services.weather_monitor import WeatherMonitor
from backend.src.services.appwrite_storage import AppwriteStorageService
import os
from datetime import datetime

class WeatherService:
    def __init__(self, api_key):
        self.storage = AppwriteStorageService()
        self.weather_monitor = WeatherMonitor(api_key=api_key)
        self.settings = self.storage.get_settings()

    def _transform_weather_data(self, raw_data):
        if not raw_data:
            return None
            
        try:
            return {
                'temperature': raw_data.get('main', {}).get('temp'),
                'humidity': raw_data.get('main', {}).get('humidity'),
                'wind_speed': raw_data.get('wind', {}).get('speed'),
                'description': raw_data.get('weather', [{}])[0].get('description', ''),
                'icon': raw_data.get('weather', [{}])[0].get('icon', ''),
                'recommendations': self._get_recommendations(raw_data)
            }
        except Exception as e:
            print(f"Error transforming weather data: {str(e)}")
            return None

    def _get_recommendations(self, weather_data):
        recommendations = []
        if not weather_data or 'main' not in weather_data:
            return recommendations

        temp = weather_data['main'].get('temp', 0)
        humidity = weather_data['main'].get('humidity', 0)
        wind_speed = weather_data.get('wind', {}).get('speed', 0)

        # Temperature-based recommendations
        if temp < 10:
            recommendations.append("Cold weather: Consider protecting sensitive plants")
        elif temp > 30:
            recommendations.append("Hot weather: Increase watering frequency")

        # Humidity-based recommendations
        if humidity < 30:
            recommendations.append("Low humidity: Monitor soil moisture")
        elif humidity > 80:
            recommendations.append("High humidity: Watch for fungal diseases")

        # Wind-based recommendations
        if wind_speed > 10:
            recommendations.append("Strong winds: Check plant support systems")

        return recommendations

    def update_weather_data(self):
        try:
            # Update the monitor's coordinates before getting weather
            self.weather_monitor.latitude = float(self.settings['latitude'])
            self.weather_monitor.longitude = float(self.settings['longitude'])
            raw_weather_data = self.weather_monitor.get_current_weather()
            
            if raw_weather_data:
                weather_data = self._transform_weather_data(raw_weather_data)
                if weather_data:
                    return self.storage.save_weather_data(weather_data)
        except Exception as e:
            print(f"Error updating weather data: {str(e)}")
            return None

    def get_latest_weather(self):
        return self.storage.get_latest_weather()

    def get_weather_history(self, limit=10):
        return self.storage.get_weather_history(limit)

    def update_settings(self, latitude, longitude):
        self.settings['latitude'] = str(latitude)
        self.settings['longitude'] = str(longitude)
        self.storage.update_settings(self.settings)
        return self.settings

    def get_current_settings(self):
        return self.settings
