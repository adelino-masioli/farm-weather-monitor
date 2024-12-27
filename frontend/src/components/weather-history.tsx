'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import useSWR from "swr"
import { useEffect, useState } from "react"

interface WeatherRecord {
  temperature: number
  humidity: number
  wind_speed: number
  description: string
  timestamp: string
}

export function WeatherHistory() {
  const { data: history, error } = useSWR('history', api.getWeatherHistory)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  if (error) return <div>Error loading weather history</div>
  if (!history) return <div>Loading...</div>

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Temperature (°C)</TableHead>
              <TableHead>Humidity (%)</TableHead>
              <TableHead>Wind Speed (m/s)</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((record: WeatherRecord, index) => (
              <TableRow key={index}>
                <TableCell>{formatDateTime(record.timestamp)}</TableCell>
                <TableCell>{record.temperature}</TableCell>
                <TableCell>{record.humidity}</TableCell>
                <TableCell>{record.wind_speed}</TableCell>
                <TableCell className="capitalize">{record.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
