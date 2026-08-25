import { describe, expect, it } from "vitest";
import { isScoreData } from "./score-source";

describe("repository score JSON", () => {
  it("accepts an Action-generated daily snapshot", () => {
    expect(isScoreData({
      date: "2026-08-24", score: 23, stage: "硬TIBO", sentimentScore: 0.5, resetScore: 1,
      postCount: 2, commentCount: 8, analyzedCommentCount: 8, updatedAt: "2026-08-25T00:10:00.000Z",
    })).toBe(true);
  });
});
