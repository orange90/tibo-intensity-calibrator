import { describe, expect, it } from "vitest";
import { describeScore } from "./score-domain";

describe("TIBO score stages", () => {
  it("maps the six anchor stages to their intended frames", () => {
    expect(describeScore(0).stage).toBe("牢TIBO");
    expect(describeScore(6).stage).toBe("小TIBO");
    expect(describeScore(12).stage).toBe("笑TIBO");
    expect(describeScore(18).stage).toBe("硬TIBO");
    expect(describeScore(24).stage).toBe("神TIBO");
    expect(describeScore(30).englishStage).toBe("SAINT TIBO");
  });
});
