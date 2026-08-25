import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const FEED_URL = process.env.TIBO_FEED_URL || "https://codex-reset.com/api/feed";
const root = process.cwd();
const scorePath = resolve(root, "public/data/tibo-score.json");
const timelinePath = resolve(root, "public/data/tibo-timeline.json");

function currentUtcDate(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

function stageForScore(score) {
  return ["牢TIBO", "小TIBO", "笑TIBO", "硬TIBO", "神TIBO", "圣TIBO"][Math.min(5, Math.floor(score / 6))];
}

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function isFeed(value) {
  return isRecord(value)
    && typeof value.fetched_at === "string"
    && typeof value.stale === "boolean"
    && Array.isArray(value.tweets)
    && Array.isArray(value.events);
}

function latestEvent(feed) {
  return [...feed.events]
    .filter((event) => isRecord(event) && typeof event.announced_at === "string")
    .sort((left, right) => right.announced_at.localeCompare(left.announced_at))[0];
}

function latestRelatedPost(feed) {
  return [...feed.tweets]
    .filter((post) => isRecord(post) && typeof post.at === "string" && post.tibo_lane === "reset_related")
    .sort((left, right) => right.at.localeCompare(left.at))[0];
}

function recentTweets(feed) {
  return [...feed.tweets]
    .filter((post) => isRecord(post)
      && typeof post.id === "string"
      && typeof post.url === "string"
      && typeof post.text === "string"
      && typeof post.at === "string")
    .sort((left, right) => right.at.localeCompare(left.at))
    .slice(0, 3)
    .map((post) => ({
      id: post.id,
      url: post.url,
      text: post.text,
      at: post.at,
      replies: Number.isSafeInteger(post.replies) ? post.replies : 0,
      reposts: Number.isSafeInteger(post.reposts) ? post.reposts : 0,
      likes: Number.isSafeInteger(post.likes) ? post.likes : 0,
    }));
}

function ageInHours(then, now) {
  const age = (Date.parse(now) - Date.parse(then)) / 3_600_000;
  return Number.isFinite(age) ? Math.max(0, age) : Number.POSITIVE_INFINITY;
}

function recentStrength(age, fresh, settling, fading, quiet) {
  if (age <= 24) return fresh;
  if (age <= 72) return settling;
  if (age <= 168) return fading;
  return quiet;
}

function signalDetails(feed) {
  const event = latestEvent(feed);
  const active = isRecord(feed.signal) && feed.signal.active === true;
  const eventType = event?.type;
  const eventAge = event ? ageInHours(event.announced_at, feed.fetched_at) : Number.POSITIVE_INFINITY;

  if (eventType === "reset") {
    return { signalStrength: active ? 1 : recentStrength(eventAge, 0.85, 0.7, 0.55, 0.35), signalKind: "reset", signalActive: active };
  }
  if (eventType === "credits") {
    return { signalStrength: active ? 0.85 : recentStrength(eventAge, 0.75, 0.65, 0.5, 0.35), signalKind: "banked", signalActive: active };
  }
  if (active) return { signalStrength: 0.65, signalKind: "candidate", signalActive: true };
  const post = latestRelatedPost(feed);
  if (post) return { signalStrength: recentStrength(ageInHours(post.at, feed.fetched_at), 0.45, 0.4, 0.3, 0.2), signalKind: "related", signalActive: false };
  return { signalStrength: 0.2, signalKind: "quiet", signalActive: false };
}

async function getFeed() {
  const url = new URL(FEED_URL);
  if (url.protocol !== "https:") throw new Error("TIBO_FEED_URL must use HTTPS");
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Tibo feed request failed: ${response.status}`);
  const feed = await response.json();
  if (!isFeed(feed)) throw new Error("Tibo feed response is not ready");
  if (feed.stale) throw new Error("Tibo feed is stale; refusing to publish an outdated score");
  return feed;
}

async function readTimeline() {
  try {
    const parsed = JSON.parse(await readFile(timelinePath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return [];
    throw error;
  }
}

async function main() {
  const feed = await getFeed();
  const date = process.env.TIBO_SCORE_DATE || currentUtcDate();
  const { signalStrength, signalKind, signalActive } = signalDetails(feed);
  const score = Math.round(30 * signalStrength);
  const snapshot = {
    date,
    score,
    stage: stageForScore(score),
    signalStrength,
    signalKind,
    signalActive,
    postCount: feed.tweets.length,
    eventCount: feed.events.length,
    updatedAt: feed.fetched_at,
    recentTweets: recentTweets(feed),
  };
  const timelineSnapshot = { ...snapshot };
  delete timelineSnapshot.recentTweets;
  const history = [...(await readTimeline()).filter((entry) => entry?.date !== date), timelineSnapshot]
    .sort((left, right) => left.date.localeCompare(right.date)).slice(-90);
  await mkdir(dirname(scorePath), { recursive: true });
  await Promise.all([
    writeFile(scorePath, `${JSON.stringify(snapshot, null, 2)}\n`),
    writeFile(timelinePath, `${JSON.stringify(history, null, 2)}\n`),
  ]);
  console.log(`Saved TIBO score ${score} from ${signalKind} signal (${feed.tweets.length} posts, ${feed.events.length} events).`);
}

await main();
