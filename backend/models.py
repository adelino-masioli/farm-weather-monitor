from pydantic import BaseModel, Field, validator, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime

from .config import settings  # Import the settings object for default configuration values

# --- Settings Models ---
class FarmSettingsData(BaseModel):
    # Define farm settings with default values taken from the configuration
    units: str = Field(default=settings.DEFAULT_UNITS)  # Default unit for temperature (metric or imperial)
    update_frequency: int = Field(default=settings.DEFAULT_UPDATE_FREQUENCY)  # Frequency in minutes to update weather data
    farm_latitude: float = Field(default=settings.DEFAULT_FARM_LATITUDE)  # Default latitude of the farm
    farm_longitude: float = Field(default=settings.DEFAULT_FARM_LONGITUDE)  # Default longitude of the farm
    extreme_weather_alerts: bool = Field(default=settings.DEFAULT_EXTREME_WEATHER_ALERTS)  # Whether to enable extreme weather alerts
    daily_report: bool = Field(default=settings.DEFAULT_DAILY_REPORT)  # Whether to enable daily weather reports

    @validator('farm_latitude')
    def latitude_must_be_valid(cls, v):
        # Ensure that the latitude is within valid range
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @validator('farm_longitude')
    def longitude_must_be_valid(cls, v):
        # Ensure that the longitude is within valid range
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v

class FarmSettingsResponse(FarmSettingsData):
    # Extend FarmSettingsData to include the Appwrite document ID (if applicable)
    id: Optional[str] = Field(alias="$id", default=None)  # Appwrite document ID for farm settings

    class Config:
        populate_by_name = True  # Allow automatic population of fields using names like "$id"
        from_attributes = True  # Enable ORM mode for converting Appwrite dicts to Pydantic models

# --- Weather Models ---
class WeatherLocation(BaseModel):
    # Model for storing location information (latitude, longitude, and name)
    lat: str  # Latitude as a string (can be converted to float as needed)
    lon: str  # Longitude as a string (can be converted to float as needed)
    name: str  # Name of the location

class SunData(BaseModel):
    # Model for storing sun data (sunrise and sunset times)
    sunrise: str  # Sunrise time (could be in ISO format)
    sunset: str  # Sunset time (could be in ISO format)

class WeatherData(BaseModel):
    # Model for storing weather data
    temperature: str  # Temperature at the location
    humidity: str  # Humidity level as a percentage
    wind_speed: str  # Wind speed (e.g., in km/h or mph)
    description: str  # Weather description (e.g., "Clear sky")
    icon: str  # Icon representing the weather (e.g., URL to an icon)
    feels_like: str  # Temperature as perceived by humans
    wind_gust: Optional[str] = None  # Gust speed, if available
    wind_direction: Optional[str] = None  # Wind direction, if available
    pressure: str  # Atmospheric pressure
    visibility: str  # Visibility in the area (e.g., in meters)
    location: str  # Location name as a string (could be a WeatherLocation object)
    sun: str  # Sun data (could be a SunData object)
    timestamp: Optional[datetime] = None  # Timestamp of when the data was recorded (Appwrite will handle $createdAt and $updatedAt)

    # Optional fields for Appwrite-specific document mapping
    id: Optional[str] = Field(alias="$id", default=None)  # Appwrite document ID
    collection_id: Optional[str] = Field(alias="$collectionId", default=None)  # Collection ID in Appwrite
    database_id: Optional[str] = Field(alias="$databaseId", default=None)  # Database ID in Appwrite
    created_at: Optional[datetime] = Field(alias="$createdAt", default=None)  # Creation timestamp
    updated_at: Optional[datetime] = Field(alias="$updatedAt", default=None)  # Last updated timestamp
    permissions: Optional[List[str]] = Field(alias="$permissions", default=None)  # Permissions for the document

    class Config:
        populate_by_name = True  # Enable automatic population of fields by name (e.g., $createdAt)
        from_attributes = True  # Enable ORM mode for converting Appwrite data to Pydantic models

class WeatherResponse(BaseModel):
    # Response model containing weather data and recommendations
    weather: WeatherData  # Weather data
    recommendations: List[str]  # List of weather-related recommendations (e.g., "Carry an umbrella")

class WeatherHistoryRecord(WeatherData):
    # Inherits all fields from WeatherData, extending them if necessary
    pass

class WeatherHistoryResponse(BaseModel):
    # Response model for a collection of weather history records
    total: int  # Total number of records
    documents: List[WeatherHistoryRecord]  # List of weather history records
