import { clampScore } from "./score-domain";

function framePath(index: number, baseUrl: string): string {
  return `${baseUrl}frames/frame-${String(index).padStart(2, "0")}.jpg`;
}

export class FrameRenderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly frames: HTMLImageElement[];
  private currentFrame = 15;

  constructor(private readonly canvas: HTMLCanvasElement, baseUrl: string) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    this.context = context;
    this.frames = Array.from({ length: 31 }, (_, index) => {
      const image = new Image();
      image.decoding = "async";
      image.src = framePath(index, baseUrl);
      return image;
    });
  }

  async preload(): Promise<void> {
    await Promise.all(this.frames.map((image) => image.decode().catch(() => new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("Frame failed to load")), { once: true });
    }))));
  }

  render(score: number): void {
    this.currentFrame = Math.round(clampScore(score));
    this.draw(this.frames[this.currentFrame]);
  }

  redraw(): void {
    this.draw(this.frames[this.currentFrame]);
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
