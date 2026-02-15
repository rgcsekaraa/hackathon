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
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  themeColor: "#8AB4F8",
  openGraph: {
    title: "Sophiie Orbit",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sophiie Orbit",
  },
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
