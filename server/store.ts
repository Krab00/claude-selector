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

  async add(payload: Payload): Promise<number> {
    this.payloads.push(payload);
    if (this.payloads.length > MAX_PAYLOADS) {
      this.payloads = this.payloads.slice(-MAX_PAYLOADS);
    }
    await this.persist();
    return this.payloads.length;
  }

  getAll(): Payload[] {
    return this.payloads;
  }

  getLatest(): Payload | undefined {
    return this.payloads.at(-1);
  }

  async clear(): Promise<void> {
    this.payloads = [];
    try {
      if (existsSync(PERSIST_PATH)) {
        await unlink(PERSIST_PATH);
      }
    } catch {
      // ignore if file doesn't exist
    }
  }

  private async persist(): Promise<void> {
    const latest = this.getLatest();
    if (!latest) return;
    await mkdir(PERSIST_DIR, { recursive: true });
    await Bun.write(PERSIST_PATH, JSON.stringify(latest, null, 2));
  }
}
