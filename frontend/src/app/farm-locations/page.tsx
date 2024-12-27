import { LocationMap } from "@/components/location-map"

export default function FarmLocationsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Farm Location</h1>
      <LocationMap />
    </div>
  )
}
