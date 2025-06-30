'use client';

import { useEffect, useState, useMemo } from 'react';
import { getUsers } from '@/app/admin/actions';
import type { User, Role } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const roleVariantMap: Record<Role, string> = {
    user: 'bg-user-role hover:bg-user-role/80 text-white',
    admin: 'bg-admin-role hover:bg-admin-role/80 text-white',
    hoofdadmin: 'bg-hoofdadmin-role hover:bg-hoofdadmin-role/80 text-white',
    subsuperadmin: 'bg-subsuperadmin-role hover:bg-subsuperadmin-role/80 text-white',
    superadmin: 'bg-superadmin-role hover:bg-superadmin-role/80 text-white',
};


export default function AdminUsersPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        if (currentUser) {
            async function fetchUsers() {
                setLoading(true);
                const userList = await getUsers(currentUser);
                setUsers(userList);
                setLoading(false);
            }
            fetchUsers();
        }
    }, [currentUser]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    const pageLoading = loading || authLoading;

    return (
        <div className="p-4 md:p-6">
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View, search, and manage users within your scope.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                        <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="hoofdadmin">Hoofdadmin</SelectItem>
                                <SelectItem value="subsuperadmin">Sub Superadmin</SelectItem>
                                <SelectItem value="superadmin">Super Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {pageLoading ? (
                         <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                         </div>
                    ) : (
                        <div className="border rounded-lg overflow-x-auto">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Display Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Managed By</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.uid}>
                                            <TableCell className="font-medium">{user.displayName}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge className={roleVariantMap[user.role]}>{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>{user.parentDisplayName}</TableCell>
                                            <TableCell>
                                                {user.lastLogin ? formatDistanceToNow(user.lastLogin.toDate(), { addSuffix: true }) : 'Never'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                               <Button asChild variant="outline" size="sm">
                                                    <Link href={`/admin/users/${user.uid}`}>
                                                        View
                                                    </Link>
                                               </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    { !pageLoading && filteredUsers.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No users found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
