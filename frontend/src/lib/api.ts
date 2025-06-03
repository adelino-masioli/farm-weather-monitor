// Em lib/api.ts
import axios from "axios";
// Importe os tipos consolidados
import { Settings, CurrentWeatherDataResponse, WeatherHistoryResponse } from "../types/weather"; // Ajuste o caminho conforme necessário

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const handleApiError = (error: any, endpoint: string): never => { // :never indica que a função sempre lança um erro
  console.error(`Error calling ${endpoint}:`, error);
  if (axios.isAxiosError(error)) {
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
  }
  throw error; // Re-lança o erro para ser tratado pelo SWR ou chamador
};

export const api = {
  getCurrentWeather: async (): Promise<CurrentWeatherDataResponse> => {
    try {
      // Use o tipo genérico para obter type safety na resposta do axios
      const response = await axios.get<CurrentWeatherDataResponse>(`${API_BASE_URL}/weather/current`);
      // O backend já retorna o formato { weather: {...}, recommendations: [] }
      // Apenas garanta que recommendations seja um array se a API puder omiti-lo (embora o Pydantic deva garantir isso)
      return {
        ...response.data,
        recommendations: response.data.recommendations || [],
      };
    } catch (error) {
      return handleApiError(error, "getCurrentWeather");
    }
  },

  getWeatherHistory: async (): Promise<WeatherHistoryResponse> => { // Use o tipo WeatherHistoryResponse
    try {
      const response = await axios.get<WeatherHistoryResponse>(`${API_BASE_URL}/weather/history`);
      return response.data;
    } catch (error) {
      return handleApiError(error, "getWeatherHistory");
    }
  },

  getSettings: async (): Promise<Settings> => {
    try {
      const response = await axios.get<Settings>(`${API_BASE_URL}/settings`);
      return response.data;
    } catch (error) {
      return handleApiError(error, "getSettings");
    }
  },

  updateSettings: async (settings: Omit<Settings, '$id'>): Promise<Settings> => { // Omit '$id' para o payload de POST
    try {
      const response = await axios.post<Settings>(`${API_BASE_URL}/settings`, settings);
      return response.data;
    } catch (error) {
      return handleApiError(error, "updateSettings");
    }
  },
};