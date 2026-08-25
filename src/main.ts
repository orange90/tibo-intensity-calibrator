import "./styles.css";

import { mountApp } from "./app";
import { createApiClient, type ScoreData } from "./api";
import { FrameRenderer } from "./frame-renderer";
import { clampScore } from "./score-domain";

const MANUAL_SCORE_KEY = "tibo-slider:manual-score:v1";
const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("找不到应用挂载节点");

const api = createApiClient(import.meta.env.VITE_API_BASE_URL);
let renderer: FrameRenderer | null = null;
let latestAutoScore: ScoreData | null = null;
let manualScore: number | null = readManualScore();
const controller = mountApp(root, (score) => renderer?.render(score));

function readManualScore(): number | null {
  const raw = localStorage.getItem(MANUAL_SCORE_KEY);
  if (raw === null || !/^\d+$/u.test(raw)) return null;
  const score = Number(raw);
  return Number.isInteger(score) && score >= 0 && score <= 30 ? score : null;
}

function renderCurrent(): void {
  controller.setScore(manualScore ?? latestAutoScore?.score ?? 15);
  controller.setMode(manualScore === null ? "auto" : "manual");
}

controller.onManualChange = (score) => {
  manualScore = Math.round(clampScore(score));
  localStorage.setItem(MANUAL_SCORE_KEY, String(manualScore));
  controller.setMode("manual");
  controller.setScore(manualScore);
};

controller.onRestoreAuto = () => {
  manualScore = null;
  localStorage.removeItem(MANUAL_SCORE_KEY);
  renderCurrent();
};

async function loadMedia(): Promise<void> {
  try {
    renderer = new FrameRenderer(controller.canvas, import.meta.env.BASE_URL);
    controller.setLoading(1, 31);
    await renderer.preload();
    controller.setReady();
    renderCurrent();
  } catch {
    controller.setError("TIBO 画面加载失败，请刷新重试");
  }
}

async function loadSignal(): Promise<void> {
  if (!api.configured) {
    controller.setDataUnavailable("未配置 VITE_API_BASE_URL；当前仅支持本地预览。");
    return;
  }
  try {
    const [score, timeline] = await Promise.all([api.fetchScore(), api.fetchTimeline()]);
    latestAutoScore = score;
    controller.setSignalData(score);
    controller.setTimelineEvents(timeline);
    if (manualScore === null) renderCurrent();
  } catch {
    controller.setDataUnavailable("每日 X 情绪快照尚未生成或暂时不可用；仍可本地预览。");
  }
}

void loadMedia();
void loadSignal();
window.addEventListener("resize", () => renderer?.redraw());
window.addEventListener("focus", () => void loadSignal());
