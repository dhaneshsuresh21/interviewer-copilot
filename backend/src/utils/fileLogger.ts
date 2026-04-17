/**
 * File Logger — intercepts console.log/warn/error and tees output to a
 * timestamped log file under backend/logs/.
 *
 * Also exposes an Express router with POST /api/logs for the frontend
 * to flush its own log batches into the same file.
 *
 * Usage: import this module ONCE at the top of server.ts.
 */

import fs from "fs";
import path from "path";
import { Router } from "express";

// ---------------------------------------------------------------------------
// Log directory & file
// ---------------------------------------------------------------------------

const LOGS_DIR = path.join(__dirname, "../../logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function getLogFileName(): string {
  const d = new Date();
  const date = d.toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOGS_DIR, `interview-debug-${date}.log`);
}

// Open a write stream in append mode
let currentDate = new Date().toISOString().slice(0, 10);

// Clear old log file on every server restart
const logFile = getLogFileName();
if (fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, "");
}

let logStream = fs.createWriteStream(logFile, { flags: "a" });

function ensureStream(): fs.WriteStream {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== currentDate) {
    logStream.end();
    currentDate = today;
    logStream = fs.createWriteStream(getLogFileName(), { flags: "a" });
  }
  return logStream;
}

// ---------------------------------------------------------------------------
// Write helper
// ---------------------------------------------------------------------------

function writeToFile(level: string, args: unknown[]): void {
  const ts = new Date().toISOString();
  const message = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a, null, 0)))
    .join(" ");
  const line = `[${ts}] [${level}] ${message}\n`;

  try {
    ensureStream().write(line);
  } catch {
    // Silently ignore write errors to avoid infinite loops
  }
}

// ---------------------------------------------------------------------------
// Intercept console methods
// ---------------------------------------------------------------------------

const originalLog = console.log.bind(console);
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

console.log = (...args: unknown[]) => {
  originalLog(...args);
  writeToFile("LOG", args);
};

console.warn = (...args: unknown[]) => {
  originalWarn(...args);
  writeToFile("WARN", args);
};

console.error = (...args: unknown[]) => {
  originalError(...args);
  writeToFile("ERROR", args);
};

// Write startup marker
writeToFile("INFO", ["========== SERVER STARTED ==========", new Date().toISOString()]);

// ---------------------------------------------------------------------------
// Express router for frontend logs
// ---------------------------------------------------------------------------

export const logRouter = Router();

logRouter.post("/logs", (req, res) => {
  const { logs } = req.body as { logs?: string[] };
  if (!Array.isArray(logs)) {
    return res.status(400).json({ error: "Expected { logs: string[] }" });
  }

  const ts = new Date().toISOString();
  const stream = ensureStream();
  for (const line of logs) {
    stream.write(`[${ts}] [FRONTEND] ${line}\n`);
  }

  res.json({ ok: true, count: logs.length });
});

// ---------------------------------------------------------------------------
// Cleanup on process exit
// ---------------------------------------------------------------------------

process.on("exit", () => {
  writeToFile("INFO", ["========== SERVER STOPPED =========="]);
  logStream.end();
});

export function getLogFilePath(): string {
  return getLogFileName();
}
