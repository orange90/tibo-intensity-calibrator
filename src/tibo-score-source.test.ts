import { describe, expect, it } from "vitest";
import { isScoreData } from "./score-source";

describe("repository score JSON", () => {
  it("accepts an Action-generated daily snapshot", () => {
    expect(isScoreData({
      date: "2026-08-24", score: 30, stage: "金TIBO", signalStrength: 1, signalKind: "reset", signalActive: true,
      postCount: 22, eventCount: 51, updatedAt: "2026-08-25T00:10:00.000Z",
    })).toBe(true);
  });
});
