import { NextRequest } from "next/server";
import http from "http";

/**
 * GET /api/esp32/stream?ip=192.168.1.x&port=81
 * 
 * Proxies the MJPEG stream from a local ESP32-CAM to the browser.
 * This avoids mixed-content (HTTPS→HTTP) blocks and CORS issues.
 * 
 * The ESP32-CAM serves MJPEG at http://<ip>:81/stream by default
 * (CameraWebServer Arduino example).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip");
  const port = searchParams.get("port") || "81";

  if (!ip) {
    return new Response(JSON.stringify({ error: "Missing 'ip' query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Basic validation — only allow private/local IPs
  const isLocalIp =
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.3") ||
    ip === "localhost" ||
    ip === "127.0.0.1";

  if (!isLocalIp) {
    return new Response(JSON.stringify({ error: "Only local network IPs are allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const streamUrl = `http://${ip}:${port}/stream`;

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
              "Access-Control-Allow-Origin": "*",
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
