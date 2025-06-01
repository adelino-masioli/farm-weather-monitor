from fastapi import APIRouter, Depends, HTTPException, Query as FastAPIQuery
from typing import List, Optional

from .services import AppwriteService, OpenWeatherMapService, FarmSettingsService, WeatherService
from .models import FarmSettingsData, FarmSettingsResponse, WeatherResponse, WeatherHistoryResponse, WeatherHistoryRecord
from .config import settings  # Importing settings, if needed directly for specific configurations

# --- Dependency Injection Setup ---
# Dependency injection allows us to manage the lifecycle and dependencies of our services.
# Each service is instantiated once per request. For stateless services or those that are inexpensive to instantiate,
# this approach works fine. However, for expensive resources (e.g., DB pools), consider initializing them at app startup
# and making them available globally via app state or a more advanced DI pattern.

def get_appwrite_service():
    # Returns an instance of the AppwriteService.
    return AppwriteService()

def get_owm_service():
    # Returns an instance of the OpenWeatherMapService.
    return OpenWeatherMapService()

def get_farm_settings_service(appwrite_service: AppwriteService = Depends(get_appwrite_service)):
    # Returns an instance of the FarmSettingsService, with the AppwriteService injected as a dependency.
    return FarmSettingsService(appwrite_service)

def get_weather_service(
    appwrite_service: AppwriteService = Depends(get_appwrite_service),
    owm_service: OpenWeatherMapService = Depends(get_owm_service),
    settings_service: FarmSettingsService = Depends(get_farm_settings_service)
):
    # Returns an instance of the WeatherService with dependencies on AppwriteService, OpenWeatherMapService, and FarmSettingsService.
    return WeatherService(appwrite_service, owm_service, settings_service)

# --- Routers ---
settings_router = APIRouter(prefix="/api/settings", tags=["Settings"])  # Router for settings-related endpoints
weather_router = APIRouter(prefix="/api/weather", tags=["Weather"])  # Router for weather-related endpoints

# --- Settings Endpoints ---
@settings_router.get("", response_model=FarmSettingsResponse)
async def get_current_settings(service: FarmSettingsService = Depends(get_farm_settings_service)):
    # Endpoint to fetch the current farm settings from the service.
    # Assumes the settings document ID is known and fixed, or can be added manually here.
    farm_settings_data = await service.get_settings()
    return FarmSettingsResponse(
        **farm_settings_data.model_dump(),  # Convert the model to a dictionary and map it to the response model
        id=settings.APPWRITE_SETTINGS_DOCUMENT_ID  # Add the fixed document ID from settings
    )


@settings_router.post("", response_model=FarmSettingsResponse)
async def update_farm_settings(
    settings_update: FarmSettingsData,  # Data to update farm settings
    service: FarmSettingsService = Depends(get_farm_settings_service)
):
    # Endpoint to update the farm settings.
    updated_settings = await service.update_settings(settings_update)
    
    # If settings update fails, raise a 500 HTTP exception with an error message
    if not updated_settings:
        raise HTTPException(status_code=500, detail="Failed to update settings in Appwrite.")
    
    # Return the updated farm settings, along with the fixed document ID
    return FarmSettingsResponse(
        **updated_settings.model_dump(),  # Convert the updated model to a dictionary
        id=settings.APPWRITE_SETTINGS_DOCUMENT_ID  # Add the fixed document ID from settings
    )


# --- Weather Endpoints ---
@weather_router.get("/current", response_model=WeatherResponse)
async def get_current_weather_data(service: WeatherService = Depends(get_weather_service)):
    # Endpoint to fetch current weather data.
    data = await service.get_latest_weather()
    
    # If no weather data is found in the database, attempt to fetch and update the data from the external service
    if not data:  
        print("No current weather in DB, attempting to update...")
        data = await service.update_weather_data()
    
    # If weather data is still unavailable, raise a 404 HTTP exception
    if not data:
        raise HTTPException(status_code=404, detail="Weather data not available.")
    
    return data


@weather_router.get("/history", response_model=WeatherHistoryResponse)
async def get_weather_data_history(
    limit: int = FastAPIQuery(10, ge=1, le=100),  # Limit for number of records to return (between 1 and 100)
    offset: int = FastAPIQuery(0, ge=0),  # Offset for pagination, defaults to 0
    service: WeatherService = Depends(get_weather_service)
):
    # Endpoint to fetch historical weather data.
    history_result = await service.get_weather_history(limit=limit, offset=offset)
    
    # Validate the documents returned and convert them into WeatherHistoryRecord models
    validated_documents = [WeatherHistoryRecord.model_validate(doc) for doc in history_result.get('documents', [])]
    
    # Return the total number of records and the list of validated weather history documents
    return WeatherHistoryResponse(total=history_result.get('total', 0), documents=validated_documents)
