export interface Plant {
  id: string;
  name: string;
  optimalTemperatureMin: number;
  optimalTemperatureMax: number;
  optimalHumidityMin: number;
  optimalHumidityMax: number;
  optimalSoilMoistureMin: number;
  optimalSoilMoistureMax: number;
  optimalLightLevelMin: number;
  optimalLightLevelMax: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlantGarden {
  id: string;
  gardenId: string;
  plantId: string;
  plant?: Plant;
  plantedAt: string;
  status: string;
  notes?: string;
} 