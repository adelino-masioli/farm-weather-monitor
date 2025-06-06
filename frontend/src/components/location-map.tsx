'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CurrentWeatherDataResponse } from "@/types/weather";
import useSWR from "swr";
import { api } from "@/lib/api";

// Leaflet components (loaded dinamicamente no client)
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

// Default fallback location (São Paulo)
const DEFAULT_LOCATION = {
  lat: -23.55052,
  lon: -46.633308,
  name: "São Paulo"
};

export function LocationMap() {
  const [mounted, setMounted] = useState(false);
  const [icon, setIcon] = useState<import('leaflet').Icon | null>(null);

  const { data: currentWeather, error } = useSWR<CurrentWeatherDataResponse>(
    'currentWeather',
    api.getCurrentWeather,
    { refreshInterval: 300000 } // 5 min
  );

  useEffect(() => {
    setMounted(true);

    // Import Leaflet and set icon only in client
    import('leaflet').then((L) => {
      // Fix icon bug in SSR
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/marker-icon-2x.png',
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
      });

      const leafletIcon = new L.Icon({
        iconUrl: '/marker-icon.png',
        iconRetinaUrl: '/marker-icon-2x.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      setIcon(leafletIcon);
    });
  }, []);

  // Display loading while still mounting or without data
  if (!mounted || !icon || !currentWeather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading location...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[calc(100vh-16rem)] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading map...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error loading location</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error instanceof Error ? error.message : 'Unknown error fetching weather data.'}</p>
        </CardContent>
      </Card>
    );
  }

  // Extrair localização do weather
  let location;
  try {
    if (currentWeather?.weather?.location) {
      location = JSON.parse(currentWeather.weather.location.replace(/'/g, '"'));
    } else {
      location = DEFAULT_LOCATION;
    }
  } catch (err) {
    console.error("Error parsing location:", err);
    location = DEFAULT_LOCATION;
  }

  const lat = parseFloat(location.lat ?? DEFAULT_LOCATION.lat);
  const lon = parseFloat(location.lon ?? DEFAULT_LOCATION.lon);
  const name = location.name || DEFAULT_LOCATION.name;

  if (isNaN(lat) || isNaN(lon)) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Invalid coordinates</CardTitle>
          <CardDescription>Unable to identify center of map.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location of the Weather Station</CardTitle>
        <CardDescription>
          {location === DEFAULT_LOCATION
            ? 'Localização padrão: São Paulo'
            : `Localização atual: ${name}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md overflow-hidden border">
          <style jsx global>{`
            .leaflet-container {
              height: calc(100vh - 16rem);
              width: 100%;
              border-radius: 0.5rem;
              z-index: 0;
            }
          `}</style>

          <MapContainer
            key={`${lat}-${lon}`} // Ensures re-rendering when coords change
            center={[lat, lon]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: "calc(100vh - 16rem)", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lon]} icon={icon}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{name}</h3>
                  <p className="text-sm">Latitude: {lat.toFixed(6)}°</p>
                  <p className="text-sm">Longitude: {lon.toFixed(6)}°</p>
                  {location === DEFAULT_LOCATION && (
                    <p className="text-xs text-muted-foreground mt-2">
                     Default location (no weather data)
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
