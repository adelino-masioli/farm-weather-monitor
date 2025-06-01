from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager

from .config import settings
from .routers import settings_router, weather_router
from .services import WeatherService, AppwriteService, OpenWeatherMapService, FarmSettingsService  # For scheduler

# --- Scheduler and Application Lifespan Management ---
scheduler = AsyncIOScheduler()

async def scheduled_update_weather():
    # This function runs the scheduled weather update task
    print("Scheduler: Running scheduled_update_weather...")
    
    # Create instances of services needed for the task
    # This is a simplified approach; for more complex Dependency Injection (DI), consider exploring alternatives
    appwrite_service = AppwriteService()
    owm_service = OpenWeatherMapService()
    
    # FarmSettingsService needs the AppwriteService for fetching farm settings
    # We assume the FarmSettingsService is instantiated here, but in a larger application,
    # DI handling could be more complex.
    farm_settings_serv = FarmSettingsService(appwrite_service=appwrite_service)

    # Initialize WeatherService with the required dependencies
    weather_service = WeatherService(
        appwrite_service=appwrite_service,
        owm_service=owm_service,
        settings_service=farm_settings_serv  # Pass the instantiated FarmSettingsService
    )
    
    try:
        # Perform the weather update
        result = await weather_service.update_weather_data()
        if result:
            print(f"Scheduler: Weather data updated successfully at {result['weather'].timestamp}")
        else:
            print("Scheduler: Failed to update weather data.")
    except Exception as e:
        # Log errors in case of failure
        print(f"Scheduler: Error during scheduled weather update: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Application startup procedure
    print("Application startup...")
    
    # Fetch initial weather data
    print("Fetching initial weather data...")
    await scheduled_update_weather()  # Direct call to update weather initially

    # Schedule regular weather updates based on the configured interval
    # The update frequency is fetched from settings or defaults to the value in the config
    update_interval_minutes = settings.DEFAULT_UPDATE_FREQUENCY
    scheduler.add_job(scheduled_update_weather, 'interval', minutes=update_interval_minutes, id="update_weather_job")
    scheduler.start()
    print(f"Weather updates scheduled every {update_interval_minutes} minutes.")
    
    yield  # Application runtime
    
    # Application shutdown procedure
    print("Application shutdown...")
    scheduler.shutdown()

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Farm Weather API",
    description="API for fetching weather data and managing farm settings.",
    version="1.0.0",
    lifespan=lifespan  # Lifespan management using the async context manager
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-production-domain.com"],  # Adjust as necessary
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers for settings and weather endpoints
app.include_router(settings_router)
app.include_router(weather_router)

# Root endpoint for basic app information
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Farm Weather API!"}

# To run the app: uvicorn backend.main:app --reload --port 8000
# (Assuming your files are in a directory named 'backend')
