import os
import requests
import json
import schedule
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class WeatherMonitor:
    def __init__(self, api_key=None, farm_lat=None, farm_lon=None):
        self.api_key = api_key or os.getenv('OPENWEATHERMAP_API_KEY')
        self.latitude = farm_lat or float(os.getenv('FARM_LATITUDE', '0'))
        self.longitude = farm_lon or float(os.getenv('FARM_LONGITUDE', '0'))
        self.base_url = "https://api.openweathermap.org/data/2.5"  # Changed to HTTPS
        
    def get_current_weather(self):
        """Fetch current weather data from OpenWeatherMap API"""
        url = f"{self.base_url}/weather"
        params = {
            'lat': self.latitude,
            'lon': self.longitude,
            'appid': self.api_key,
            'units': 'metric'  # Use metric units
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error fetching current weather: {e}")
            return None

    def get_weather_forecast(self):
        """Fetch 5-day weather forecast"""
        url = f"{self.base_url}/forecast"
        params = {
            'lat': self.latitude,
            'lon': self.longitude,
            'appid': self.api_key,
            'units': 'metric'
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error fetching forecast: {e}")
            return None

    def analyze_conditions(self, weather_data):
        """Analyze weather conditions and provide farming recommendations"""
        if not weather_data:
            return None
        
        recommendations = []
        
        # Temperature analysis
        temp = weather_data['main']['temp']
        if temp > 30:
            recommendations.append("High temperature alert: Increase irrigation frequency")
        elif temp < 5:
            recommendations.append("Low temperature alert: Protect sensitive crops")
            
        # Rain analysis
        if 'rain' in weather_data:
            rain = weather_data['rain'].get('1h', 0)  # Rain volume for last hour
            if rain > 5:
                recommendations.append("Heavy rain detected: Pause irrigation")
            elif rain > 0:
                recommendations.append("Light rain detected: Reduce irrigation")
        
        # Wind analysis
        wind_speed = weather_data['wind']['speed']
        if wind_speed > 10:
            recommendations.append("High wind alert: Delay spraying operations")
            
        return recommendations

    def monitor_and_log(self):
        """Main monitoring function that runs periodically"""
        timestamp = datetime.utcnow().isoformat()
        print(f"\n=== Weather Monitoring Report: {timestamp} ===")
        
        # Get current weather
        current_weather = self.get_current_weather()
        if current_weather:
            temp = current_weather['main']['temp']
            humidity = current_weather['main']['humidity']
            print(f"Temperature: {temp}°C")
            print(f"Humidity: {humidity}%")
            
            # Get recommendations
            recommendations = self.analyze_conditions(current_weather)
            if recommendations:
                print("\nRecommendations:")
                for rec in recommendations:
                    print(f"- {rec}")
        
        # Log data to file
        self.log_weather_data(current_weather)

    def log_weather_data(self, weather_data):
        """Log weather data to a JSON file"""
        if not weather_data:
            return
            
        timestamp = datetime.utcnow().isoformat()
        log_entry = {
            'timestamp': timestamp,
            'weather_data': weather_data
        }
        
        # Ensure logs directory exists
        os.makedirs('logs', exist_ok=True)
        
        # Write to daily log file
        date = timestamp.split('T')[0]
        log_file = f"logs/weather_log_{date}.json"
        
        try:
            # Read existing logs
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    logs = json.load(f)
            else:
                logs = []
                
            # Append new log
            logs.append(log_entry)
            
            # Write updated logs
            with open(log_file, 'w') as f:
                json.dump(logs, f, indent=2)
                
        except Exception as e:
            print(f"Error logging weather data: {e}")

def main():
    monitor = WeatherMonitor()
    
    # Schedule monitoring every 30 minutes
    schedule.every(30).minutes.do(monitor.monitor_and_log)
    
    # Run initial monitoring
    monitor.monitor_and_log()
    
    # Keep the script running
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()
