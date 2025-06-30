'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seedColorsAction, seedCategoriesAction } from './actions';
import type { SeedActionResult } from './actions';

function SeedButton({
  children,
  pendingText,
}: {
  children: React.ReactNode;
  pendingText: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export default function SeedPage() {
  const { toast } = useToast();

  const handleAction = (result: SeedActionResult) => {
     toast({
        title: result.success ? 'Success' : 'Action Aborted',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
  }

  const [, colorAction] = useActionState(async () => {
    const result = await seedColorsAction();
    handleAction(result);
    return result;
  }, undefined);

  const [, categoryAction] = useActionState(async () => {
    const result = await seedCategoriesAction();
    handleAction(result);
    return result;
  }, undefined);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            Use these actions to populate your Firestore database with the
            initial data for colors and categories. This should only be done
            once on a fresh database. The actions will abort if data already
            exists to prevent duplicates.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <form action={colorAction}>
            <SeedButton pendingText="Seeding Colors...">Seed Colors</SeedButton>
          </form>
          <form action={categoryAction}>
            <SeedButton pendingText="Seeding Categories...">
              Seed Categories
            </SeedButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importing Terms</CardTitle>
          <CardDescription>
            The dataset for 'terms' is too large (~2200 items) to be seeded from
            the app. It is recommended to use a batch import script using the
            Firebase Admin SDK for this task. You can convert your data (e.g.,
            from a CSV) into a JSON array and use a script to upload it in
            batches of up to 500 documents at a time.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
