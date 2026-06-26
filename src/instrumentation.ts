// Next.js instrumentation hook — loads Aikido Zen Firewall at server startup.
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Aikido Zen Firewall — runtime application security
    // Protects against SQL injection, XSS, SSRF, path traversal, and more.
    // Set AIKIDO_TOKEN env var to connect to Aikido dashboard.
    await import("@aikidosec/firewall");
  }
}
