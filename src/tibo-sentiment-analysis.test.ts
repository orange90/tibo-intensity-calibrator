import { describe, expect, it } from "vitest";
import { calculateIntensity } from "./sentiment-analysis";

describe("TIBO intensity formula", () => {
  it("weights comments and reset signal equally", () => {
    expect(calculateIntensity(0, 0)).toBe(0);
    expect(calculateIntensity(0.5, 0)).toBe(8);
    expect(calculateIntensity(0.5, 1)).toBe(23);
    expect(calculateIntensity(1, 1)).toBe(30);
  });
});
