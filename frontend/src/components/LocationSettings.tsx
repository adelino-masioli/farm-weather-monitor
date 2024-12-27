'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Settings } from "../types/weather";

interface LocationSettingsProps {
  currentSettings: Settings;
  onSave: (settings: Settings) => Promise<void>;
}

export function LocationSettings({ currentSettings, onSave }: LocationSettingsProps) {
  const [settings, setSettings] = useState(currentSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(settings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="latitude" className="text-sm font-medium">
              Latitude
            </label>
            <Input
              id="latitude"
              type="text"
              value={settings.latitude}
              onChange={(e) => setSettings({ ...settings, latitude: e.target.value })}
              placeholder="Enter latitude"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="longitude" className="text-sm font-medium">
              Longitude
            </label>
            <Input
              id="longitude"
              type="text"
              value={settings.longitude}
              onChange={(e) => setSettings({ ...settings, longitude: e.target.value })}
              placeholder="Enter longitude"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Location"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}