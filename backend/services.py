import httpx
from appwrite.client import Client as AppwriteClientSDK
from appwrite.services.databases import Databases
from appwrite.id import ID as AppwriteID
from appwrite.query import Query as AppwriteQuery
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple

from .config import settings
from .models import FarmSettingsData, WeatherData, WeatherLocation, SunData

# --- Appwrite Client ---
class AppwriteService:
    def __init__(self):
        client = AppwriteClientSDK()
        client.set_endpoint(settings.APPWRITE_ENDPOINT)
        client.set_project(settings.APPWRITE_PROJECT_ID)
        client.set_key(settings.APPWRITE_API_KEY)
        self.databases = Databases(client)
        self.db_id = settings.APPWRITE_DATABASE_ID

    def get_document(self, collection_id: str, document_id: str) -> Optional[Dict[str, Any]]:
        try:
            return self.databases.get_document(self.db_id, collection_id, document_id)
        except Exception as e:
            print(f"Appwrite: Error getting document {document_id} from {collection_id}: {e}")
            return None

    def update_document(self, collection_id: str, document_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            return self.databases.update_document(self.db_id, collection_id, document_id, data)
        except Exception as e:
            print(f"Appwrite: Error updating document {document_id} in {collection_id}: {e}")
            return None
    
    def create_document(self, collection_id: str, document_id:str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            doc_id = document_id if document_id != AppwriteID.unique() else AppwriteID.unique()
            return self.databases.create_document(self.db_id, collection_id, doc_id, data)
        except Exception as e:
            print(f"Appwrite: Error creating document in {collection_id}: {e}")
            return None

    def list_documents(self, collection_id: str, queries: Optional[List[str]] = None) -> Dict[str, Any]:
        try:
            return self.databases.list_documents(self.db_id, collection_id, queries=queries)
        except Exception as e:
            print(f"Appwrite: Error listing documents from {collection_id}: {e}")
            return {'total': 0, 'documents': []}

# --- OpenWeatherMap Client ---
class OpenWeatherMapService:
    def __init__(self):
        self.api_key = settings.OPENWEATHERMAP_API_KEY
        self.base_url = settings.OPENWEATHERMAP_BASE_URL

    async def get_current_weather(self, lat: float, lon: float, units: str = "metric") -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/weather"
        params = {'lat': lat, 'lon': lon, 'appid': self.api_key, 'units': units}
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.RequestError as e:
                print(f"OpenWeatherMap: Error fetching current weather: {e}")
                return None
            except httpx.HTTPStatusError as e:
                print(f"OpenWeatherMap: HTTP error fetching current weather: {e.response.status_code} - {e.response.text}")
                return None



# --- Settings Service ---
class FarmSettingsService:
    def __init__(self, appwrite_service: AppwriteService):
        self.appwrite = appwrite_service
        self.collection_id = settings.APPWRITE_COLLECTION_SETTINGS_ID  # FIXED: matches .env file
        self.document_id = settings.APPWRITE_SETTINGS_DOCUMENT_ID
        self.default_settings = FarmSettingsData(
            farm_latitude=settings.DEFAULT_FARM_LATITUDE,
            farm_longitude=settings.DEFAULT_FARM_LONGITUDE,
            units=settings.DEFAULT_UNITS,
            update_frequency=settings.DEFAULT_UPDATE_FREQUENCY,
            extreme_weather_alerts=settings.DEFAULT_EXTREME_WEATHER_ALERTS,
            daily_report=settings.DEFAULT_DAILY_REPORT
        )

    async def get_settings(self) -> FarmSettingsData:
        doc = await run_in_threadpool(self.appwrite.get_document, self.collection_id, self.document_id)
        if doc:
            # Filter out Appwrite metadata before parsing with Pydantic
            appwrite_meta_keys = ['$id', '$collectionId', '$databaseId', '$createdAt', '$updatedAt', '$permissions']
            filtered_doc_data = {k: v for k, v in doc.items() if k not in appwrite_meta_keys}
            return FarmSettingsData(**filtered_doc_data)

        print(f"Settings document {self.document_id} not found, attempting to create with defaults.")
        try:
            # Create with default settings if not found
            created_doc = await run_in_threadpool(
                self.appwrite.create_document,
                self.collection_id,
                self.document_id, # Use specific ID for settings
                self.default_settings.model_dump()
            )
            if created_doc:
                print("Created default settings document.")
                return self.default_settings
            else:
                print("Failed to create default settings document. Returning in-memory defaults.")
                return self.default_settings
        except Exception as e:
            print(f"Error creating default settings: {e}. Returning in-memory defaults.")
            return self.default_settings


    async def update_settings(self, settings_data: FarmSettingsData) -> Optional[FarmSettingsData]:
        updated_doc = await run_in_threadpool(
            self.appwrite.update_document,
            self.collection_id,
            self.document_id,
            settings_data.model_dump()
        )
        if updated_doc:
            appwrite_meta_keys = ['$id', '$collectionId', '$databaseId', '$createdAt', '$updatedAt', '$permissions']
            filtered_doc_data = {k: v for k, v in updated_doc.items() if k not in appwrite_meta_keys}
            return FarmSettingsData(**filtered_doc_data)
        return None

# --- Weather Service ---
class WeatherService:
    def __init__(self, appwrite_service: AppwriteService, owm_service: OpenWeatherMapService, settings_service: FarmSettingsService):
        self.appwrite = appwrite_service
        self.owm = owm_service
        self.settings_service = settings_service
        self.weather_collection_id = settings.APPWRITE_COLLECTION_ID  # FIXED: was APPWRITE_WEATHER_COLLECTION_ID
        self.reco_collection_id = settings.APPWRITE_RECOMMENDATIONS_COLLECTION_ID

    def _transform_weather_data(self, raw_data: Dict[str, Any], lat: float, lon: float) -> Optional[WeatherData]:
        if not raw_data: return None
        try:
            main = raw_data.get('main', {})
            wind = raw_data.get('wind', {})
            weather_info = raw_data.get('weather', [{}])[0]
            sys_info = raw_data.get('sys', {})

            location = WeatherLocation(lat=str(lat), lon=str(lon), name=raw_data.get('name', 'Unknown'))
            sun_data = SunData(sunrise=str(sys_info.get('sunrise', '')), sunset=str(sys_info.get('sunset', '')))

            return WeatherData(
                temperature=str(main.get('temp', '0')),
                humidity=str(main.get('humidity', '0')),
                wind_speed=str(wind.get('speed', '0')),
                description=weather_info.get('description', ''),
                icon=weather_info.get('icon', ''),
                feels_like=str(main.get('feels_like', '0')),
                wind_gust=str(wind.get('gust', '0')) if 'gust' in wind else None,
                wind_direction=str(wind.get('deg', '0')) if 'deg' in wind else None,
                pressure=str(main.get('pressure', '0')),
                visibility=str(raw_data.get('visibility', '0')),
                location=location.model_dump_json(), # Serialize to JSON string
                sun=sun_data.model_dump_json(),       # Serialize to JSON string
                timestamp=datetime.utcnow()
            )
        except Exception as e:
            print(f"Error transforming weather data: {e}")
            return None

    def _get_condition_value(self, temp: float, humidity: float, wind_speed: float) -> str:
        if temp < 10: return "cold"
        if temp > 30: return "hot"
        if humidity < 30: return "dry"
        if humidity > 80: return "humid"
        if wind_speed > 10: return "windy"
        return "normal"

    async def _get_recommendations(self, weather_for_reco: Dict[str, Any]) -> List[str]:
        temp = float(weather_for_reco.get('main', {}).get('temp', 0))
        humidity = float(weather_for_reco.get('main', {}).get('humidity', 0))
        wind_speed = float(weather_for_reco.get('wind', {}).get('speed', 0))
        
        condition = self._get_condition_value(temp, humidity, wind_speed)
        
        # Try Appwrite recommendations
        if settings.APPWRITE_RECOMMENDATIONS_COLLECTION_ID:
            try:
                queries = [AppwriteQuery.equal("condition_value", condition), AppwriteQuery.limit(5)]
                reco_docs_result = await run_in_threadpool(
                    self.appwrite.list_documents,
                    self.reco_collection_id,
                    queries
                )
                if reco_docs_result and reco_docs_result['total'] > 0:
                    return [doc['recommendation_text'] for doc in reco_docs_result['documents'] if 'recommendation_text' in doc] # Adjust field name
            except Exception as e:
                print(f"Could not fetch recommendations from Appwrite for condition '{condition}': {e}")

        # Fallback to hardcoded recommendations
        hardcoded_recommendations = {
            "cold": ["Cold weather: Consider protecting sensitive plants."],
            "hot": ["Hot weather: Increase watering frequency."],
            "dry": ["Low humidity: Monitor soil moisture."],
            "humid": ["High humidity: Watch for fungal diseases."],
            "windy": ["Strong winds: Check plant support systems."],
            "normal": ["Weather conditions are optimal."]
        }
        return hardcoded_recommendations.get(condition, [])

    async def update_weather_data(self) -> Optional[Dict[str, Any]]:
        current_settings = await self.settings_service.get_settings()
        lat = current_settings.farm_latitude
        lon = current_settings.farm_longitude
        
        raw_weather = await self.owm.get_current_weather(lat, lon, current_settings.units)
        if not raw_weather:
            print("Failed to fetch raw weather from OWM.")
            return None

        transformed_weather = self._transform_weather_data(raw_weather, lat, lon)
        if not transformed_weather:
            print("Failed to transform weather data.")
            return None

        # Save to Appwrite
        # Pass AppwriteID.unique() for document_id to let Appwrite generate it.
        saved_doc = await run_in_threadpool(
            self.appwrite.create_document,
            self.weather_collection_id,
            AppwriteID.unique(), # Let Appwrite generate ID
            transformed_weather.model_dump(exclude_none=True) # Exclude Nones
        )

        if not saved_doc:
            print("Failed to save weather data to Appwrite.")
            return None
        
        recommendations = await self._get_recommendations(raw_weather) # Use raw_weather for recommendations
        
        # Return data compatible with WeatherResponse model
        # Map saved_doc back to WeatherData model before constructing the final response.
        # This ensures that Appwrite-generated fields like $id are included if WeatherData model expects them.
        weather_data_for_response = WeatherData.model_validate(saved_doc)

        return {"weather": weather_data_for_response, "recommendations": recommendations}


    async def get_latest_weather(self) -> Optional[Dict[str, Any]]:
        queries = [AppwriteQuery.order_desc("$createdAt"), AppwriteQuery.limit(1)]
        latest_docs_result = await run_in_threadpool(self.appwrite.list_documents, self.weather_collection_id, queries)
        
        if latest_docs_result and latest_docs_result['total'] > 0:
            latest_weather_doc = latest_docs_result['documents'][0]
            
            # For recommendations, we need data OWM-like structure for temp, humidity, speed
            # Try to reconstruct it or fetch fresh if fields are missing. For simplicity, use stored values.
            # Note: The original flask app re-calculates recommendations based on stored temp, humidity, wind_speed
            # This requires these fields to be stored as numbers, or convertible to numbers.
            # The current _transform_weather_data stores them as strings.
            # For robust recommendation, ensure numeric storage or parse carefully.
            
            raw_data_for_reco = { # Construct a simple dict for recommendation engine
                'main': {
                    'temp': float(latest_weather_doc.get('temperature', '0')),
                    'humidity': float(latest_weather_doc.get('humidity', '0'))
                },
                'wind': {
                    'speed': float(latest_weather_doc.get('wind_speed', '0'))
                }
            }
            recommendations = await self._get_recommendations(raw_data_for_reco)
            
            weather_data_model = WeatherData.model_validate(latest_weather_doc)
            return {"weather": weather_data_model, "recommendations": recommendations}
        print("No latest weather found in Appwrite.")
        return None

    async def get_weather_history(self, limit: int = 10, offset: int = 0) -> Dict[str, Any]:
        queries = [
            AppwriteQuery.order_desc("$createdAt"),
            AppwriteQuery.limit(limit),
            AppwriteQuery.offset(offset)
        ]
        history_docs_result = await run_in_threadpool(self.appwrite.list_documents, self.weather_collection_id, queries)
        
        # Documents are already dicts, can be validated by Pydantic list[WeatherData] if needed
        return history_docs_result # This is {'total': X, 'documents': [...]}

# Helper to run sync Appwrite calls in a thread pool
from fastapi.concurrency import run_in_threadpool