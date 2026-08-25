import { describe, expect, it } from "vitest";
import { isScoreData } from "./score-source";

describe("repository score JSON", () => {
  it("accepts an Action-generated hourly snapshot with recent tweets", () => {
    expect(isScoreData({
      date: "2026-08-24", score: 30, stage: "圣TIBO", signalStrength: 1, signalKind: "reset", signalActive: true,
      postCount: 22, eventCount: 51, updatedAt: "2026-08-25T00:10:00.000Z",
      recentTweets: [{
        id: "2092058556707344708", url: "https://x.com/thsottiaux/status/2092058556707344708",
        text: "Tomorrow we will bring back the 5h limit.", at: "2026-08-25T01:16:43.000Z",
        replies: 3291, reposts: 610, likes: 11441,
      }],
    })).toBe(true);
  });

  it("keeps older timeline entries without tweets valid", () => {
    expect(isScoreData({
      date: "2026-08-23", score: 18, stage: "硬TIBO", signalStrength: 0.6, signalKind: "candidate", signalActive: false,
      postCount: 10, eventCount: 20, updatedAt: "2026-08-23T00:10:00.000Z",
    })).toBe(true);
  });
});
