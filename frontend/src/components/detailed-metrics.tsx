'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import useSWR from "swr"
import { 
  Droplets,
  Gauge, 
  Thermometer, 
  Wind,
  Navigation,
  Eye,
  MapPin,
  Sunrise
} from "lucide-react"
import Image from "next/image"
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
  if (!currentWeather) return <div>Loading...</div>

  // Parse location string (comes as "{'lat': '41.1579', 'lon': '-8.6291', 'name': 'Porto Municipality'}")
  const location = JSON.parse(currentWeather.location.replace(/'/g, '"'))

  // Parse sun string (comes as "{'sunrise': '1735199920', 'sunset': '1735233098'}")
  const sun = JSON.parse(currentWeather.sun.replace(/'/g, '"'))

  const formatTime = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000) // Convert Unix timestamp to milliseconds
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const metrics = [
    {
      title: "Temperature",
      value: `${parseFloat(currentWeather.temperature).toFixed(1)}°C`,
      icon: Thermometer,
      description: "Current temperature",
    },
    {
      title: "Feels Like",
      value: `${parseFloat(currentWeather.feels_like).toFixed(1)}°C`,
      icon: Thermometer,
      description: "Perceived temperature",
    },
    {
      title: "Humidity",
      value: `${currentWeather.humidity}%`,
      icon: Droplets,
      description: "Relative humidity",
    },
    {
      title: "Wind",
      value: (
        <div className="space-y-1">
          <div>Speed: {currentWeather.wind_speed} m/s</div>
          <div>Gust: {currentWeather.wind_gust} m/s</div>
          <div>Direction: {currentWeather.wind_direction}°</div>
        </div>
      ),
      icon: Wind,
      description: "Wind conditions",
    },
    {
      title: "Pressure",
      value: `${currentWeather.pressure} hPa`,
      icon: Gauge,
      description: "Atmospheric pressure",
    },
    {
      title: "Visibility",
      value: `${(parseInt(currentWeather.visibility) / 1000).toFixed(1)} km`,
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
      description: "Weather station location",
    },
    {
      title: "Sun",
      value: (
        <div className="space-y-1">
          <div>Rise: {formatTime(sun.sunrise)}</div>
          <div>Set: {formatTime(sun.sunset)}</div>
        </div>
      ),
      icon: Sunrise,
      description: "Sunrise and sunset times",
    },
    {
      title: "Weather",
      value: (
        <div className="flex items-center gap-2">
          <Image 
            src={`https://openweathermap.org/img/wn/${currentWeather.icon}.png`}
            alt={currentWeather.description}
            width={40}
            height={40}
          />
          <span className="capitalize">{currentWeather.description}</span>
        </div>
      ),
      icon: null,
      description: "Current conditions",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            {metric.icon && <metric.icon className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metric.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
