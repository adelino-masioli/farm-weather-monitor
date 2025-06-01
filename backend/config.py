from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from pathlib import Path

# Load the .env file located in the same directory as this config.py file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    # API keys and endpoints
    OPENWEATHERMAP_API_KEY: str
    APPWRITE_ENDPOINT: str
    APPWRITE_PROJECT_ID: str
    APPWRITE_DATABASE_ID: str
    APPWRITE_API_KEY: str

    # Appwrite collection and document identifiers (must match keys in the .env file)
    APPWRITE_COLLECTION_ID: str  # Collection for weather data
    APPWRITE_COLLECTION_SETTINGS_ID: str  # Collection for application settings
    APPWRITE_SETTINGS_DOCUMENT_ID: str  # Document ID for default settings
    APPWRITE_RECOMMENDATIONS_COLLECTION_ID: str = "weather_recommendations"  # Collection for recommendations

    # Default fallback values if no user-defined settings are found
    DEFAULT_FARM_LATITUDE: float = 41.1579
    DEFAULT_FARM_LONGITUDE: float = -8.6291
    DEFAULT_UNITS: str = "metric"  # Metric system for weather data
    DEFAULT_UPDATE_FREQUENCY: int = 30  # Frequency (in minutes) to fetch weather updates
    DEFAULT_EXTREME_WEATHER_ALERTS: bool = False  # Enable or disable extreme weather notifications
    DEFAULT_DAILY_REPORT: bool = False  # Enable or disable daily weather reports

    # Server and external API settings
    PORT: int = 8000
    OPENWEATHERMAP_BASE_URL: str = "https://api.openweathermap.org/data/2.5"

    class Config:
        # Ignore unknown fields in the .env or environment variables
        extra = 'ignore'

# Create a single instance of Settings to be reused across the application
settings = Settings()
