import type { ScoreData, TimelineDayData } from "./score-source";
import { MAX_SCORE, MIN_SCORE, clampScore, describeScore, formatScore } from "./score-domain";

export interface AppController {
  readonly canvas: HTMLCanvasElement;
  readonly slider: HTMLInputElement;
  readonly score: number;
  readonly language: Language;
  onManualChange?: (score: number) => void;
  onRestoreAuto?: () => void;
  onLanguageChange?: (language: Language) => void;
  setScore(score: number): void;
  setLanguage(language: Language): void;
  setLoading(loaded: number, total: number): void;
  setReady(): void;
  setError(message: string): void;
  setMode(mode: "auto" | "manual"): void;
  setSignalData(data: ScoreData): void;
  setDataUnavailable(message?: string): void;
  setTimelineEvents(days: TimelineDayData[]): void;
}

export type Language = "zh" | "en";

const copy = {
  zh: {
    title: "Tibo 滑动变祖器",
    sourceCode: "GitHub 源码",
    languageButton: "EN",
    languageLabel: "切换至英文",
    currentState: "当前状态",
    stage: "阶段",
    sliderLabel: "TIBO 强度",
    controlLabel: "TIBO 评级控制",
    signalLoading: "正在读取 Tibo 社区信号…",
    dragHint: "拖动以本地预览 31 档状态；不会影响每小时自动评级。",
    signalDetails: "自动评级详情",
    resetProbability: "RESET 概率",
    signalKind: "当前信号",
    relatedPosts: "相关动态",
    dataTime: "数据时间",
    autoAdjust: "自动变祖",
    autoLevel: "自动档位",
    latestTweets: "Tibo 最近动态",
    noTweets: "暂时没有可显示的 Tibo 动态。",
    openTweet: "在 X 查看",
    timeline: "近 30 日评级时间线",
    footerEvolution: "31 级连续进化",
    footerSignal: "社区 Tibo 信号 × 最近 reset 事件",
    manualStatus: "本地预览中；自动评级未被修改。",
    unavailableStatus: "Tibo 社区信号暂不可用；仍可本地预览。",
    loadSignal: (loaded: number, total: number) => `正在准备本地画面（${loaded} / ${total}）`,
    loadError: "TIBO 画面加载失败，请刷新重试",
    portraitLabel: (stage: string) => `当前形态：${stage}`,
    signalStatus: (posts: number, events: number, active: boolean) => `社区源返回 ${posts} 条相关动态、${events} 条事件；${active ? "活跃信号已检测到。" : "当前没有活跃信号。"}`,
    signalKinds: { reset: "重置", banked: "储备重置", candidate: "候选", related: "相关动态", calm: "平静" },
  },
  en: {
    title: "Sliding Intensity Calibrator",
    sourceCode: "Source on GitHub",
    languageButton: "中文",
    languageLabel: "Switch to Chinese",
    currentState: "Current state",
    stage: "Stage",
    sliderLabel: "TIBO intensity",
    controlLabel: "TIBO rating controls",
    signalLoading: "Reading Tibo community signals…",
    dragHint: "Drag to preview 31 local states. The hourly automatic rating stays unchanged.",
    signalDetails: "Automatic rating details",
    resetProbability: "RESET probability",
    signalKind: "Current signal",
    relatedPosts: "Related activity",
    dataTime: "Data timestamp",
    autoAdjust: "Auto calibrate",
    autoLevel: "Automatic level",
    latestTweets: "Latest from Tibo",
    noTweets: "No recent Tibo posts are available.",
    openTweet: "View on X",
    timeline: "TIBO rating timeline for the last 30 days",
    footerEvolution: "31 levels of continuous evolution",
    footerSignal: "Community Tibo signal × latest reset event",
    manualStatus: "Local preview only; the automatic rating has not changed.",
    unavailableStatus: "Tibo community signals are unavailable; local preview is still available.",
    loadSignal: (loaded: number, total: number) => `Preparing local visuals (${loaded} / ${total})`,
    loadError: "TIBO visuals failed to load. Please refresh and try again.",
    portraitLabel: (stage: string) => `Current form: ${stage}`,
    signalStatus: (posts: number, events: number, active: boolean) => `Community source returned ${posts} related updates and ${events} events; ${active ? "an active signal was detected." : "no active signal right now."}`,
    signalKinds: { reset: "Reset", banked: "Stored reset", candidate: "Candidate", related: "Related activity", calm: "Calm" },
  },
} as const;

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => HTML_ESCAPES[character]);
}

