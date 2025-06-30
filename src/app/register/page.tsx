'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { registerAction, type AuthState } from '@/app/auth/actions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Rocket, Loader2 } from "lucide-react";
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const initialState: AuthState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Registreren...
        </>
      ) : (
        "Registreren"
      )}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Registratie Mislukt',
        description: state.error,
      });
    }
  }, [state, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <Rocket className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-headline mt-4">Account aanmaken</CardTitle>
          <CardDescription>Vul je gegevens in om een account aan te maken</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="displayName">Weergavenaam</Label>
              <Input id="displayName" name="displayName" type="text" placeholder="Sander" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@voorbeeld.nl" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <SubmitButton />
            <div className="text-center text-sm text-muted-foreground">
              Al een account?{" "}
              <Link href="/login" className="underline text-primary hover:text-primary/80">
                Inloggen
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
