import { handleGetScore } from "./api/score";
import { handleScheduled } from "./api/scheduled";
import { allowedOrigin, corsHeaders, jsonResponse, type Env } from "./api/shared";
import { handleGetTimeline } from "./api/timeline";

function withCors(response: Response, origin: string, env: Env): Response {
  const headers = new Headers(response.headers);
  new Headers(corsHeaders(origin, env)).forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";
    if (!url.pathname.startsWith("/api/") || !allowedOrigin(origin, env)) return jsonResponse({ error: "not found" }, { status: 404 });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    try {
      if (url.pathname === "/api/score" && request.method === "GET") return withCors(await handleGetScore(env), origin, env);
      if (url.pathname === "/api/timeline" && request.method === "GET") return withCors(await handleGetTimeline(request, env), origin, env);
      return withCors(jsonResponse({ error: "not found" }, { status: 404 }), origin, env);
    } catch {
      return withCors(jsonResponse({ error: "analysis unavailable" }, { status: 503 }), origin, env);
    }
  },
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    await handleScheduled(env, controller.scheduledTime);
  },
};
