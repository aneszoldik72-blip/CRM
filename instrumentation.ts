// Runs once per server worker on boot. Routes the Sentry init to the right
// runtime config (Node vs Edge) so we don't ship the Node SDK into edge
// bundles.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
