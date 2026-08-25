export interface Env {
  TIBO_SCORE: KVNamespace;
  ALLOWED_ORIGINS: string;
  X_BEARER_TOKEN?: string;
  OPENAI_API_KEY?: string;
  OPENAI_SENTIMENT_MODEL?: string;
}

export function allowedOrigin(origin: string, env: Env): boolean {
  return Boolean(origin) && env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).includes(origin);
}

export function corsHeaders(origin: string, env: Env): HeadersInit {
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (allowedOrigin(origin, env)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function previousUtcDate(now = Date.now()): string {
  return new Date(now - 86_400_000).toISOString().slice(0, 10);
}
