'use client';

import { useFormStatus } from 'react-dom';
import { registerAction, type AuthState } from '@/app/auth/actions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Rocket, Loader2 } from "lucide-react";
import { useEffect, useActionState, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


const initialState: AuthState = {};

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || isSubmitting;
  return (
    <Button type="submit" disabled={disabled} className="w-full">
      {disabled ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isSubmitting ? 'Profiel aanmaken...' : 'Registreren...'}
        </>
      ) : (
        "Registreren"
      )}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Registratie Mislukt',
        description: state.error,
      });
      setIsSubmitting(false);
    }

    if (state.success && state.user && state.displayName) {
        const createUserProfile = async () => {
            if (isSubmitting) return; // Prevent multiple submissions
            setIsSubmitting(true);
            try {
                await setDoc(doc(db, 'users', state.user!.uid), {
                    email: state.user!.email,
                    displayName: state.displayName,
                    role: 'user', 
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    parentId: null,
                });
                toast({ title: "Succes!", description: "Profiel aangemaakt. U wordt doorgestuurd."});
                router.push('/dashboard');
            } catch(error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Profiel aanmaken mislukt',
                    description: error.message,
                });
                setIsSubmitting(false);
            }
        };
        createUserProfile();
    }
  }, [state, router, toast, isSubmitting]);

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
              <Input id="displayName" name="displayName" type="text" placeholder="Sander" required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@voorbeeld.nl" required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input id="password" name="password" type="password" required disabled={isSubmitting} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <SubmitButton isSubmitting={isSubmitting} />
            <div className="text-center text-sm text-muted-foreground">
              Al een account?{" "}
              <Link href="/login" className="underline text-secondary hover:text-secondary/80">
                Inloggen
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
