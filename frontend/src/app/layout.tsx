import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'Sahayak',
  description: 'AI-Powered Educational Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Quantico:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased min-h-full", "bg-background text-foreground m-0 p-0")}>
        <ThemeProvider defaultTheme="dark" storageKey="sahayak-theme">
          <AuthProvider>
            <Navbar />
            <div className="page-gradient">
              {children}
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
