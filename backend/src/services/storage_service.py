import json
import os
from datetime import datetime
from pathlib import Path

class StorageService:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent.parent / 'data'
        self.data_dir.mkdir(exist_ok=True)
        self.weather_file = self.data_dir / 'weather.json'
        self.settings_file = self.data_dir / 'settings.json'
        self._init_files()

    def _init_files(self):
        if not self.weather_file.exists():
            self._save_json(self.weather_file, {'records': []})
        if not self.settings_file.exists():
            default_settings = {
                'latitude': os.getenv('FARM_LATITUDE', '40.7128'),
                'longitude': os.getenv('FARM_LONGITUDE', '-74.0060')
            }
            self._save_json(self.settings_file, default_settings)

    def _save_json(self, file_path: Path, data: dict):
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)

    def _load_json(self, file_path: Path) -> dict:
        if not file_path.exists():
            return {}
        with open(file_path, 'r') as f:
            return json.load(f)

    def save_weather_data(self, weather_data: dict):
        data = self._load_json(self.weather_file)
        records = data.get('records', [])
        weather_data['timestamp'] = datetime.utcnow().isoformat()
        records.append(weather_data)
        # Keep only the last 100 records
        if len(records) > 100:
            records = records[-100:]
        data['records'] = records
        self._save_json(self.weather_file, data)
        return weather_data

    def get_latest_weather(self):
        data = self._load_json(self.weather_file)
        records = data.get('records', [])
        return records[-1] if records else None

    def get_weather_history(self, limit=10):
        data = self._load_json(self.weather_file)
        records = data.get('records', [])
        return records[-limit:]

    def get_settings(self):
        return self._load_json(self.settings_file)

    def update_settings(self, settings: dict):
        self._save_json(self.settings_file, settings)
        return settings
