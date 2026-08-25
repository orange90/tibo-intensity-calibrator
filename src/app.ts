import type { ScoreData, TimelineDayData } from "./score-source";
import { MAX_SCORE, MIN_SCORE, SCORE_COUNT, SCORES_PER_STAGE, STAGES, clampScore, describeScore, formatScore } from "./score-domain";

export interface AppController {
  readonly canvas: HTMLCanvasElement;
  readonly slider: HTMLInputElement;
  readonly score: number;
  onManualChange?: (score: number) => void;
  onRestoreAuto?: () => void;
  setScore(score: number): void;
  setLoading(loaded: number, total: number): void;
  setReady(): void;
  setError(message: string): void;
  setMode(mode: "auto" | "manual"): void;
  setSignalData(data: ScoreData): void;
  setDataUnavailable(message?: string): void;
  setTimelineEvents(days: TimelineDayData[]): void;
}

function ticks(): string {
  return Array.from({ length: SCORE_COUNT }, (_, index) => `<i class="tick" data-score="${index}" aria-hidden="true"></i>`).join("");
}

function stageMarkers(): string {
  return STAGES.map((stage, index) => `<li class="stage-marker" data-score="${index * SCORES_PER_STAGE}" style="--marker-index: ${index}">${stage}</li>`).join("");
}

