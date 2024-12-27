'use client';

import { WeatherCard } from "@/components/weather-card"
import { DetailedMetrics } from "@/components/detailed-metrics"

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <div className="grid gap-6">
        <WeatherCard />
        <DetailedMetrics />
      </div>
    </div>
  )
}