'use client';

import { useFormStatus } from 'react-dom';
import { registerAction, type AuthState } from '@/app/auth/actions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Rocket, Loader2 } from "lucide-react";
import { useEffect, useActionState, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';


const initialState: AuthState = {};

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || isSubmitting;
  return (
    <Button type="submit" disabled={disabled} className="w-full">
      {disabled ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isSubmitting ? 'Profiel valideren...' : 'Registreren...'}
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
  const hasAttemptedProfileCreation = useRef(false);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Registratie Mislukt',
        description: state.error,
      });
      setIsSubmitting(false);
      hasAttemptedProfileCreation.current = false;
    }

    if (state.success && state.user && !hasAttemptedProfileCreation.current) {
        hasAttemptedProfileCreation.current = true;
        setIsSubmitting(true);

        const createUserProfile = async () => {
            const user = state.user!;
            const userEmail = user.email;

            if (!userEmail) {
                toast({ variant: 'destructive', title: 'Registratie Mislukt', description: 'Gebruikers e-mail is niet beschikbaar.' });
                setIsSubmitting(false);
                // In een echte app zou je hier de aangemaakte auth user willen verwijderen.
                return;
            }

            try {
                // 1. Check for a valid invitation
                const invitationsRef = collection(db, 'invitations');
                const q = query(invitationsRef, where('email', '==', userEmail));
                const invitationSnapshot = await getDocs(q);

                if (invitationSnapshot.empty) {
                    toast({
                        variant: 'destructive',
                        title: 'Registratie niet toegestaan',
                        description: 'U moet zijn uitgenodigd door een beheerder om te kunnen registreren.',
                    });
                    setIsSubmitting(false);
                    return;
                }

                // 2. Use invitation data to create user profile and delete invitation
                const invitationDoc = invitationSnapshot.docs[0];
                const invitationData = invitationDoc.data();
                
                const batch = writeBatch(db);

                const userDocRef = doc(db, 'users', user.uid);
                batch.set(userDocRef, {
                    email: user.email,
                    displayName: invitationData.displayName,
                    role: invitationData.role, 
                    parentId: invitationData.parentId,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                });

                batch.delete(invitationDoc.ref);
                
                await batch.commit();

                toast({ title: "Succes!", description: "Profiel aangemaakt. U wordt doorgestuurd."});
                router.push('/dashboard');

            } catch(error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Profiel aanmaken mislukt',
                    description: error.message,
                });
                 hasAttemptedProfileCreation.current = false;
            } finally {
                setIsSubmitting(false);
            }
        };
        
        createUserProfile();
    }
  }, [state, router, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <Rocket className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-headline mt-4">Account aanmaken</CardTitle>
          <CardDescription>Vul je gegevens in om je uitnodiging te voltooien.</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
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
