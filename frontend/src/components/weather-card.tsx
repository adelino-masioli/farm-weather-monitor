'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import useSWR from "swr"
import { CloudSun } from "lucide-react"

interface WeatherData {
  temperature: number
  humidity: number
  wind_speed: number
  description: string
  icon: string
  recommendations: string[]
  timestamp: string
}

export function WeatherCard() {
  const { data: currentWeather, error } = useSWR('currentWeather', api.getCurrentWeather, {
    refreshInterval: 300000 // refresh every 5 minutes
  })

  if (error) return <div>Error loading weather data</div>
  if (!currentWeather) return <div>Loading...</div>

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
            <div className="text-5xl font-bold">{currentWeather.temperature}°C</div>
            <div className="mt-2 text-xl text-muted-foreground capitalize">
              {currentWeather.description}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
