'use client';

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getUser, updateUserRole } from '@/app/admin/actions';
import type { User, Role } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function RoleSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Role'}
    </Button>
  );
}

export default function UserDetailPage({ params }: { params: { userId: string } }) {
    const { userId } = params;
    const { user: adminUser, loading: adminLoading } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    async function fetchUser() {
        setLoading(true);
        const fetchedUser = await getUser(userId);
        setUser(fetchedUser);
        setLoading(false);
    }

    const [formState, formAction] = useActionState(async (prevState: any, formData: FormData) => {
        const role = formData.get('role') as Role;
        const result = await updateUserRole(userId, role);
        if (result.success) {
            toast({ title: "Success", description: "User role updated successfully." });
            fetchUser(); // Refetch user to display updated role
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        return result;
    }, { success: false });

    useEffect(() => {
        if (userId) {
            fetchUser();
        }
    }, [userId]);


    if (loading || adminLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!user) {
        return <div className="text-center p-8">User not found.</div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{user.displayName}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Role</Label>
                        <p><Badge>{user.role}</Badge></p>
                    </div>
                     <div>
                        <Label>Managed By</Label>
                        <p>{user.parentDisplayName}</p>
                    </div>
                     <div>
                        <Label>Last Login</Label>
                        <p>{user.lastLogin ? format(user.lastLogin.toDate(), 'PPP p') : 'Never'}</p>
                    </div>
                     <div>
                        <Label>Registered On</Label>
                        <p>{user.createdAt ? format(user.createdAt.toDate(), 'PPP p') : 'Unknown'}</p>
                    </div>
                </CardContent>
            </Card>

            {adminUser?.role === 'superadmin' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Role</CardTitle>
                        <CardDescription>Assign a new role to this user.</CardDescription>
                    </CardHeader>
                    <form action={formAction}>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select name="role" defaultValue={user.role}>
                                    <SelectTrigger className="w-[240px]">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="hoofdadmin">Hoofdadmin</SelectItem>
                                        <SelectItem value="subsuperadmin">Sub Superadmin</SelectItem>
                                        <SelectItem value="superadmin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <RoleSubmitButton />
                        </CardFooter>
                    </form>
                </Card>
            )}
        </div>
    );
}
