import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Capacitor mobile builds
  // Run with: NEXT_OUTPUT=export npm run build
  ...(process.env.NEXT_OUTPUT === "export" ? { output: "export" } : {}),

  // Server mode (needed for API routes)
  images: { unoptimized: true },

  // Externalize native/server packages for proper instrumentation
  serverExternalPackages: [
    "bcryptjs",
    "jsonwebtoken",
    "mcp-handler",
    "@modelcontextprotocol/sdk",
  ],

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' data: blob: https: http:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://192.168.1.10:81 http://192.168.1.10:80 http://192.168.* http://10.* http://esp32cam.local https://claude.ai https://nominatim.openstreetmap.org https://overpass-api.de",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
