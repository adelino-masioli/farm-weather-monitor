'use client';

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import useSWR, { mutate } from "swr"

interface Settings {
  farm_latitude: string;
  farm_longitude: string;
  extreme_weather_alerts: boolean;
  daily_report: boolean;
}

const defaultSettings: Settings = {
  farm_latitude: "-23.550520",
  farm_longitude: "-46.633308",
  extreme_weather_alerts: false,
  daily_report: false
};

const fetchSettings = async () => {
  const response = await fetch('http://localhost:8000/api/settings');
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json();
};

const validateCoordinates = (latitude: string, longitude: string): string | null => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    return "Latitude and longitude must be valid numbers";
  }

  if (lat < -90 || lat > 90) {
    return "Latitude must be between -90 and 90 degrees";
  }

  if (lon < -180 || lon > 180) {
    return "Longitude must be between -180 and 180 degrees";
  }

  return null;
};

export function SettingsForm() {
  const { toast } = useToast()
  const { data: existingSettings, error } = useSWR<Settings>('/api/settings', fetchSettings);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (existingSettings) {
      setSettings({
        farm_latitude: existingSettings.farm_latitude || defaultSettings.farm_latitude,
        farm_longitude: existingSettings.farm_longitude || defaultSettings.farm_longitude,
        extreme_weather_alerts: existingSettings.extreme_weather_alerts || false,
        daily_report: existingSettings.daily_report || false
      });
    }
  }, [existingSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate coordinates before submitting
    const error = validateCoordinates(settings.farm_latitude, settings.farm_longitude);
    if (error) {
      setValidationError(error);
      toast({
        title: "Invalid Coordinates",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setValidationError(null);

    try {
      const response = await fetch('http://localhost:8000/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      // Invalidate the settings cache to trigger a refresh
      await mutate('/api/settings');
      
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (error) {
    return <div>Error loading settings</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Farm Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farm_latitude">Farm Latitude</Label>
              <Input
                id="farm_latitude"
                type="number"
                step="any"
                placeholder="Enter latitude (e.g., -23.550520)"
                value={settings.farm_latitude}
                onChange={(e) => {
                  setSettings(prev => ({ ...prev, farm_latitude: e.target.value }));
                  setValidationError(null);
                }}
                className={validationError ? "border-destructive" : ""}
              />
              <p className="text-sm text-muted-foreground">
                Must be between -90 and 90 degrees
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="farm_longitude">Farm Longitude</Label>
              <Input
                id="farm_longitude"
                type="number"
                step="any"
                placeholder="Enter longitude (e.g., -46.633308)"
                value={settings.farm_longitude}
                onChange={(e) => {
                  setSettings(prev => ({ ...prev, farm_longitude: e.target.value }));
                  setValidationError(null);
                }}
                className={validationError ? "border-destructive" : ""}
              />
              <p className="text-sm text-muted-foreground">
                Must be between -180 and 180 degrees
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="extreme_weather_alerts">Extreme Weather Alerts</Label>
                <div className="text-sm text-muted-foreground">
                  Receive notifications about severe weather conditions
                </div>
              </div>
              <Switch
                id="extreme_weather_alerts"
                checked={settings.extreme_weather_alerts}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, extreme_weather_alerts: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="daily_report">Daily Weather Report</Label>
                <div className="text-sm text-muted-foreground">
                  Receive daily weather summaries and forecasts
                </div>
              </div>
              <Switch
                id="daily_report"
                checked={settings.daily_report}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, daily_report: checked }))}
              />
            </div>
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          <Button type="submit">Save Settings</Button>
        </form>
      </CardContent>
    </Card>
  )
}
