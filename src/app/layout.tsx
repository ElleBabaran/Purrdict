import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Purrdict — Research-Backed Cat Behavior Intelligence",
  description: "ESP32 smart collar that classifies cat behavior using methods from 17 peer-reviewed veterinary research papers.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#FF8FA3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--cream)]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
