// Minimal Cloudflare Workers declarations, kept separate from browser DOM types.
declare interface KVNamespace {
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string): Promise<void>;
}

declare interface ScheduledController {
  scheduledTime: number;
  cron: string;
  noRetry(): void;
}
