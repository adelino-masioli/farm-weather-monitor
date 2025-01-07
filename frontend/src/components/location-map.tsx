'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WeatherData } from "@/types/weather";
import useSWR from "swr";
import { api } from "@/lib/api";

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Default location (São Paulo)
const DEFAULT_LOCATION = {
  lat: -23.550520,
  lon: -46.633308,
  name: "São Paulo"
};

export function LocationMap() {
  const [mounted, setMounted] = useState(false);
  const [icon, setIcon] = useState<any>(null);

  const { data: currentWeather, error } = useSWR<WeatherData>('currentWeather', api.getCurrentWeather, {
    refreshInterval: 300000 // refresh every 5 minutes
  });

  useEffect(() => {
    setMounted(true);
    // Import Leaflet and set up the icon
    import('leaflet').then((L) => {
      // Delete default markers
      delete (L as any).Icon.Default.prototype._getIconUrl;

      // Set up custom markers
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/marker-icon-2x.png',
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      setIcon(L.icon({
        iconUrl: '/marker-icon.png',
        iconRetinaUrl: '/marker-icon-2x.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      }));
    });
  }, []);

  if (!mounted || !icon) return null;

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Weather Station Location</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error instanceof Error ? error.message : 'Failed to load weather data'}</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentWeather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Location...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[calc(100vh-16rem)] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading map...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse location string and handle potential errors
  let location;
  try {
    if (currentWeather?.weather?.location) {
      location = JSON.parse(currentWeather.weather.location.replace(/'/g, '"'));
    } else {
      location = DEFAULT_LOCATION;
    }
  } catch (err) {
    console.error('Error parsing location:', err);
    location = DEFAULT_LOCATION;
  }

  // Validate location data
  if (!location || !location.lat || !location.lon) {
    location = DEFAULT_LOCATION;
  }

  // Convert string coordinates to numbers
  const coordinates = {
    lat: parseFloat(location.lat),
    lon: parseFloat(location.lon),
    name: location.name || DEFAULT_LOCATION.name
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Station Location</CardTitle>
        <CardDescription>
          {location === DEFAULT_LOCATION ? 
            'Using default location (São Paulo)' : 
            `Current location: ${coordinates.name}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md overflow-hidden border">
          <style jsx global>{`
            .leaflet-container {
              height: calc(100vh - 16rem);
              width: 100%;
              border-radius: 0.5rem;
            }
          `}</style>
          <MapContainer
            center={[coordinates.lat, coordinates.lon]}
            zoom={13}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={[coordinates.lat, coordinates.lon]}
              icon={icon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{coordinates.name}</h3>
                  <p className="text-sm">Latitude: {coordinates.lat.toFixed(6)}°</p>
                  <p className="text-sm">Longitude: {coordinates.lon.toFixed(6)}°</p>
                  {location === DEFAULT_LOCATION && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: This is a default location
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
