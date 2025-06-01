'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import useSWR from "swr"
import { 
  Droplets, 
  Gauge, 
  Thermometer, 
  Wind,
  Eye,
  MapPin,
  Sunrise
} from "lucide-react"
import { useEffect, useState } from "react"
import { WeatherData } from "@/types/weather"

export function DetailedMetrics() {
  const { data: currentWeather, error } = useSWR<WeatherData>('currentWeather', api.getCurrentWeather, {
    refreshInterval: 300000 // refresh every 5 minutes
  })

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  if (error) return <div>Error loading weather data</div>
  if (!currentWeather?.weather) return <div>Loading...</div>

  let location = { lat: '0', lon: '0', name: 'Unknown Location' }
  let sun = { sunrise: '0', sunset: '0' }

  try {
    if (currentWeather.weather.location) {
      location = JSON.parse(currentWeather.weather.location.replace(/'/g, '"'))
    }
  } catch (e) {
    console.error('Error parsing location:', e)
  }

  try {
    if (currentWeather.weather.sun) {
      sun = JSON.parse(currentWeather.weather.sun.replace(/'/g, '"'))
    }
  } catch (e) {
    console.error('Error parsing sun data:', e)
  }

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp) * 1000)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (e) {
      return '--:--'
    }
  }

  const metrics = [
    {
      title: "Temperature",
      value: `${parseFloat(currentWeather.weather.temperature || '0').toFixed(1)}°C`,
      icon: Thermometer,
      description: "Current temperature",
    },
    {
      title: "Feels Like",
      value: `${parseFloat(currentWeather.weather.feels_like || '0').toFixed(1)}°C`,
      icon: Thermometer,
      description: "Perceived temperature",
    },
    {
      title: "Humidity",
      value: `${currentWeather.weather.humidity || '0'}%`,
      icon: Droplets,
      description: "Relative humidity",
    },
    {
      title: "Wind",
      value: (
        <div className="space-y-1">
          <div>Speed: {currentWeather.weather.wind_speed || '0'} m/s</div>
          <div>Gust: {currentWeather.weather.wind_gust || '0'} m/s</div>
          <div>Direction: {currentWeather.weather.wind_direction || '0'}°</div>
        </div>
      ),
      icon: Wind,
      description: "Wind conditions",
    },
    {
      title: "Pressure",
      value: `${currentWeather.weather.pressure || '0'} hPa`,
      icon: Gauge,
      description: "Atmospheric pressure",
    },
    {
      title: "Visibility",
      value: `${((parseInt(currentWeather.weather.visibility || '0')) / 1000).toFixed(1)} km`,
      icon: Eye,
      description: "Current visibility",
    },
    {
      title: "Location",
      value: (
        <div className="space-y-1">
          <div>Lat: {location.lat}°</div>
          <div>Lon: {location.lon}°</div>
          <div className="text-sm text-muted-foreground">{location.name}</div>
        </div>
      ),
      icon: MapPin,
      description: "Current location",
    },
    {
      title: "Sun",
      value: (
        <div className="space-y-1">
          <div>Sunrise: {formatTime(sun.sunrise)}</div>
          <div>Sunset: {formatTime(sun.sunset)}</div>
        </div>
      ),
      icon: Sunrise,
      description: "Sun times",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            {metric.icon && <metric.icon className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
