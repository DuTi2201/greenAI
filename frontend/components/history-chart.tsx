"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { time: "00:00", temperature: 22, soilMoisture: 60, lightIntensity: 0, airHumidity: 55 },
  { time: "04:00", temperature: 20, soilMoisture: 62, lightIntensity: 0, airHumidity: 58 },
  { time: "08:00", temperature: 23, soilMoisture: 58, lightIntensity: 500, airHumidity: 52 },
  { time: "12:00", temperature: 28, soilMoisture: 55, lightIntensity: 1200, airHumidity: 45 },
  { time: "16:00", temperature: 30, soilMoisture: 50, lightIntensity: 800, airHumidity: 40 },
  { time: "20:00", temperature: 25, soilMoisture: 56, lightIntensity: 100, airHumidity: 50 },
]

export default function HistoryChart() {
  const [timeRange, setTimeRange] = useState("day")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-normal">Sensor History</CardTitle>
        <ToggleGroup type="single" value={timeRange} onValueChange={(value) => value && setTimeRange(value)}>
          <ToggleGroupItem value="day" aria-label="Toggle day view">
            Day
          </ToggleGroupItem>
          <ToggleGroupItem value="week" aria-label="Toggle week view">
            Week
          </ToggleGroupItem>
          <ToggleGroupItem value="month" aria-label="Toggle month view">
            Month
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" name="Temperature (°C)" />
              <Line yAxisId="left" type="monotone" dataKey="soilMoisture" stroke="#3b82f6" name="Soil Moisture (%)" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="lightIntensity"
                stroke="#eab308"
                name="Light Intensity (Lux)"
              />
              <Line yAxisId="left" type="monotone" dataKey="airHumidity" stroke="#8b5cf6" name="Air Humidity (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

