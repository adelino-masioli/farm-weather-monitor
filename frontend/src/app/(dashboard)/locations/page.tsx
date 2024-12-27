'use client';

import { LocationMap } from "@/components/location-map"

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Farm Locations</h1>
      </div>
      <LocationMap />
    </div>
  )
}
