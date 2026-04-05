import fs from "node:fs";
import path from "node:path";

export interface WatcherOptions {
  dir: string;
  patterns: string[];
  debounceMs?: number;
  onChange: () => void | Promise<void>;
}

export function watchDocs(options: WatcherOptions): { close: () => void } {
  const { dir, debounceMs = 500, onChange } = options;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  const resolvedDir = path.resolve(dir);

  const watcher = fs.watch(resolvedDir, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    // Only trigger for markdown files
    if (!filename.endsWith(".md") && !filename.endsWith(".mdx")) return;

    // Debounce
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(async () => {
      if (running) return;
      running = true;
      try {
        await onChange();
      } finally {
        running = false;
      }
    }, debounceMs);
  });

  return {
    close: () => {
      if (timeout) clearTimeout(timeout);
      watcher.close();
    },
  };
}
