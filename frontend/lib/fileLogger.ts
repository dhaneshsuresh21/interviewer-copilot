/**
 * Frontend File Logger — intercepts console.log/warn/error for lines with
 * known prefixes ([Engine], [Store], [Socket], [Deepgram], [UttBuilder], [FSM])
 * and batches them to POST /api/logs on the backend, which writes them to disk.
 *
 * Usage: import this module once in a top-level layout or _app file.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const LOG_PREFIXES = [
  "[Engine",
  "[Store]",
  "[Socket",
  "[Deepgram",
  "[UttBuilder",
  "[FSM]",
  "[LangChain",
];

let buffer: string[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 2000;
const MAX_BUFFER_SIZE = 100;

function shouldCapture(args: unknown[]): boolean {
  if (args.length === 0) return false;
  const first = String(args[0]);
  return LOG_PREFIXES.some((p) => first.includes(p));
}

function argsToString(args: unknown[]): string {
  return args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ");
}

function enqueue(level: string, args: unknown[]): void {
  const ts = new Date().toISOString();
  buffer.push(`[${ts}] [${level}] ${argsToString(args)}`);

  if (buffer.length >= MAX_BUFFER_SIZE) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (buffer.length === 0) return;

  const batch = buffer.splice(0);
  fetch(`${API_BASE_URL}/api/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logs: batch }),
  }).catch(() => {
    // Silently ignore — don't break the app if backend is down
  });
}

// ---------------------------------------------------------------------------
// Intercept console methods (only in browser)
// ---------------------------------------------------------------------------

let installed = false;

export function installFrontendLogger(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  console.log = (...args: unknown[]) => {
    originalLog(...args);
    if (shouldCapture(args)) enqueue("LOG", args);
  };

  console.warn = (...args: unknown[]) => {
    originalWarn(...args);
    if (shouldCapture(args)) enqueue("WARN", args);
  };

  console.error = (...args: unknown[]) => {
    originalError(...args);
    if (shouldCapture(args)) enqueue("ERROR", args);
  };

  // Flush on page unload
  window.addEventListener("beforeunload", flush);
}
