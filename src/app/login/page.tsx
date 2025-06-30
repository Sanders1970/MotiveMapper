'use client';

import { useState } from 'react';
import { firebaseConfig } from '@/lib/firebase'; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Rocket, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [configToShow, setConfigToShow] = useState('');

  const handleShowConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigToShow(JSON.stringify(firebaseConfig, null, 2));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <Rocket className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl font-headline mt-4">Diagnostische Modus</CardTitle>
          <CardDescription>Toon de Firebase-configuratie.</CardDescription>
        </CardHeader>
        <form onSubmit={handleShowConfig}>
          <CardContent className="space-y-4">
            {/* Input fields are kept for layout purposes but are not used for this action */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="m@voorbeeld.nl" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">
              Toon Firebase Configuratie
            </Button>
             <div className="text-center text-sm text-muted-foreground">
                <p>
                    <Link href="/forgot-password" className="underline text-secondary hover:text-secondary/80">
                        Wachtwoord vergeten?
                    </Link>
                </p>
            </div>
          </CardFooter>
        </form>
        
        {configToShow && (
          <CardContent>
            <CardTitle className="text-lg">Gelezen Configuratie:</CardTitle>
            <pre className="mt-2 text-xs bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
              <code>{configToShow}</code>
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
