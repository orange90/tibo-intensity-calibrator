import { jsonResponse, type Env } from "./shared";
import { serializeSnapshot, type ScoreSnapshot } from "./score";

const HISTORY_KEY = "history";

export async function getTimeline(env: Env): Promise<ScoreSnapshot[]> {
  return (await env.TIBO_SCORE.get<ScoreSnapshot[]>(HISTORY_KEY, "json")) ?? [];
}

export async function recordSnapshot(env: Env, snapshot: ScoreSnapshot): Promise<void> {
  const history = await getTimeline(env);
  const next = [...history.filter((entry) => entry.date !== snapshot.date), snapshot]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-90);
  await env.TIBO_SCORE.put("latest", JSON.stringify(snapshot));
  await env.TIBO_SCORE.put(HISTORY_KEY, JSON.stringify(next));
}

export async function handleGetTimeline(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const snapshots = (await getTimeline(env)).filter((entry) => (!from || entry.date >= from) && (!to || entry.date <= to));
  return jsonResponse(snapshots.map(serializeSnapshot), { headers: { "Cache-Control": "public, max-age=3600" } });
}
