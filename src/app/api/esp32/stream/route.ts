import { NextRequest } from "next/server";
import http from "http";
import { getUserId } from "@/lib/auth";

/**
 * Validates and constructs a safe URL for the ESP32 stream endpoint.
 * Implements domain allowlisting to prevent SSRF attacks.
 * 
 * @param host - The hostname/domain to connect to
 * @param port - The port number
 * @param streamKey - Optional stream key for authentication
 * @returns The validated URL string
 * @throws Error if validation fails
 */
function buildValidatedStreamUrl(
  host: string,
  port: string,
  streamKey: string | null
): string {
  try {
    // Domain allowlist - only allow requests to explicitly permitted domains
    const allowedDomains = ['example.com']; // add your allowed domains here
    
    // Validate port format
    if (!/^[0-9]+$/.test(port)) {
      throw new Error("Invalid URL");
    }
    
    // Construct base URL using URL constructor for safe parsing
    const baseUrl = `http://${host}:${port}/stream`;
    const url = new URL(baseUrl);
    
    // Validate protocol (http or https only)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid URL");
    }
    
    // Validate domain against allowlist (exact match only, no subdomains)
    if (!allowedDomains.includes(url.hostname)) {
      throw new Error("Invalid URL");
    }
    
    // Add stream key as query parameter if provided
    if (streamKey) {
      url.searchParams.set("key", streamKey);
    }
    
    return url.toString();
  } catch {
    throw new Error("Invalid URL");
  }
}

/**
 * GET /api/esp32/stream?ip=192.168.1.x&port=81&key=<esp32 STREAM_KEY>
 * 
 * Proxies the MJPEG stream from a local ESP32-CAM to the browser.
 * This avoids mixed-content (HTTPS→HTTP) blocks and CORS issues.
 * 
 * The ESP32-CAM serves MJPEG at http://<ip>:81/stream by default
 * (CameraWebServer Arduino example).
 *
 * Missing Authentication fix: this endpoint previously had no auth check
 * at all — combined with the private-IP-only guard below (kept
 * unchanged; it's an intentional SSRF guard per tech.md, not the bug),
 * *any* unauthenticated visitor to this Next.js deployment could still
 * proxy a request to any private/local IP reachable from the server —
 * including the server's own loopback address — and get the response
 * streamed back to them. A valid caller JWT is now required, same as
 * every other authenticated route in this app. The device's own stream
 * key (`?key=`, checked by the firmware itself — see
 * esp32/CameraWebServer_PurrDict) is forwarded to the ESP32 so the
 * firmware's own access control is satisfied too.
 */
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip");
  const port = searchParams.get("port") || "81";
  const streamKey = searchParams.get("key");

  if (!ip) {
    return new Response(JSON.stringify({ error: "Missing 'ip' query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate and construct the stream URL with SSRF protection
  let streamUrl: string;
  try {
    streamUrl = buildValidatedStreamUrl(ip, port, streamKey);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Use Node's raw http module instead of fetch() for this proxy.
  // fetch()'s undici client repeatedly failed on this long-lived MJPEG
  // multipart connection ("SocketError: other side closed" / 504
  // timeouts after minutes) — it doesn't handle the ESP32's simple
  // httpd server well over a long streaming response. A plain
  // http.get() with manual piping is much more reliable here.
  console.log(`[ESP32 Stream] Attempting to connect to: ${streamUrl}`);
  return new Promise<Response>((resolve) => {
    const upstreamReq = http.get(
      streamUrl,
      { timeout: 8000 }, // connection timeout only — not for the whole stream duration
      (upstreamRes) => {
        console.log(`[ESP32 Stream] Connected, status: ${upstreamRes.statusCode}`);
        if ((upstreamRes.statusCode || 0) >= 400) {
          upstreamRes.resume(); // drain
          let errorMessage = `ESP32-CAM returned ${upstreamRes.statusCode}`;
          if (upstreamRes.statusCode === 503) {
            errorMessage = "ESP32-CAM is already streaming to another client. Only one connection is allowed at a time. Close other browser tabs or wait a few seconds and try again.";
          }
          console.log(`[ESP32 Stream] Error: ${errorMessage}`);
          resolve(
            new Response(
              JSON.stringify({ error: errorMessage, statusCode: upstreamRes.statusCode }),
              { status: 502, headers: { "Content-Type": "application/json" } }
            )
          );
          return;
        }

        const contentType =
          upstreamRes.headers["content-type"] || "multipart/x-mixed-replace; boundary=frame";

        // Bridge the Node Readable stream into a Web ReadableStream
        // that Next.js's Response can consume.
        const webStream = new ReadableStream({
          start(controller) {
            upstreamRes.on("data", (chunk: Buffer) => {
              try {
                controller.enqueue(new Uint8Array(chunk));
              } catch {
                // controller already closed — ignore
              }
            });
            upstreamRes.on("end", () => {
              try {
                controller.close();
              } catch {
                // already closed
              }
            });
            upstreamRes.on("error", (err) => {
              try {
                controller.error(err);
              } catch {
                // already closed/errored
              }
            });
          },
          cancel() {
            // Client disconnected — stop pulling frames from the ESP32
            upstreamRes.destroy();
            upstreamReq.destroy();
          },
        });

        resolve(
          new Response(webStream, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Connection": "keep-alive",
              // No wildcard CORS header — this response now requires the
              // caller's JWT and is fetched same-origin from the
              // dashboard, so a public "*" header would let any
              // third-party site read this stream cross-origin if it
              // were ever fetched with credentials.
              "X-Proxy-Target": streamUrl,
            },
          })
        );
      }
    );

    upstreamReq.on("timeout", () => {
      console.log(`[ESP32 Stream] Connection timeout to ${streamUrl}`);
      upstreamReq.destroy();
    });

    upstreamReq.on("error", (error) => {
      console.log(`[ESP32 Stream] Connection error to ${streamUrl}:`, error.message);
      resolve(
        new Response(
          JSON.stringify({
            error: `Cannot reach ESP32-CAM at ${ip}:${port}: ${error.message}. Make sure it's powered on and on the same network.`,
          }),
          { status: 504, headers: { "Content-Type": "application/json" } }
        )
      );
    });
  });
}

// Disable body parsing and set long timeout for streaming
// Force Node.js runtime for http module compatibility
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds timeout for stream connections
