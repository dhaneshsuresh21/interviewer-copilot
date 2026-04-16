import winston from 'winston';
import path from 'path';
import fs from 'fs';

const isDev = process.env.NODE_ENV === 'development';

const logsDir = path.join(process.cwd(), 'logs');
if (isDev && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? '  ' + JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message}${metaStr}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? '  ' + JSON.stringify(meta) : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

/**
 * Single logger for everything — app events, transcript events, intent
 * classification, FSM transitions, and trigger decisions all go to
 * logs/interview.log so you can follow the full session in one place.
 */
export const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    ...(isDev
      ? [
          new winston.transports.File({
            filename: path.join(logsDir, 'interview.log'),
            format: fileFormat,
            maxsize: 20 * 1024 * 1024, // 20 MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

/** Alias used by the transcript log route — same logger, same file. */
export const transcriptLogger = logger;
