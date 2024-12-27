'use client';

import { WeatherHistory } from "@/components/weather-history"

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Weather History</h1>
      </div>
      <WeatherHistory />
    </div>
  )
}
