'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

const locations = [
  {
    id: 1,
    name: "Main Farm",
    latitude: 41.1579,
    longitude: -8.6291,
    description: "Primary farming location",
  },
  // Add more locations as needed
]

export function LocationsList() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {locations.map((location) => (
        <Card key={location.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{location.name}</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              {location.description}
            </p>
            <div className="text-sm">
              <div>Latitude: {location.latitude}</div>
              <div>Longitude: {location.longitude}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
