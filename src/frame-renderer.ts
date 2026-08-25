import { clampScore } from "./score-domain";

function framePath(index: number, baseUrl: string, thumbnail = false): string {
  const directory = thumbnail ? "frames/thumbs" : "frames";
  return `${baseUrl}${directory}/frame-${String(index).padStart(2, "0")}.jpg`;
}

export class FrameRenderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly frames: HTMLImageElement[];
  private readonly framePaths: string[];
  private readonly thumbnails: HTMLImageElement[];
  private readonly thumbnailPaths: string[];
  private currentFrame = 15;

  constructor(private readonly canvas: HTMLCanvasElement, baseUrl: string) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    this.context = context;
    this.framePaths = Array.from({ length: 31 }, (_, index) => framePath(index, baseUrl));
    this.thumbnailPaths = Array.from({ length: 31 }, (_, index) => framePath(index, baseUrl, true));
    this.frames = this.framePaths.map(() => {
      const image = new Image();
      image.decoding = "async";
      return image;
    });
    this.thumbnails = this.thumbnailPaths.map(() => {
      const image = new Image();
      image.decoding = "async";
      return image;
    });
  }

  async preloadThumbnail(score: number): Promise<void> {
    const index = Math.round(clampScore(score));
    await this.load(this.thumbnails[index], this.thumbnailPaths[index]);
  }

  async preloadThumbnails(): Promise<void> {
    await Promise.all(this.thumbnails.map((image, index) => this.load(image, this.thumbnailPaths[index])));
  }

  async preload(): Promise<void> {
    await Promise.all(this.frames.map((image, index) => this.load(image, this.framePaths[index])));
  }

  render(score: number): void {
    this.currentFrame = Math.round(clampScore(score));
    const index = this.currentFrame;
    const frame = this.frames[index];
    const thumbnail = this.thumbnails[index];
    if (this.isLoaded(frame)) {
      this.draw(frame);
      return;
    }
    void this.load(thumbnail, this.thumbnailPaths[index])
      .then(() => {
        if (this.currentFrame === index && !this.isLoaded(frame)) this.draw(thumbnail);
      })
      .catch(() => undefined);
    void this.load(frame, this.framePaths[index])
      .then(() => {
        if (this.currentFrame === index) this.draw(frame);
      })
      .catch(() => undefined);
  }

  redraw(): void {
    const frame = this.frames[this.currentFrame];
    if (this.isLoaded(frame)) {
      this.draw(frame);
      return;
    }
    const thumbnail = this.thumbnails[this.currentFrame];
    if (this.isLoaded(thumbnail)) this.draw(thumbnail);
  }

  private isLoaded(image: HTMLImageElement): boolean {
    return image.complete && image.naturalWidth > 0;
  }

  private load(image: HTMLImageElement, path: string): Promise<void> {
    if (!image.src) image.src = path;
    if (this.isLoaded(image)) return Promise.resolve();
    if (image.complete) return Promise.reject(new Error("Frame failed to load"));
    return new Promise((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("Frame failed to load")), { once: true });
    });
  }

  private draw(image: HTMLImageElement): void {
    const size = Math.max(1, Math.round(this.canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2)));
    if (this.canvas.width !== size || this.canvas.height !== size) {
      this.canvas.width = size;
      this.canvas.height = size;
    }
    this.context.clearRect(0, 0, size, size);
    this.context.drawImage(image, 0, 0, size, size);
  }
}
