"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";

const baseUrl =
  process.env.NEXT_PUBLIC_API_SETTINGS_URL || "http://localhost:3000";

// Settings field names
const FIELDS = {
  FARM_LATITUDE: "farm_latitude",
  FARM_LONGITUDE: "farm_longitude",
  EXTREME_WEATHER_ALERTS: "extreme_weather_alerts",
  DAILY_REPORT: "daily_report",
} as const;

interface Settings {
  [FIELDS.FARM_LATITUDE]: string | number;
  [FIELDS.FARM_LONGITUDE]: string | number;
  [FIELDS.EXTREME_WEATHER_ALERTS]: boolean;
  [FIELDS.DAILY_REPORT]: boolean;
}

const defaultSettings: Settings = {
  [FIELDS.FARM_LATITUDE]: "-23.550520",
  [FIELDS.FARM_LONGITUDE]: "-46.633308",
  [FIELDS.EXTREME_WEATHER_ALERTS]: false,
  [FIELDS.DAILY_REPORT]: false,
};

const fetchSettings = async () => {
  try {
    const url = `${baseUrl}/api/settings`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch settings");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
};

const normalizeNumber = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return "";
  const strValue = String(value);
  return strValue.replace(",", ".");
};

const validateCoordinates = (
  latitude: string | number | undefined | null,
  longitude: string | number | undefined | null
): string | null => {
  const trimmedLat = String(latitude || "").trim();
  const trimmedLon = String(longitude || "").trim();

  if (trimmedLat === "" || trimmedLon === "") {
    return "Latitude and longitude are required";
  }

  const normalizedLat = normalizeNumber(trimmedLat);
  const normalizedLon = normalizeNumber(trimmedLon);

  const lat = parseFloat(normalizedLat);
  const lon = parseFloat(normalizedLon);

  if (isNaN(lat) || isNaN(lon)) {
    return "Latitude and longitude must be valid numbers";
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return "Latitude and longitude must be finite numbers";
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
  const { toast } = useToast();
  const [validationError, setValidationError] = useState<string | null>(null);
  const { data: existingSettings, error } = useSWR<Settings>(
    "/api/settings",
    fetchSettings,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      fallbackData: defaultSettings,
    }
  );

  const [settings, setSettings] = useState<Settings>(
    existingSettings || defaultSettings
  );

  useEffect(() => {
    if (existingSettings) {
      setSettings({
        [FIELDS.FARM_LATITUDE]:
          existingSettings[FIELDS.FARM_LATITUDE] ||
          defaultSettings[FIELDS.FARM_LATITUDE],
        [FIELDS.FARM_LONGITUDE]:
          existingSettings[FIELDS.FARM_LONGITUDE] ||
          defaultSettings[FIELDS.FARM_LONGITUDE],
        [FIELDS.EXTREME_WEATHER_ALERTS]:
          existingSettings[FIELDS.EXTREME_WEATHER_ALERTS] ??
          defaultSettings[FIELDS.EXTREME_WEATHER_ALERTS],
        [FIELDS.DAILY_REPORT]:
          existingSettings[FIELDS.DAILY_REPORT] ??
          defaultSettings[FIELDS.DAILY_REPORT],
      });
    }
  }, [existingSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateCoordinates(
      settings[FIELDS.FARM_LATITUDE],
      settings[FIELDS.FARM_LONGITUDE]
    );

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
      const normalizedSettings = {
        ...settings,
        [FIELDS.FARM_LATITUDE]: parseFloat(
          normalizeNumber(settings[FIELDS.FARM_LATITUDE])
        ),
        [FIELDS.FARM_LONGITUDE]: parseFloat(
          normalizeNumber(settings[FIELDS.FARM_LONGITUDE])
        ),
      };

      const response = await fetch(`${baseUrl}/api/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedSettings),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API Error:", errorData);
        throw new Error(errorData?.message || "Failed to update settings");
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      await mutate("/api/settings");

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

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
              <Label htmlFor={FIELDS.FARM_LATITUDE}>Farm Latitude (41,15793 | -8,6293, 38.7169 | -9.1399, 41.1579 | -8.6291, 37.0194 | -7.9304)</Label>
              <Input
                id={FIELDS.FARM_LATITUDE}
                type="number"
                step="any"
                placeholder="Enter latitude (e.g., -23.550520)"
                value={settings[FIELDS.FARM_LATITUDE] || ""}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    [FIELDS.FARM_LATITUDE]: e.target.value || "",
                  }));
                  setValidationError(null);
                }}
                className={validationError ? "border-destructive" : ""}
              />
              <p className="text-sm text-muted-foreground">
                Must be between -90 and 90 degrees
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELDS.FARM_LONGITUDE}>Farm Longitude</Label>
              <Input
                id={FIELDS.FARM_LONGITUDE}
                type="number"
                step="any"
                placeholder="Enter longitude (e.g., -46.633308)"
                value={settings[FIELDS.FARM_LONGITUDE] || ""}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    [FIELDS.FARM_LONGITUDE]: e.target.value || "",
                  }));
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
                <Label htmlFor={FIELDS.EXTREME_WEATHER_ALERTS}>
                  Extreme Weather Alerts
                </Label>
                <div className="text-sm text-muted-foreground">
                  Receive notifications about severe weather conditions
                </div>
              </div>
              <Switch
                id={FIELDS.EXTREME_WEATHER_ALERTS}
                checked={settings[FIELDS.EXTREME_WEATHER_ALERTS]}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    [FIELDS.EXTREME_WEATHER_ALERTS]: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={FIELDS.DAILY_REPORT}>
                  Daily Weather Report
                </Label>
                <div className="text-sm text-muted-foreground">
                  Receive daily weather summaries and forecasts
                </div>
              </div>
              <Switch
                id={FIELDS.DAILY_REPORT}
                checked={settings[FIELDS.DAILY_REPORT]}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    [FIELDS.DAILY_REPORT]: checked,
                  }))
                }
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
  );
}
