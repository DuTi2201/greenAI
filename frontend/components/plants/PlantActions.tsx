import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlantDialog } from './PlantDialog';

export function PlantActions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        Add New Plant
      </Button>

      <PlantDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
} 