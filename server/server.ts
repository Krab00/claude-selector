import type { Server as BunServer } from "bun";
import { Store, type Payload } from "./store";

function notify(title: string, message: string): void {
  if (process.platform === "darwin") {
    Bun.spawn(["osascript", "-e", `display notification "${message}" with title "${title}"`]);
  }
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin &&
    (origin.startsWith("chrome-extension://") ||
      origin.includes("localhost"));
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function json(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin),
  });
}

export class Server {
  private port: number;
  private store = new Store();
  private server: BunServer | null = null;
  private startTime = Date.now();

  constructor(port?: number) {
    const envPort = process.env.PORT ? Number(process.env.PORT) : undefined;
    this.port = port ?? envPort ?? 7890;
  }

  start(): void {
    this.startTime = Date.now();
    this.server = Bun.serve({
      port: this.port,
      fetch: async (req) => this.handleRequest(req),
    });
  }

  stop(): void {
    this.server?.stop();
    this.server = null;
  }

  getPort(): number {
    return this.port;
  }

  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("origin");

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/health" && req.method === "GET") {
      return json(
        {
          status: "ok",
          uptime: Math.floor((Date.now() - this.startTime) / 1000),
          stored: this.store.getAll().length,
        },
        200,
        origin,
      );
    }

    if (url.pathname === "/elements/latest" && req.method === "GET") {
      const latest = this.store.getLatest();
      if (!latest) {
        return json({ error: "No payloads stored" }, 404, origin);
      }
      return json(latest, 200, origin);
    }

    if (url.pathname === "/elements") {
      if (req.method === "POST") {
        const payload = (await req.json()) as Payload;
        const count = await this.store.add(payload);
        const n = payload.elements?.length ?? 0;
        notify("Claude Selector", `${n} element${n !== 1 ? "s" : ""} captured — ready in Claude Code`);
        return json({ ok: true, count }, 200, origin);
      }
      if (req.method === "GET") {
        return json(this.store.getAll(), 200, origin);
      }
      if (req.method === "DELETE") {
        await this.store.clear();
        return json({ ok: true }, 200, origin);
      }
    }

    return json({ error: "Not found" }, 404, origin);
  }
}
