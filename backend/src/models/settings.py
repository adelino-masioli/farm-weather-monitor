from dataclasses import dataclass
from typing import Optional, Any

# Settings field names
class SettingsFields:
    UNITS = 'units'
    UPDATE_FREQUENCY = 'update_frequency'
    FARM_LATITUDE = 'farm_latitude'
    FARM_LONGITUDE = 'farm_longitude'
    EXTREME_WEATHER_ALERTS = 'extreme_weather_alerts'
    DAILY_REPORT = 'daily_report'

@dataclass
class Settings:
    units: str
    update_frequency: int
    farm_latitude: float
    farm_longitude: float
    extreme_weather_alerts: bool
    daily_report: bool

    @staticmethod
    def normalize_number(value: Any) -> str:
        """Convert value to string and normalize decimal separator"""
        if value is None:
            return ""
        # Convert to string and replace comma with period
        return str(value).replace(",", ".")

    @staticmethod
    def validate_coordinates(latitude: Any, longitude: Any) -> Optional[str]:
        """Validate latitude and longitude values"""
        # Check if values are provided
        if latitude is None or longitude is None:
            return "Latitude and longitude are required"

        # Normalize numbers
        lat_str = Settings.normalize_number(latitude)
        lon_str = Settings.normalize_number(longitude)

        # Try to convert to float
        try:
            lat = float(lat_str)
            lon = float(lon_str)
        except (ValueError, TypeError):
            return "Latitude and longitude must be valid numbers"

        # Check for infinite values
        if not all(map(lambda x: isinstance(x, (int, float)) and abs(x) != float('inf'), [lat, lon])):
            return "Latitude and longitude must be finite numbers"

        if lat < -90 or lat > 90:
            return "Latitude must be between -90 and 90 degrees"

        if lon < -180 or lon > 180:
            return "Longitude must be between -180 and 180 degrees"

        return None

    @staticmethod
    def from_dict(data: dict) -> 'Settings':
        fields = SettingsFields

        # Validate required fields
        if fields.FARM_LATITUDE not in data or fields.FARM_LONGITUDE not in data:
            raise ValueError("Latitude and longitude are required")

        try:
            # Normalize and validate coordinates
            lat_str = Settings.normalize_number(data.get(fields.FARM_LATITUDE))
            lon_str = Settings.normalize_number(data.get(fields.FARM_LONGITUDE))

            error = Settings.validate_coordinates(lat_str, lon_str)
            if error:
                raise ValueError(error)

            # Convert to appropriate types
            lat = float(lat_str)
            lon = float(lon_str)

            return Settings(
                units=data.get(fields.UNITS, ""),
                update_frequency=int(data.get(fields.UPDATE_FREQUENCY, 0)),
                farm_latitude=lat,
                farm_longitude=lon,
                extreme_weather_alerts=bool(data.get(fields.EXTREME_WEATHER_ALERTS, False)),
                daily_report=bool(data.get(fields.DAILY_REPORT, False))
            )
        except (ValueError, TypeError) as e:
            raise ValueError(str(e))

    def to_dict(self) -> dict:
        fields = SettingsFields
        return {
            fields.UNITS: self.units,
            fields.UPDATE_FREQUENCY: self.update_frequency,
            fields.FARM_LATITUDE: self.farm_latitude,
            fields.FARM_LONGITUDE: self.farm_longitude,
            fields.EXTREME_WEATHER_ALERTS: self.extreme_weather_alerts,
            fields.DAILY_REPORT: self.daily_report
        }
