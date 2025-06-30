'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useAuth } from '@/hooks/use-auth';
import { inviteUserAction, type InviteState } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Role } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialState: InviteState = {};

const roleDisplayMap: Record<Role, string> = {
    user: 'User',
    admin: 'Admin',
    hoofdadmin: 'Hoofdadmin',
    subsuperadmin: 'Sub Superadmin',
    superadmin: 'Super Admin',
};

// Defines which roles each role can create.
const assignableRolesMap: Record<Role, Role[]> = {
    superadmin: ['user', 'admin', 'hoofdadmin', 'subsuperadmin'], // Superadmin cannot create another superadmin
    subsuperadmin: ['user', 'admin', 'hoofdadmin'],
    hoofdadmin: ['user', 'admin'],
    admin: ['user'],
    user: [],
};


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending Invitation...
        </>
      ) : (
        'Send Invitation'
      )}
    </Button>
  );
}

export default function InviteUserPage() {
  const { user: adminUser } = useAuth();
  const [state, formAction] = useActionState(inviteUserAction, initialState);
  const { toast } = useToast();
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (adminUser) {
      setAvailableRoles(assignableRolesMap[adminUser.role] || []);
    }
  }, [adminUser]);
  
  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Invitation Failed',
        description: state.error,
      });
    }
  }, [state, toast]);

  if (!adminUser) {
    return null; // or a loader
  }
  
  if (state.success) {
     return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <Alert>
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>{state.success}</AlertDescription>
            </Alert>
        </div>
     )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <form action={formAction}>
        {/* Hidden input to pass admin's UID as parentId */}
        <input type="hidden" name="parentId" value={adminUser.uid} />

        <Card>
          <CardHeader>
            <CardTitle>Invite New User</CardTitle>
            <CardDescription>
              Enter the details of the user you want to invite. They will receive instructions to register and set their own password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" name="displayName" type="text" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="user@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Assign Role</Label>
              <Select name="role" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleDisplayMap[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
