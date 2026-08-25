export const MIN_SCORE = 0;
export const MAX_SCORE = 30;
export const DEFAULT_SCORE = 15;
export const SCORE_SPAN = MAX_SCORE - MIN_SCORE;
export const SCORE_COUNT = SCORE_SPAN + 1;
export const SCORES_PER_STAGE = 6;

export const STAGES = ["牢TIBO", "小TIBO", "笑TIBO", "硬TIBO", "神TIBO", "圣TIBO"] as const;
export const STAGE_ENGLISH = [
  "TIBO: CONTAINED",
  "TIBO: STANDBY",
  "TIBO: ONLINE",
  "TIBO: IN COMMAND",
  "TIBO: ASCENDANT",
  "SAINT TIBO",
] as const;

export type StageName = (typeof STAGES)[number];

export interface ScoreDescription {
  score: number;
  displayScore: number;
  frameIndex: number;
  stage: StageName;
  englishStage: (typeof STAGE_ENGLISH)[number];
  stageIndex: number;
  stageProgress: number;
  trackProgress: number;
}

export function clampScore(score: number): number {
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
}

export function describeScore(rawScore: number): ScoreDescription {
  const score = clampScore(rawScore);
  const displayScore = Math.round(score);
  const frameIndex = displayScore;
  const stageIndex = Math.min(STAGES.length - 1, Math.floor(frameIndex / SCORES_PER_STAGE));
  return {
    score,
    displayScore,
    frameIndex,
    stage: STAGES[stageIndex],
    englishStage: STAGE_ENGLISH[stageIndex],
    stageIndex,
    stageProgress: stageIndex === STAGES.length - 1 ? 0 : (frameIndex - stageIndex * SCORES_PER_STAGE) / SCORES_PER_STAGE,
    trackProgress: score / SCORE_SPAN,
  };
}

export function formatScore(score: number): string {
  return String(Math.round(clampScore(score))).padStart(2, "0");
}
