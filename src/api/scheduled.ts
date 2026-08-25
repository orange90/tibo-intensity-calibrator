import { analyzePreviousDay } from "../sentiment-analysis";
import { previousUtcDate, type Env } from "./shared";
import { recordSnapshot } from "./timeline";

export async function handleScheduled(env: Env, now = Date.now()): Promise<void> {
  const snapshot = await analyzePreviousDay(env, previousUtcDate(now), now);
  await recordSnapshot(env, snapshot);
}