export function mountApp(root: HTMLElement, onScoreChange: (score: number) => void): AppController {
  root.innerHTML = `
    <main class="experience" data-stage="2">
      <div class="center-content">
        <header class="masthead">
          <div>
            <p class="eyebrow">TIBO INTENSITY CALIBRATOR</p>
            <h1>滑动变阻器</h1>
          </div>
          <div class="level-meter" aria-live="polite"><span>TIBO RATING</span><output class="level-output">15</output></div>
        </header>
        <section class="portrait-zone" aria-labelledby="current-stage-label">
          <p class="stage-ghost" aria-hidden="true">笑TIBO</p>
          <div class="portrait-shell">
            <div class="imperial-halo" aria-hidden="true"></div>
            <canvas class="portrait-canvas" role="img" aria-label="当前形态：笑TIBO"></canvas>
            <div class="scan-grid" aria-hidden="true"></div>
            <span class="frame-corner frame-corner--tl" aria-hidden="true"></span><span class="frame-corner frame-corner--tr" aria-hidden="true"></span><span class="frame-corner frame-corner--bl" aria-hidden="true"></span><span class="frame-corner frame-corner--br" aria-hidden="true"></span>
            <div class="load-state" role="status">载入 31 帧 TIBO 信号…</div>
          </div>
          <div class="stage-readout"><span id="current-stage-label">当前状态</span><p class="stage-name" aria-live="polite">笑TIBO</p><span class="stage-index">TIBO: ONLINE · 阶段 03 / 06</span></div>
        </section>
        <section class="control-panel" aria-label="TIBO 评级控制">
          <div class="range-control">
            <p class="signal-status" role="status" aria-live="polite">等待每日 X 评论情绪快照…</p>
            <div class="range-wrap"><div class="tick-track">${ticks()}</div><input id="strength-slider" class="strength-slider" type="range" min="${MIN_SCORE}" max="${MAX_SCORE}" step="1" value="15" aria-label="TIBO 强度" disabled /></div>
            <ol class="stage-markers">${stageMarkers()}</ol>
          </div>
          <p class="drag-hint"><span aria-hidden="true">←</span> 拖动以本地预览 31 档状态；不会影响每日自动评级。 <span aria-hidden="true">→</span></p>
        </section>
        <section class="signal-panel" aria-label="自动评级详情">
          <div class="signal-panel-head"><span>YESTERDAY'S X SIGNAL</span><span class="mode-pill">AUTO</span></div>
          <dl class="signal-metrics"><div><dt>评论情绪</dt><dd class="metric-sentiment">--</dd></div><div><dt>重置信号</dt><dd class="metric-reset">--</dd></div><div><dt>分析评论</dt><dd class="metric-comments">--</dd></div><div><dt>数据日期</dt><dd class="metric-date">--</dd></div></dl>
          <button class="restore-auto" type="button" hidden>恢复实时追踪</button>
          <ol class="timeline-list" aria-label="近 30 日评级时间线"></ol>
        </section>
        <footer class="footer-note"><span>31 级连续进化</span><span>X 评论情绪 × Codex reset 信号</span></footer>
      </div>
    </main>`;

  const experience = root.querySelector<HTMLElement>(".experience")!;
  const canvas = root.querySelector<HTMLCanvasElement>(".portrait-canvas")!;
  const slider = root.querySelector<HTMLInputElement>("#strength-slider")!;
  const output = root.querySelector<HTMLOutputElement>(".level-output")!;
  const stageName = root.querySelector<HTMLElement>(".stage-name")!;
  const stageGhost = root.querySelector<HTMLElement>(".stage-ghost")!;
  const stageIndex = root.querySelector<HTMLElement>(".stage-index")!;
  const status = root.querySelector<HTMLElement>(".signal-status")!;
  const loadState = root.querySelector<HTMLElement>(".load-state")!;
  const modePill = root.querySelector<HTMLElement>(".mode-pill")!;
  const restore = root.querySelector<HTMLButtonElement>(".restore-auto")!;
  const timeline = root.querySelector<HTMLOListElement>(".timeline-list")!;
  const tickEls = Array.from(root.querySelectorAll<HTMLElement>(".tick"));
  const markerEls = Array.from(root.querySelectorAll<HTMLElement>(".stage-marker"));
  let currentScore = 15;

  const renderScore = (raw: number): void => {
    const description = describeScore(raw);
    currentScore = description.displayScore;
    slider.value = String(currentScore);
    experience.dataset.stage = String(description.stageIndex);
    experience.style.setProperty("--strength", String(description.trackProgress));
    experience.style.setProperty("--stage-progress", String(description.stageProgress));
    output.value = formatScore(currentScore);
    stageName.textContent = description.stage;
    stageGhost.textContent = description.stage;
    stageIndex.textContent = `${description.englishStage} · 阶段 ${String(description.stageIndex + 1).padStart(2, "0")} / 06`;
    canvas.setAttribute("aria-label", `当前形态：${description.stage}`);
    tickEls.forEach((tick) => tick.classList.toggle("is-active", Number(tick.dataset.score) <= currentScore));
    markerEls.forEach((marker, index) => marker.classList.toggle("is-active", index === description.stageIndex));
    onScoreChange(currentScore);
  };

  slider.addEventListener("input", () => controller.onManualChange?.(clampScore(Number(slider.value))));
  restore.addEventListener("click", () => controller.onRestoreAuto?.());

  const controller: AppController = {
    canvas,
    slider,
    get score() { return currentScore; },
    setScore: renderScore,
    setLoading(loaded, total) { loadState.textContent = `载入 TIBO 信号 ${loaded} / ${total}`; },
    setReady() { slider.disabled = false; loadState.classList.add("is-hidden"); },
    setError(message) { loadState.textContent = message; },
    setMode(mode) {
      modePill.textContent = mode === "manual" ? "LOCAL PREVIEW" : "AUTO";
      modePill.classList.toggle("is-manual", mode === "manual");
      restore.hidden = mode === "auto";
      if (mode === "manual") status.textContent = "本地预览中；自动评级未被修改。";
    },
    setSignalData(data) {
      root.querySelector<HTMLElement>(".metric-sentiment")!.textContent = `${Math.round(data.sentimentScore * 100)}%`;
      root.querySelector<HTMLElement>(".metric-reset")!.textContent = data.resetScore === 1 ? "确认" : "未确认";
      root.querySelector<HTMLElement>(".metric-comments")!.textContent = String(data.analyzedCommentCount);
      root.querySelector<HTMLElement>(".metric-date")!.textContent = data.date;
      status.textContent = `昨日 ${data.postCount} 条 Tibo 推文、${data.commentCount} 条评论已完成情绪分析。`;
    },
    setDataUnavailable(message = "自动评级暂不可用；仍可本地预览。") { status.textContent = message; },
    setTimelineEvents(days) {
      timeline.innerHTML = days.slice(-30).reverse().map((day) => `<li><time>${day.date.slice(5)}</time><span>${day.stage}</span><strong>${formatScore(day.score)}</strong></li>`).join("");
    },
  };
  renderScore(currentScore);
  return controller;
}
