// Em @/types/weather.ts ou ../types/weather.ts

export interface LocationData {
  lat: string;
  lon: string;
  name: string;
}

export interface SunData {
  sunrise: string;
  sunset: string;
}

// Representa a estrutura completa de um registro de clima do backend
// Inclui todos os campos de api/models.py WeatherData
export interface WeatherDataBackend {
  $id?: string;
  $collectionId?: string;
  $databaseId?: string;
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];

  temperature: string;
  humidity: string;
  wind_speed: string;
  description: string;
  icon: string;
  feels_like: string;
  wind_gust?: string | null;
  wind_direction?: string | null;
  pressure: string;
  visibility: string;
  location: string; // String JSON de LocationData
  sun: string;      // String JSON de SunData
  timestamp: string; // Ou Date, se você converter
}

// Representa a resposta do endpoint /weather/current
export interface CurrentWeatherDataResponse {
  weather: WeatherDataBackend; // Usa o tipo completo do backend
  recommendations: string[];
}

export interface WeatherHistoryDocument extends WeatherDataBackend {}

export interface WeatherHistoryResponse {
  total: number;
  documents: WeatherHistoryDocument[];
}

export interface Settings {
  $id?: string; // Adicionado para consistência com a resposta da API
  farm_latitude: number;
  farm_longitude: number;
  units: string;
  update_frequency: number;
  extreme_weather_alerts: boolean;
  daily_report: boolean;
}