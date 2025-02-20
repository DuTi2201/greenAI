export interface SensorData {
  temperature: number;
  humidity: number;
  soil_moisture: number;
  light_intensity: number;
  water_pump_state: boolean;
  nutrient_pump_state: boolean;
  timestamp?: Date;
}

export interface ControlCommand {
  pump1: boolean;  // water pump
  pump2: boolean;  // nutrient pump
  led: boolean;
  fan: boolean;
}

export interface SystemConfig {
  soil_moisture_threshold: number;
  nutrient_interval: number;    // milliseconds
  nutrient_duration: number;    // milliseconds
  water_pump_duration: number;  // milliseconds
} 