import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { validateAccessToken, getBaseUrl } from "@/lib/oauth";
import { query, isDbAvailable } from "@/lib/db";

/**
 * PurrDict MCP Server
 *
 * Exposes cat data, health info, and scrapbook tools to Claude
 * via the Model Context Protocol. Protected by OAuth 2.0.
 */

const handler = createMcpHandler(
  (server) => {
    // Tool: List user's cats
    server.tool(
      "list_cats",
      "List all cats belonging to the authenticated user with their details.",
      {},
      async (_args, extra) => {
        if (!isDbAvailable()) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Database not available" }) }],
            isError: true,
          };
        }

        const userId = extra.authInfo?.extra?.userId as string | undefined;
        if (!userId) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Unauthorized" }) }],
            isError: true,
          };
        }

        const cats = await query(
          "SELECT id, name, emoji, breed, fur_color, age_months, esp32_connected FROM cats WHERE owner_id = $1 ORDER BY created_at LIMIT 50",
          [userId]
        );

        return {
          content: [{ type: "text" as const, text: JSON.stringify(cats, null, 2) }],
        };
      }
    );

    // Tool: Get cat health data
    server.tool(
      "get_cat_health",
      "Get recent behavior events and emotion assessments for a specific cat.",
      {
        cat_id: z.string().describe("The UUID of the cat"),
        limit: z.number().optional().describe("Number of recent records to return (default: 10)"),
      },
      async ({ cat_id, limit }, extra) => {
        if (!isDbAvailable()) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Database not available" }) }],
            isError: true,
          };
        }

        // IDOR fix: this tool previously trusted the caller-supplied
        // `cat_id` with no check that it belonged to the authenticated
        // user — any authenticated MCP client that knew (or guessed) any
        // cat's UUID could pull that cat's full behavior/emotion history.
        // Every cat-scoped MCP tool must verify ownership the same way
        // `list_cats` does, using the userId set by `withMcpAuth`.
        const userId = extra.authInfo?.extra?.userId as string | undefined;
        if (!userId) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Unauthorized" }) }],
            isError: true,
          };
        }
        const owns = await query("SELECT id FROM cats WHERE id = $1 AND owner_id = $2", [cat_id, userId]);
        if (owns.length === 0) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Cat not found for this account." }) }],
            isError: true,
          };
        }

        const recordLimit = limit || 10;

        const behaviors = await query(
          "SELECT behavior, confidence, emoji, description, recorded_at FROM behavior_events WHERE cat_id = $1 ORDER BY recorded_at DESC LIMIT $2",
          [cat_id, recordLimit]
        );

        const emotions = await query(
          "SELECT fear_score, anger_score, joy_score, contentment_score, interest_score, body_posture, tail_position, vocalization, recorded_at FROM emotion_assessments WHERE cat_id = $1 ORDER BY recorded_at DESC LIMIT $2",
          [cat_id, recordLimit]
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ behaviors, emotions }, null, 2),
            },
          ],
        };
      }
    );

    // Tool: Get GPS location history
    server.tool(
      "get_cat_location",
      "Get recent GPS location history for a specific cat.",
      {
        cat_id: z.string().describe("The UUID of the cat"),
        limit: z.number().optional().describe("Number of recent GPS points (default: 20)"),
      },
      async ({ cat_id, limit }, extra) => {
        if (!isDbAvailable()) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Database not available" }) }],
            isError: true,
          };
        }

        // IDOR fix — see get_cat_health above for details. Same pattern:
        // verify the requested cat belongs to the authenticated user
        // before returning any GPS history for it.
        const userId = extra.authInfo?.extra?.userId as string | undefined;
        if (!userId) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Unauthorized" }) }],
            isError: true,
          };
        }
        const owns = await query("SELECT id FROM cats WHERE id = $1 AND owner_id = $2", [cat_id, userId]);
        if (owns.length === 0) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Cat not found for this account." }) }],
            isError: true,
          };
        }

        const points = await query(
          "SELECT latitude, longitude, accuracy_m, speed_kmh, zone_label, recorded_at FROM gps_logs WHERE cat_id = $1 ORDER BY recorded_at DESC LIMIT $2",
          [cat_id, limit || 20]
        );

        return {
          content: [{ type: "text" as const, text: JSON.stringify(points, null, 2) }],
        };
      }
    );

    // Tool: Get scrapbook entries
    server.tool(
      "get_scrapbook",
      "Get scrapbook entries (photos, videos, notes) for a specific cat.",
      {
        cat_id: z.string().describe("The UUID of the cat"),
        limit: z.number().optional().describe("Number of entries to return (default: 10)"),
      },
      async ({ cat_id, limit }, extra) => {
        if (!isDbAvailable()) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Database not available" }) }],
            isError: true,
          };
        }

        // IDOR fix — see get_cat_health above for details. Same pattern:
        // verify the requested cat belongs to the authenticated user
        // before returning any scrapbook entries for it.
        const userId = extra.authInfo?.extra?.userId as string | undefined;
        if (!userId) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Unauthorized" }) }],
            isError: true,
          };
        }
        const owns = await query("SELECT id FROM cats WHERE id = $1 AND owner_id = $2", [cat_id, userId]);
        if (owns.length === 0) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Cat not found for this account." }) }],
            isError: true,
          };
        }

        const entries = await query(
          "SELECT id, type, title, body, emoji, tag, created_at FROM scrapbook_entries WHERE cat_id = $1 ORDER BY created_at DESC LIMIT $2",
          [cat_id, limit || 10]
        );

        return {
          content: [{ type: "text" as const, text: JSON.stringify(entries, null, 2) }],
        };
      }
    );

    // Tool: Get reminders
    server.tool(
      "get_reminders",
      "Get upcoming reminders for the user.",
      {
        include_done: z.boolean().optional().describe("Include completed reminders (default: false)"),
      },
      async ({ include_done }, extra) => {
        if (!isDbAvailable()) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Database not available" }) }],
            isError: true,
          };
        }

        const userId = extra.authInfo?.extra?.userId as string | undefined;
        if (!userId) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Unauthorized" }) }],
            isError: true,
          };
        }

        const reminders = await query(
          `SELECT id, text, done, priority, category, scheduled_time, recurring, cat_id
           FROM reminders
           WHERE owner_id = $1 ${include_done ? "" : "AND done = false"}
           ORDER BY scheduled_time ASC NULLS LAST LIMIT 50`,
          [userId]
        );

        return {
          content: [{ type: "text" as const, text: JSON.stringify(reminders, null, 2) }],
        };
      }
    );

    // Tool: Create a reminder
    server.tool(
      "create_reminder",
      "Create a new reminder.",
      {
        text: z.string().describe("Reminder text"),
        cat_id: z.string().optional().describe("UUID of the cat this reminder is for"),
        priority: z.enum(["high", "medium", "low"]).optional().describe("Priority level"),
        category: z.enum(["feeding", "health", "play", "grooming", "vet", "other"]).optional(),
        scheduled_time: z.string().optional().describe("ISO datetime for when to remind"),
      },
      async ({ text, cat_id, priority, category, scheduled_time }, extra) => {
        if (!isDbAvailable()) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Database not available" }) }],
            isError: true,
          };
        }

        // Cross-account write fix: `owner_id` used to come straight from
        // the tool call arguments — any authenticated MCP client could
        // create reminders attributed to an arbitrary user by simply
        // passing a different owner_id. The owner is now always the
        // authenticated caller, the same way every other tool here
        // resolves identity via `extra.authInfo.extra.userId`, and a
        // cat_id (if given) must belong to that same user.
        const userId = extra.authInfo?.extra?.userId as string | undefined;
        if (!userId) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Unauthorized" }) }],
            isError: true,
          };
        }

        if (cat_id) {
          const owns = await query("SELECT id FROM cats WHERE id = $1 AND owner_id = $2", [cat_id, userId]);
          if (owns.length === 0) {
            return {
              content: [{ type: "text" as const, text: JSON.stringify({ error: "Cat not found for this account." }) }],
              isError: true,
            };
          }
        }

        const result = await query(
          `INSERT INTO reminders (owner_id, cat_id, text, priority, category, scheduled_time)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, text, priority, category, scheduled_time`,
          [userId, cat_id || null, text, priority || "medium", category || "other", scheduled_time || null]
        );

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ created: result[0] }, null, 2) }],
        };
      }
    );
  },
  {
    serverInfo: {
      name: "purrdict",
      version: "1.0.0",
    },
  },
  {
    basePath: "/api/mcp",
    verboseLogs: true,
    redisUrl: process.env.REDIS_URL,
  }
);

// ── Wrap with OAuth auth ──

const authHandler = withMcpAuth(
  handler,
  async (_req, bearerToken) => {
    if (!bearerToken) return undefined;
    const result = await validateAccessToken(bearerToken);
    if (!result) return undefined;
    return {
      token: bearerToken,
      clientId: "purrdict-mcp",
      scopes: (result.scope || "read write").split(" "),
      extra: { userId: result.userId },
    };
  },
  {
    required: true,
    resourceUrl: getBaseUrl(),
    resourceMetadataPath: "/.well-known/oauth-protected-resource",
  }
);

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
