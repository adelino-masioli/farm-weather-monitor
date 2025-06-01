'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
// Import the correct types from your centralized file
import { WeatherHistoryResponse, WeatherHistoryDocument } from "@/types/weather"; // Adjust the path if necessary
import useSWR from "swr";
import { useEffect, useState } from "react";

// It's no longer necessary to define WeatherRecord locally if WeatherHistoryDocument is used

export function WeatherHistory() {
  // Use the correct type for SWR and rename 'data' to something more descriptive
  const { data: historyResponse, error } = useSWR<WeatherHistoryResponse>('history', api.getWeatherHistory);
  const [mounted, setMounted] = useState(false);

  // console.log(historyResponse); // This will show the object { total: ..., documents: [...] }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Or a skeleton/loading component
  if (error) return <div>Error loading weather history. Please try again later.</div>;
  
  // Check if historyResponse and historyResponse.documents exist
  if (!historyResponse || !historyResponse.documents) {
    return <div>Loading weather history...</div>;
  }

  const formatDateTime = (timestamp: string | undefined) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      // Check if the date is valid after conversion
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString('pt-BR', { // Using 'pt-BR' as an example for Brazilian format
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Using 24-hour format as an example
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid Date';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather History</CardTitle>
        {historyResponse.total > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing {historyResponse.documents.length} of {historyResponse.total} records.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {historyResponse.documents.length === 0 ? (
          <p>No weather history records found.</p>
        ) : (
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
              {/* Map over historyResponse.documents and use the type WeatherHistoryDocument */}
              {historyResponse.documents.map((record: WeatherHistoryDocument) => (
                // Use the Appwrite $id as a key if available and unique
                <TableRow key={record.$id || record.timestamp}> 
                  <TableCell>{formatDateTime(record.$createdAt || record.timestamp)}</TableCell>
                  {/* Convert strings to numbers for display or calculations if necessary */}
                  <TableCell>{parseFloat(record.temperature).toFixed(1)}</TableCell>
                  <TableCell>{parseFloat(record.humidity).toFixed(0)}</TableCell>
                  <TableCell>{parseFloat(record.wind_speed).toFixed(1)}</TableCell>
                  <TableCell className="capitalize">{record.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
