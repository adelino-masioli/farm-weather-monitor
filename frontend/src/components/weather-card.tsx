'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import useSWR from "swr"
import { CloudSun } from "lucide-react"
import Image from "next/image"


import { CurrentWeatherDataResponse } from "@/types/weather";

export function WeatherCard() {
  const { data: currentWeather, error } = useSWR<CurrentWeatherDataResponse>(
    'currentWeather', 
    api.getCurrentWeather,
    {
      refreshInterval: 300000 
    }
  );

  if (error) {
    return <div>Error loading weather data</div>
  }
  
  if (!currentWeather?.weather?.temperature) {
    return <div>Loading...</div>
  }

  // Safe parsing of temperature
  const temperature = currentWeather.weather.temperature
  const tempNumber = temperature ? parseFloat(temperature) : null
  const displayTemp = tempNumber !== null ? tempNumber.toFixed(1) : '--'

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-2xl font-bold">Current Weather</CardTitle>
          <p className="text-sm text-muted-foreground">Real-time weather conditions</p>
        </div>
        <CloudSun className="h-8 w-8 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="mt-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-bold">{displayTemp}°C</div>
            <div className="mt-2 text-xl text-muted-foreground capitalize">
              {currentWeather.weather.description || 'No description available'}
            </div>
            {currentWeather.recommendations && currentWeather.recommendations.length > 0 && (
              <div className="mt-6 space-y-2">
                {currentWeather.recommendations.map((recommendation, index) => (
                  <div key={index} className="text-sm text-muted-foreground  flex items-center gap-2">
                    <Image
                      src={`http://openweathermap.org/img/w/${currentWeather.weather.icon}.png`}
                      alt={currentWeather.weather.description}
                      width={48}
                      height={48}
                      sizes="48px"
                      className="w-12 h-12"
                    />
                    {recommendation}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
