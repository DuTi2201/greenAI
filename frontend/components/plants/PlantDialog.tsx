import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePlant, useUpdatePlant } from '@/hooks/usePlants';

// Định nghĩa kiểu dữ liệu Plant trực tiếp trong file này thay vì import
interface Plant {
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
}

const plantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  optimalTemperatureMin: z.number().min(-50).max(100),
  optimalTemperatureMax: z.number().min(-50).max(100),
  optimalHumidityMin: z.number().min(0).max(100),
  optimalHumidityMax: z.number().min(0).max(100),
  optimalSoilMoistureMin: z.number().min(0).max(100),
  optimalSoilMoistureMax: z.number().min(0).max(100),
  optimalLightLevelMin: z.number().min(0),
  optimalLightLevelMax: z.number().min(0),
  description: z.string().optional(),
});

type PlantFormValues = z.infer<typeof plantSchema>;

interface PlantDialogProps {
  plant?: Plant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlantDialog({ plant, open, onOpenChange }: PlantDialogProps) {
  const form = useForm<PlantFormValues>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      name: '',
      optimalTemperatureMin: 20,
      optimalTemperatureMax: 30,
      optimalHumidityMin: 40,
      optimalHumidityMax: 60,
      optimalSoilMoistureMin: 30,
      optimalSoilMoistureMax: 70,
      optimalLightLevelMin: 1000,
      optimalLightLevelMax: 10000,
      description: '',
    },
  });

  const createPlant = useCreatePlant();
  const updatePlant = useUpdatePlant();

  useEffect(() => {
    if (plant) {
      form.reset(plant);
    }
  }, [plant, form]);

  const onSubmit = async (data: PlantFormValues) => {
    try {
      if (plant) {
        await updatePlant.mutateAsync({ id: plant.id, ...data });
      } else {
        await createPlant.mutateAsync(data);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.warn('Failed to save plant:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plant ? 'Edit Plant' : 'Add New Plant'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="optimalTemperatureMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="optimalTemperatureMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="optimalHumidityMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Humidity (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="optimalHumidityMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Humidity (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="optimalSoilMoistureMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Soil Moisture (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="optimalSoilMoistureMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Soil Moisture (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="optimalLightLevelMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Light Level</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="optimalLightLevelMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Light Level</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {plant ? 'Update' : 'Create'} Plant
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 