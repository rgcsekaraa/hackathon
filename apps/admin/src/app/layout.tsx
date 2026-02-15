import type { Metadata, Viewport } from "next";
import "./globals.css";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AppThemeProvider } from "@/lib/theme-context";

export const metadata: Metadata = {
  title: "Sophiie Space | Admin Portal",
  description: "Super-Admin dashboard for Sophiie platform management.",
  openGraph: {
    title: "Sophiie Space",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1a2e",
};

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
      </body>
    </html>
  );
}
