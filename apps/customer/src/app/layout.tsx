import type { Metadata, Viewport } from "next";
import "./globals.css";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AppThemeProvider } from "@/lib/theme-context";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Sophiie Orbit | Customer Portal",
  description: "Advanced AI orchestration for trades business workflow.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Sophiie Orbit",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sophiie Orbit",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#8AB4F8",
};

/**
 * Root layout wraps the entire app in theme and query providers.
 * Configured as a PWA with standalone display and iOS status bar support.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          <AppThemeProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </AppThemeProvider>
        </AuthProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
