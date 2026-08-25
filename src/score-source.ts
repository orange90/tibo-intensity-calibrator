import { MAX_SCORE, MIN_SCORE, STAGES, describeScore } from "./score-domain";

export interface RecentTweet {
  id: string;
  url: string;
  text: string;
  at: string;
  replies: number;
  reposts: number;
  likes: number;
}

export interface ScoreData {
  date: string;
  score: number;
  stage: string;
  signalStrength: number;
  signalKind: string;
  signalActive: boolean;
  postCount: number;
  eventCount: number;
  updatedAt: string;
  recentTweets?: RecentTweet[];
}

export type TimelineDayData = ScoreData;

export interface ScoreSource {
  fetchScore(): Promise<ScoreData>;
  fetchTimeline(): Promise<TimelineDayData[]>;
}

const DEFAULT_SCORE_URL = "https://raw.githubusercontent.com/orange90/tibo-intensity-calibrator/main/public/data/tibo-score.json";
const DEFAULT_TIMELINE_URL = "https://raw.githubusercontent.com/orange90/tibo-intensity-calibrator/main/public/data/tibo-timeline.json";

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isDate(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value); }
function isRatio(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1; }
function isCount(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }

function isRecentTweet(value: unknown): value is RecentTweet {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.url !== "string" || typeof value.text !== "string" || typeof value.at !== "string") return false;
  try {
    if (new URL(value.url).protocol !== "https:") return false;
  } catch {
    return false;
  }
  return isCount(value.replies) && isCount(value.reposts) && isCount(value.likes);
}

export function isScoreData(value: unknown): value is ScoreData {
  if (!isRecord(value) || !isDate(value.date) || typeof value.score !== "number" || !Number.isInteger(value.score) || value.score < MIN_SCORE || value.score > MAX_SCORE || typeof value.stage !== "string" || describeScore(value.score).stage !== value.stage) return false;
  return isRatio(value.signalStrength) && typeof value.signalKind === "string" && value.signalKind.length > 0 && typeof value.signalActive === "boolean" && isCount(value.postCount) && isCount(value.eventCount) && typeof value.updatedAt === "string" && STAGES.includes(value.stage as (typeof STAGES)[number]) && (value.recentTweets === undefined || (Array.isArray(value.recentTweets) && value.recentTweets.every(isRecentTweet)));
}

function scoreUrl(value: string | undefined, fallback: string): string {
  const candidate = value?.trim() || fallback;
  const url = new URL(candidate);
  if (url.protocol !== "https:") throw new Error("Score source must use HTTPS");
  return url.toString();
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Score source error: ${response.status}`);
  return await response.json();
}

export function createScoreSource(scoreUrlValue?: string, timelineUrlValue?: string): ScoreSource {
  const scoreUrlValueResolved = scoreUrl(scoreUrlValue, DEFAULT_SCORE_URL);
  const timelineUrlValueResolved = scoreUrl(timelineUrlValue, DEFAULT_TIMELINE_URL);
  return {
    async fetchScore() {
      const data = await getJson(scoreUrlValueResolved);
      if (!isScoreData(data)) throw new Error("Score JSON is not ready");
      return data;
    },
    async fetchTimeline() {
      const data = await getJson(timelineUrlValueResolved);
      if (!Array.isArray(data) || !data.every(isScoreData)) throw new Error("Timeline JSON is not ready");
      return data;
    },
  };
}
