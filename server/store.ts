import { mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";

const PERSIST_DIR = "/tmp/claude-selector";
const PERSIST_PATH = `${PERSIST_DIR}/latest.json`;
const MAX_PAYLOADS = 50;

export interface ElementData {
  selector: string;
  outerHTML: string;
  innerHTML: string;
  textContent: string;
  attributes: Record<string, string>;
  computedStyles: Record<string, string>;
  boundingRect: Record<string, number>;
  screenshot?: string;
}

export interface Payload {
  source: { url: string; title: string };
  elements: ElementData[];
  timestamp: string;
}

export class Store {
  private payloads: Payload[] = [];
  private sessions = new Set<string>();
  private consumedBy = new Set<string>();
  private payloadVersion = 0;

  async add(payload: Payload): Promise<number> {
    this.payloads.push(payload);
    if (this.payloads.length > MAX_PAYLOADS) {
      this.payloads = this.payloads.slice(-MAX_PAYLOADS);
    }
    this.payloadVersion++;
    this.consumedBy.clear();
    await this.persist();
    return this.payloads.length;
  }

  getAll(): Payload[] {
    return this.payloads;
  }

  getLatest(): Payload | undefined {
    return this.payloads.at(-1);
  }

  getLatestForSession(sessionId: string): Payload | undefined {
    if (this.consumedBy.has(sessionId)) return undefined;
    return this.getLatest();
  }

  hasUnconsumedForSession(sessionId: string): boolean {
    if (this.payloads.length === 0) return false;
    return !this.consumedBy.has(sessionId);
  }

  consume(sessionId: string): void {
    this.consumedBy.add(sessionId);
    this.autoCleanup();
  }

  registerSession(sessionId: string): void {
    this.sessions.add(sessionId);
  }

  unregisterSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.consumedBy.delete(sessionId);
    this.autoCleanup();
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  private autoCleanup(): void {
    if (this.payloads.length === 0) return;
    if (this.sessions.size === 0) return;
    // If all registered sessions have consumed, clear everything
    for (const s of this.sessions) {
      if (!this.consumedBy.has(s)) return;
    }
    this.payloads = [];
    this.consumedBy.clear();
    try {
      if (existsSync(PERSIST_PATH)) {
        unlink(PERSIST_PATH).catch(() => {});
      }
    } catch {}
  }

  async clearAll(): Promise<void> {
    this.payloads = [];
    this.consumedBy.clear();
    try {
      if (existsSync(PERSIST_PATH)) {
        await unlink(PERSIST_PATH);
      }
    } catch {}
  }

  async clear(): Promise<void> {
    await this.clearAll();
  }

  private async persist(): Promise<void> {
    const latest = this.getLatest();
    if (!latest) return;
    await mkdir(PERSIST_DIR, { recursive: true });
    await Bun.write(PERSIST_PATH, JSON.stringify(latest, null, 2));
  }
}
