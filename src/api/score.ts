import { describeScore } from "../score-domain";
import { jsonResponse, type Env } from "./shared";

export interface ScoreSnapshot {
  date: string;
  score: number;
  sentimentScore: number;
  resetScore: number;
  postCount: number;
  commentCount: number;
  analyzedCommentCount: number;
  updatedAt: string;
}

export function serializeSnapshot(snapshot: ScoreSnapshot) {
  return { ...snapshot, stage: describeScore(snapshot.score).stage };
}

export async function getLatestSnapshot(env: Env): Promise<ScoreSnapshot | null> {
  return await env.TIBO_SCORE.get<ScoreSnapshot>("latest", "json");
}

export async function handleGetScore(env: Env): Promise<Response> {
  const snapshot = await getLatestSnapshot(env);
  if (!snapshot) return jsonResponse({ error: "score unavailable" }, { status: 503 });
  return jsonResponse(serializeSnapshot(snapshot), { headers: { "Cache-Control": "public, max-age=300" } });
}