function compactCount(value: number, language: Language): string {
  return new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function mountApp(root: HTMLElement, onScoreChange: (score: number) => void, initialLanguage: Language = "zh"): AppController {
  root.innerHTML = `
    <main class="experience" data-stage="2">
      <div class="center-content">
        <header class="masthead">
          <div>
            <p class="eyebrow">TIBO INTENSITY CALIBRATOR</p>
            <h1 class="page-title">Tibo 滑动变祖器</h1>
          </div>
          <div class="masthead-actions"><a class="source-link" href="https://github.com/orange90/tibo-intensity-calibrator" target="_blank" rel="noopener noreferrer">GitHub 源码 <span aria-hidden="true">↗</span></a><button class="language-toggle" type="button" aria-label="切换至英文" data-language="zh"><span class="language-option language-option--zh">中文</span><span class="language-divider" aria-hidden="true">/</span><span class="language-option language-option--en">EN</span></button><div class="level-meter" aria-live="polite"><span>TIBO RATING</span><output class="level-output">15</output></div></div>
        </header>
        <section class="portrait-zone" aria-labelledby="current-stage-label">
          <p class="stage-ghost" aria-hidden="true">笑TIBO</p>
          <div class="portrait-shell">
            <div class="imperial-halo" aria-hidden="true"></div>
            <div class="portrait-crop"><canvas class="portrait-canvas" role="img" aria-label="当前形态：笑TIBO"></canvas><div class="scan-grid" aria-hidden="true"></div></div>
          </div>
          <div class="stage-readout"><span id="current-stage-label" class="current-state-label">当前状态</span><p class="stage-name" aria-live="polite">笑TIBO</p><span class="stage-index">TIBO: ONLINE · 阶段 03 / 06</span></div>
          <p class="load-state" role="status">正在准备本地画面…</p>
        </section>
        <section class="control-panel" aria-label="TIBO 评级控制">
          <div class="resistor-control">
            <div class="resistor-stage">
              <img class="resistor-base" src="${import.meta.env.BASE_URL}slider/tibo-resistor-base.svg" alt="" aria-hidden="true" draggable="false" />
              <img class="resistor-thumb" src="${import.meta.env.BASE_URL}frames/frame-15.jpg" alt="" aria-hidden="true" draggable="false" />
              <input id="strength-slider" class="strength-slider" type="range" min="${MIN_SCORE}" max="${MAX_SCORE}" step="1" value="15" aria-label="TIBO 强度" disabled />
            </div>
          </div>
          <p class="drag-hint"><span aria-hidden="true">←</span><span class="drag-hint-copy">拖动以本地预览 31 档状态；不会影响每日自动评级。</span><span aria-hidden="true">→</span></p>
        </section>
        <footer class="footer-note"><span class="footer-evolution">31 级连续进化</span><span class="footer-signal">社区 Tibo 信号 × 最近 reset 事件</span></footer>
      </div>
      <aside class="signal-panel" aria-label="自动评级详情">
        <div class="signal-panel-head"><span>COMMUNITY TIBO SIGNAL</span><span class="mode-pill">AUTO</span></div>
        <div class="probability-block">
          <span class="metric-strength-label">RESET 概率</span>
          <output class="metric-strength" aria-live="polite">--</output>
          <span class="auto-level"><span class="auto-level-label">自动档位</span> <strong class="auto-level-value">--</strong> / 30</span>
        </div>
        <dl class="signal-metrics"><div><dt class="metric-kind-label">当前信号</dt><dd class="metric-kind">--</dd></div><div><dt class="metric-posts-label">相关动态</dt><dd class="metric-posts">--</dd></div><div><dt class="metric-date-label">数据时间</dt><dd class="metric-date">--</dd></div></dl>
        <div class="tweets-section"><p class="tweets-heading">Tibo 最近动态</p><ol class="tweet-list"><li class="tweet-empty">正在读取 Tibo 社区信号…</li></ol></div>
        <p class="signal-status" role="status" aria-live="polite">正在读取 Tibo 社区信号…</p>
        <button class="restore-auto" type="button" disabled>自动变祖</button>
        <ol class="timeline-list" aria-label="近 30 日评级时间线" hidden></ol>
      </aside>
    </main>`;

  const experience = root.querySelector<HTMLElement>(".experience")!;
  const canvas = root.querySelector<HTMLCanvasElement>(".portrait-canvas")!;
  const slider = root.querySelector<HTMLInputElement>("#strength-slider")!;
  const output = root.querySelector<HTMLOutputElement>(".level-output")!;
  const stageName = root.querySelector<HTMLElement>(".stage-name")!;
  const stageGhost = root.querySelector<HTMLElement>(".stage-ghost")!;
  const stageIndex = root.querySelector<HTMLElement>(".stage-index")!;
  const resistorThumb = root.querySelector<HTMLImageElement>(".resistor-thumb")!;
  const status = root.querySelector<HTMLElement>(".signal-status")!;
  const loadState = root.querySelector<HTMLElement>(".load-state")!;
  const modePill = root.querySelector<HTMLElement>(".mode-pill")!;
  const signalPanel = root.querySelector<HTMLElement>(".signal-panel")!;
  const restore = root.querySelector<HTMLButtonElement>(".restore-auto")!;
  const timeline = root.querySelector<HTMLOListElement>(".timeline-list")!;
  const tweetList = root.querySelector<HTMLOListElement>(".tweet-list")!;
  const languageToggle = root.querySelector<HTMLButtonElement>(".language-toggle")!;
  let currentScore = 15;
  let language = initialLanguage;
  let mode: "auto" | "manual" = "auto";
  let signalData: ScoreData | null = null;
  let dataUnavailable = false;
  let timelineDays: TimelineDayData[] = [];
  let loading: { loaded: number; total: number } | null = null;
  let mediaError = false;

  const text = () => copy[language];

  const renderSignal = (): void => {
    if (signalData) {
      signalPanel.style.setProperty("--probability", String(signalData.signalStrength));
      root.querySelector<HTMLElement>(".metric-strength")!.textContent = `${Math.round(signalData.signalStrength * 100)}%`;
      root.querySelector<HTMLElement>(".auto-level-value")!.textContent = formatScore(signalData.score);
      root.querySelector<HTMLElement>(".metric-kind")!.textContent = text().signalKinds[signalData.signalKind as keyof typeof copy.zh.signalKinds] ?? text().signalKinds.calm;
      root.querySelector<HTMLElement>(".metric-posts")!.textContent = String(signalData.postCount);
      root.querySelector<HTMLElement>(".metric-date")!.textContent = signalData.updatedAt.replace("T", " ").slice(0, 16);
      const tweets = signalData.recentTweets ?? [];
      tweetList.innerHTML = tweets.length > 0 ? tweets.map((tweet) => `
        <li class="tweet-card">
          <a href="${escapeHtml(tweet.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(text().openTweet)}">
            <span class="tweet-text">${escapeHtml(tweet.text)}</span>
            <span class="tweet-meta"><time datetime="${escapeHtml(tweet.at)}">${escapeHtml(tweet.at.replace("T", " ").slice(5, 16))}</time><span>♡ ${compactCount(tweet.likes, language)}</span><span>↻ ${compactCount(tweet.reposts, language)}</span><b>${escapeHtml(text().openTweet)} ↗</b></span>
          </a>
        </li>`).join("") : `<li class="tweet-empty">${escapeHtml(text().noTweets)}</li>`;
      restore.disabled = false;
    } else {
      signalPanel.style.setProperty("--probability", "0");
      root.querySelector<HTMLElement>(".metric-strength")!.textContent = "--";
      root.querySelector<HTMLElement>(".auto-level-value")!.textContent = "--";
      root.querySelector<HTMLElement>(".metric-kind")!.textContent = "--";
      root.querySelector<HTMLElement>(".metric-posts")!.textContent = "--";
      root.querySelector<HTMLElement>(".metric-date")!.textContent = "--";
      tweetList.innerHTML = `<li class="tweet-empty">${escapeHtml(dataUnavailable ? text().noTweets : text().signalLoading)}</li>`;
      restore.disabled = true;
    }
    if (mode === "manual") status.textContent = text().manualStatus;
    else if (signalData) status.textContent = text().signalStatus(signalData.postCount, signalData.eventCount, signalData.signalActive);
    else if (dataUnavailable) status.textContent = text().unavailableStatus;
    else status.textContent = text().signalLoading;
  };

  const renderTimeline = (): void => {
    timeline.innerHTML = timelineDays.slice(-30).reverse().map((day) => {
      const stage = language === "zh" ? day.stage : describeScore(day.score).englishStage;
      return `<li><time>${day.date.slice(5)}</time><span>${stage}</span><strong>${formatScore(day.score)}</strong></li>`;
    }).join("");
  };

  const renderScore = (raw: number): void => {
    const description = describeScore(raw);
    currentScore = description.displayScore;
    slider.value = String(currentScore);
    resistorThumb.src = `${import.meta.env.BASE_URL}frames/frame-${String(description.frameIndex).padStart(2, "0")}.jpg`;
    experience.dataset.stage = String(description.stageIndex);
    experience.style.setProperty("--strength", String(description.trackProgress));
    experience.style.setProperty("--stage-progress", String(description.stageProgress));
    output.value = formatScore(currentScore);
    const stage = language === "zh" ? description.stage : description.englishStage;
    stageName.textContent = stage;
    stageGhost.textContent = stage;
    stageIndex.textContent = `${description.englishStage} · ${text().stage} ${String(description.stageIndex + 1).padStart(2, "0")} / 06`;
    canvas.setAttribute("aria-label", text().portraitLabel(stage));
    onScoreChange(currentScore);
  };

  const renderLanguage = (): void => {
    const languageCopy = text();
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    const pageTitle = root.querySelector<HTMLElement>(".page-title")!;
    pageTitle.textContent = languageCopy.title;
    root.querySelector<HTMLAnchorElement>(".source-link")!.firstChild!.textContent = `${languageCopy.sourceCode} `;
    languageToggle.dataset.language = language;
    languageToggle.setAttribute("aria-label", languageCopy.languageLabel);
    root.querySelector<HTMLElement>(".current-state-label")!.textContent = languageCopy.currentState;
    root.querySelector<HTMLElement>(".control-panel")!.setAttribute("aria-label", languageCopy.controlLabel);
    slider.setAttribute("aria-label", languageCopy.sliderLabel);
    root.querySelector<HTMLElement>(".drag-hint-copy")!.textContent = languageCopy.dragHint;
    root.querySelector<HTMLElement>(".signal-panel")!.setAttribute("aria-label", languageCopy.signalDetails);
    root.querySelector<HTMLElement>(".metric-strength-label")!.textContent = languageCopy.resetProbability;
    root.querySelector<HTMLElement>(".metric-kind-label")!.textContent = languageCopy.signalKind;
    root.querySelector<HTMLElement>(".metric-posts-label")!.textContent = languageCopy.relatedPosts;
    root.querySelector<HTMLElement>(".metric-date-label")!.textContent = languageCopy.dataTime;
    root.querySelector<HTMLElement>(".auto-level-label")!.textContent = languageCopy.autoLevel;
    root.querySelector<HTMLElement>(".tweets-heading")!.textContent = languageCopy.latestTweets;
    restore.textContent = languageCopy.autoAdjust;
    timeline.setAttribute("aria-label", languageCopy.timeline);
    root.querySelector<HTMLElement>(".footer-evolution")!.textContent = languageCopy.footerEvolution;
    root.querySelector<HTMLElement>(".footer-signal")!.textContent = languageCopy.footerSignal;
    if (loading) loadState.textContent = languageCopy.loadSignal(loading.loaded, loading.total);
    if (mediaError) loadState.textContent = languageCopy.loadError;
    renderScore(currentScore);
    renderSignal();
    renderTimeline();
  };

  slider.addEventListener("input", () => controller.onManualChange?.(clampScore(Number(slider.value))));
  restore.addEventListener("click", () => controller.onRestoreAuto?.());
  languageToggle.addEventListener("click", () => controller.setLanguage(language === "zh" ? "en" : "zh"));

  const controller: AppController = {
    canvas,
    slider,
    get score() { return currentScore; },
    get language() { return language; },
    setScore: renderScore,
    setLanguage(nextLanguage) {
      if (language === nextLanguage) return;
      language = nextLanguage;
      renderLanguage();
      controller.onLanguageChange?.(language);
    },
    setLoading(loaded, total) { loading = { loaded, total }; mediaError = false; loadState.textContent = text().loadSignal(loaded, total); },
    setReady() { loading = null; slider.disabled = false; loadState.classList.add("is-hidden"); },
    setError() { loading = null; mediaError = true; loadState.textContent = text().loadError; },
    setMode(nextMode) {
      mode = nextMode;
      modePill.textContent = nextMode === "manual" ? "LOCAL PREVIEW" : "AUTO";
      modePill.classList.toggle("is-manual", nextMode === "manual");
      restore.classList.toggle("is-current", nextMode === "auto");
      renderSignal();
    },
    setSignalData(data) {
      signalData = data;
      dataUnavailable = false;
      renderSignal();
    },
    setDataUnavailable() { signalData = null; dataUnavailable = true; renderSignal(); },
    setTimelineEvents(days) {
      timelineDays = days;
      renderTimeline();
    },
  };
  renderLanguage();
  return controller;
}
