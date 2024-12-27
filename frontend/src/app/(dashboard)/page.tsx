'use client';

import { WeatherCard } from "@/components/weather-card"
import { WeatherHistory } from "@/components/weather-history"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <div className="grid gap-6">
        <WeatherCard />
        <WeatherHistory />
      </div>
    </div>
  )
}
