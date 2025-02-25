import { render, screen, fireEvent } from '@testing-library/react';
import { PlantList } from '@/components/plants/PlantList';
import { usePlants } from '@/hooks/usePlants';

// Mock the hooks
jest.mock('@/hooks/usePlants');

describe('PlantList Component', () => {
  const mockPlants = [
    {
      id: '1',
      name: 'Test Plant 1',
      optimalTemperatureMin: 20,
      optimalTemperatureMax: 30,
      optimalHumidityMin: 40,
      optimalHumidityMax: 60,
      optimalSoilMoistureMin: 30,
      optimalSoilMoistureMax: 70,
      optimalLightLevelMin: 1000,
      optimalLightLevelMax: 10000,
      createdAt: '2024-02-24T00:00:00.000Z',
      updatedAt: '2024-02-24T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'Test Plant 2',
      optimalTemperatureMin: 15,
      optimalTemperatureMax: 25,
      optimalHumidityMin: 50,
      optimalHumidityMax: 70,
      optimalSoilMoistureMin: 40,
      optimalSoilMoistureMax: 80,
      optimalLightLevelMin: 800,
      optimalLightLevelMax: 8000,
      createdAt: '2024-02-24T00:00:00.000Z',
      updatedAt: '2024-02-24T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    (usePlants as jest.Mock).mockReturnValue({
      data: mockPlants,
      isLoading: false,
      error: null,
    });
  });

  it('renders loading state', () => {
    (usePlants as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<PlantList />);
    expect(screen.getByText('Loading plants...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to load plants';
    (usePlants as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error(errorMessage),
    });

    render(<PlantList />);
    expect(screen.getByText(`Error loading plants: ${errorMessage}`)).toBeInTheDocument();
  });

  it('renders plant list', () => {
    render(<PlantList />);

    // Check if plants are rendered
    expect(screen.getByText('Test Plant 1')).toBeInTheDocument();
    expect(screen.getByText('Test Plant 2')).toBeInTheDocument();

    // Check if temperature ranges are displayed
    expect(screen.getByText('20° - 30°')).toBeInTheDocument();
    expect(screen.getByText('15° - 25°')).toBeInTheDocument();

    // Check if edit buttons are present
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons).toHaveLength(2);
  });

  it('opens edit dialog when clicking edit button', () => {
    render(<PlantList />);

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Check if dialog is opened with correct plant data
    expect(screen.getByText('Edit Plant')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Plant 1')).toBeInTheDocument();
  });
}); 