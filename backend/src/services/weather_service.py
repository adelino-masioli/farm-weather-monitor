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
            # Safely get values with default empty strings
            main_data = raw_data.get('main', {})
            wind_data = raw_data.get('wind', {})
            weather_list = raw_data.get('weather', [{}])
            weather_data = weather_list[0] if weather_list else {}
            sys_data = raw_data.get('sys', {})

            # Create location data
            location_data = {
                'lat': str(self.weather_monitor.latitude),
                'lon': str(self.weather_monitor.longitude),
                'name': raw_data.get('name', 'Unknown Location')
            }

            # Create sun data
            sun_data = {
                'sunrise': str(sys_data.get('sunrise', '')),
                'sunset': str(sys_data.get('sunset', ''))
            }

            weather_data = {
                'temperature': str(main_data.get('temp', '0')),
                'humidity': str(main_data.get('humidity', '0')),
                'wind_speed': str(wind_data.get('speed', '0')),
                'description': weather_data.get('description', ''),
                'icon': weather_data.get('icon', ''),
                'feels_like': str(main_data.get('feels_like', '0')),
                'wind_gust': str(wind_data.get('gust', '0')),
                'wind_direction': str(wind_data.get('deg', '0')),
                'pressure': str(main_data.get('pressure', '0')),
                'visibility': str(raw_data.get('visibility', '0')),
                'location': str(location_data),  # Convert dict to string as Appwrite expects string
                'sun': str(sun_data)  # Convert dict to string as Appwrite expects string
            }
            
            # Get recommendations separately
            recommendations = self._get_recommendations(raw_data)
            
            # Return both weather data and recommendations
            return {
                'weather': weather_data,
                'recommendations': recommendations
            }
        except Exception as e:
            print(f"Error transforming weather data: {str(e)}")
            return None

    def _get_recommendations(self, weather_data):
        if not weather_data or 'main' not in weather_data:
            return []

        temp = weather_data['main'].get('temp', 0)
        condition_value = self._get_condition_value(temp, 
                                                  weather_data['main'].get('humidity', 0),
                                                  weather_data.get('wind', {}).get('speed', 0))
        
        # Temporary hardcoded recommendations until Appwrite collection is set up
        recommendations_map = {
            "cold": ["Cold weather: Consider protecting sensitive plants"],
            "hot": ["Hot weather: Increase watering frequency"],
            "dry": ["Low humidity: Monitor soil moisture"],
            "humid": ["High humidity: Watch for fungal diseases"],
            "windy": ["Strong winds: Check plant support systems"],
            "normal": ["Weather conditions are optimal"]
        }
        
        return recommendations_map.get(condition_value, [])

    def _get_condition_value(self, temp, humidity, wind_speed):
        # Determine condition value based on weather parameters
        if temp < 10:
            return "cold"
        elif temp > 30:
            return "hot"
        elif humidity < 30:
            return "dry"
        elif humidity > 80:
            return "humid"
        elif wind_speed > 10:
            return "windy"
        return "normal"

    def update_weather_data(self):
        try:
            # Update the monitor's coordinates before getting weather
            self.weather_monitor.latitude = float(self.settings['latitude'])
            self.weather_monitor.longitude = float(self.settings['longitude'])
            raw_weather_data = self.weather_monitor.get_current_weather()
            
            if raw_weather_data:
                transformed_data = self._transform_weather_data(raw_weather_data)
                if transformed_data:
                    # Save only the weather data to Appwrite
                    saved_weather = self.storage.save_weather_data(transformed_data['weather'])
                    if saved_weather:
                        # Return both weather and recommendations
                        return {
                            **saved_weather,
                            'recommendations': transformed_data['recommendations']
                        }
            return None
        except Exception as e:
            print(f"Error updating weather data: {str(e)}")
            return None

    def get_latest_weather(self):
        try:
            weather_data = self.storage.get_latest_weather()
            if not weather_data:
                print("No weather data found")
                return None

            # Ensure we have the required fields
            if 'temperature' not in weather_data or 'humidity' not in weather_data or 'wind_speed' not in weather_data:
                print("Missing required weather fields")
                return None

            # Get recommendations based on the stored weather data
            raw_data = {
                'main': {
                    'temp': float(weather_data.get('temperature', '0')),
                    'humidity': float(weather_data.get('humidity', '0'))
                },
                'wind': {
                    'speed': float(weather_data.get('wind_speed', '0'))
                }
            }
            recommendations = self._get_recommendations(raw_data)
            
            return {
                'weather': weather_data,
                'recommendations': recommendations
            }
        except Exception as e:
            print(f"Error getting latest weather: {str(e)}")
            return None

    def get_weather_history(self, limit=10):
        return self.storage.get_weather_history(limit)

    def update_settings(self, latitude, longitude):
        self.settings['latitude'] = str(latitude)
        self.settings['longitude'] = str(longitude)
        self.storage.update_settings(self.settings)
        return self.settings

    def get_current_settings(self):
        return self.settings
