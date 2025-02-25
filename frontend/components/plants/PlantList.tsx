import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { usePlants } from '@/hooks/usePlants';
import { Plant } from '@/types/plants';
import { PlantDialog } from './PlantDialog';

export function PlantList() {
  const { data: plants, isLoading, error } = usePlants();
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return <div>Loading plants...</div>;
  }

  if (error) {
    return <div>Error loading plants: {error.message}</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Temperature Range (°C)</TableHead>
              <TableHead>Humidity Range (%)</TableHead>
              <TableHead>Soil Moisture Range (%)</TableHead>
              <TableHead>Light Level Range</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plants?.map((plant) => (
              <TableRow key={plant.id}>
                <TableCell>{plant.name}</TableCell>
                <TableCell>
                  {plant.optimalTemperatureMin}° - {plant.optimalTemperatureMax}°
                </TableCell>
                <TableCell>
                  {plant.optimalHumidityMin}% - {plant.optimalHumidityMax}%
                </TableCell>
                <TableCell>
                  {plant.optimalSoilMoistureMin}% - {plant.optimalSoilMoistureMax}%
                </TableCell>
                <TableCell>
                  {plant.optimalLightLevelMin} - {plant.optimalLightLevelMax}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedPlant(plant);
                      setIsDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PlantDialog
        plant={selectedPlant}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
} 