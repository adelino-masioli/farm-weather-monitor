export interface WeatherData {
  temperature: string;
  humidity: string;
  wind_speed: string;
  description: string;
  icon: string;
  timestamp: string;
  recommendations?: string[];
  feels_like: string;
  pressure: string;
  visibility: string;
  wind_direction: string;
  wind_gust: string;
  location: string; // It comes as a string that needs to be parsed
  sun: string; // It comes as a string that needs to be parsed
}

export interface Settings {
  latitude: string;
  longitude: string;
}

export interface WeatherError {
  error: string;
}