import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { usePlantGrowthData } from '@/hooks/usePlantGrowth';

interface PlantGrowthChartProps {
  gardenId: string;
  plantId: string;
  startDate: Date;
  endDate: Date;
}

export function PlantGrowthChart({
  gardenId,
  plantId,
  startDate,
  endDate,
}: PlantGrowthChartProps) {
  const { data: growthData, isLoading } = usePlantGrowthData(gardenId, plantId, startDate, endDate);

  const chartData = useMemo(() => {
    if (!growthData) return [];
    return growthData.map((data) => ({
      ...data,
      time: format(new Date(data.recordedAt), 'HH:mm dd/MM'),
      temperature: Number(data.temperature),
      humidity: Number(data.humidity),
      soilMoisture: Number(data.soilMoisture),
      lightLevel: Number(data.lightLevel),
    }));
  }, [growthData]);

  if (isLoading) {
    return <div>Loading growth data...</div>;
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#ff7300"
            name="Temperature (°C)"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="humidity"
            stroke="#387908"
            name="Humidity (%)"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="soilMoisture"
            stroke="#2196f3"
            name="Soil Moisture (%)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="lightLevel"
            stroke="#ffeb3b"
            name="Light Level"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 