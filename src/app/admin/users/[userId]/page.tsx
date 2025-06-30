'use client';

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getUser, updateUserRole, isSubordinate } from '@/app/admin/actions';
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

const roleDisplayMap: Record<Role, string> = {
    user: 'User',
    admin: 'Admin',
    hoofdadmin: 'Hoofdadmin',
    subsuperadmin: 'Sub Superadmin',
    superadmin: 'Super Admin',
};

const assignableRolesMap: Record<Role, Role[]> = {
    superadmin: ['user', 'admin', 'hoofdadmin', 'subsuperadmin', 'superadmin'],
    subsuperadmin: ['user', 'admin', 'hoofdadmin'],
    hoofdadmin: ['user', 'admin'],
    admin: ['user'],
    user: [],
};

const roleHierarchy: Record<Role, number> = {
    user: 0,
    admin: 1,
    hoofdadmin: 2,
    subsuperadmin: 3,
    superadmin: 4,
};

export default function UserDetailPage({ params }: { params: { userId: string } }) {
    const { userId } = params;
    const { user: adminUser, loading: adminLoading } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [canManageRole, setCanManageRole] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

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

    useEffect(() => {
        if (adminUser) {
            setAvailableRoles(assignableRolesMap[adminUser.role] || []);
        }
    }, [adminUser]);

     useEffect(() => {
        async function checkManagementPermission() {
            if (!adminUser || !user || adminUser.uid === user.uid) {
                setCanManageRole(false);
                return;
            };

            if (adminUser.role === 'superadmin') {
                setCanManageRole(true);
                return;
            }
            
            // Prevent managing users at the same or higher level in the hierarchy
            if (roleHierarchy[adminUser.role] <= roleHierarchy[user.role]) {
                setCanManageRole(false);
                return;
            }

            const subordinate = await isSubordinate(adminUser.uid, user.uid);
            setCanManageRole(subordinate);
        }
        checkManagementPermission();
    }, [adminUser, user]);


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

            {canManageRole && (
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
                                        {availableRoles.map(role => (
                                            <SelectItem key={role} value={role}>
                                                {roleDisplayMap[role]}
                                            </SelectItem>
                                        ))}
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
