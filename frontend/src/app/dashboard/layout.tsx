"use client";
import React, { useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { useAuth } from '@/hooks/use-auth';
import { GoogleTranslate } from '@/components/google-translate';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=${pathname}`);
    }
  }, [user, router, pathname]);
  
  if (!user) {
    return (
        <div className="flex h-screen items-center justify-center dashboard-gradient">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <GoogleTranslate />
      <div className="flex min-h-screen dashboard-gradient">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
