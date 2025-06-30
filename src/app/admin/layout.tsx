'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React from 'react';

const adminRoles = ['admin', 'hoofdadmin', 'subsuperadmin', 'superadmin'];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !adminRoles.includes(user.role)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
