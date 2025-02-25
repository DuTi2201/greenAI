import { Metadata } from 'next';
import { PlantList } from '@/components/plants/PlantList';
import { PlantActions } from '@/components/plants/PlantActions';

export const metadata: Metadata = {
  title: 'Plants Management',
  description: 'Manage your plants and their optimal growing conditions',
};

export default async function PlantsPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plants Management</h1>
          <p className="text-muted-foreground">
            Manage your plants and their optimal growing conditions
          </p>
        </div>
        <PlantActions />
      </div>
      <PlantList />
    </div>
  );
} 