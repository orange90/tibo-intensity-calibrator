import { MAX_SCORE, MIN_SCORE, STAGES, describeScore } from "./score-domain";

export interface ScoreData {
  date: string;
  score: number;
  stage: string;
  sentimentScore: number;
  resetScore: number;
  postCount: number;
  commentCount: number;
  analyzedCommentCount: number;
  updatedAt: string;
}

export type TimelineDayData = ScoreData;

export interface ApiClient {
  configured: boolean;
  fetchScore(): Promise<ScoreData>;
  fetchTimeline(from?: string): Promise<TimelineDayData[]>;
}

function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!/^https?:$/u.test(url.protocol) || url.username || url.password || url.search || url.hash || !/^\/+$/u.test(url.pathname)) return null;
    return url.origin;
  } catch { return null; }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isDate(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value); }
function isRatio(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1; }
function isCount(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }

function isScoreData(value: unknown): value is ScoreData {
  if (!isRecord(value) || !isDate(value.date) || typeof value.score !== "number" || !Number.isInteger(value.score) || value.score < MIN_SCORE || value.score > MAX_SCORE || typeof value.stage !== "string" || describeScore(value.score).stage !== value.stage) return false;
  return isRatio(value.sentimentScore) && isRatio(value.resetScore) && isCount(value.postCount) && isCount(value.commentCount) && isCount(value.analyzedCommentCount) && value.analyzedCommentCount <= value.commentCount && typeof value.updatedAt === "string" && STAGES.includes(value.stage as (typeof STAGES)[number]);
}

export function createApiClient(baseUrl: string | undefined): ApiClient {
  const base = normalizeBaseUrl(baseUrl);
  const unavailable = async (): Promise<never> => { throw new Error("TIBO API is not configured"); };
  if (!base) return { configured: false, fetchScore: unavailable, fetchTimeline: unavailable };
  const request = async (path: string): Promise<unknown> => {
    const response = await fetch(`${base}${path}`);
    if (!response.ok) throw new Error(`TIBO API error: ${response.status}`);
    return await response.json();
  };
  return {
    configured: true,
    async fetchScore() { const data = await request("/api/score"); if (!isScoreData(data)) throw new Error("Invalid score response"); return data; },
    async fetchTimeline(from) {
      const data = await request(`/api/timeline${from ? `?from=${encodeURIComponent(from)}` : ""}`);
      if (!Array.isArray(data) || !data.every(isScoreData)) throw new Error("Invalid timeline response");
      return data;
    },
  };
}
