'use client';

import { useFormStatus } from 'react-dom';
import { forgotPasswordAction, type AuthState } from '@/app/auth/actions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Rocket, Loader2, Mail } from "lucide-react";
import { useEffect, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialState: AuthState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Verzenden...
        </>
      ) : (
        "Verstuur herstellink"
      )}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: state.error,
      });
    }
  }, [state.error, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <Rocket className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-headline mt-4">Wachtwoord vergeten?</CardTitle>
          <CardDescription>Voer je e-mailadres in om een herstellink te ontvangen.</CardDescription>
        </CardHeader>
        {state.success ? (
           <CardContent>
             <Alert>
                <Mail className="h-4 w-4" />
                <AlertTitle>Controleer je inbox</AlertTitle>
                <AlertDescription>
                 {state.success}
                </AlertDescription>
             </Alert>
           </CardContent>
        ) : (
          <form action={formAction}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@voorbeeld.nl" required />
              </div>
            </CardContent>
            <CardFooter>
              <SubmitButton />
            </CardFooter>
          </form>
        )}
         <CardFooter className="flex justify-center">
            <Link href="/login" className="text-sm underline text-secondary hover:text-secondary/80">
              Terug naar Inloggen
            </Link>
          </CardFooter>
      </Card>
    </div>
  );
}
