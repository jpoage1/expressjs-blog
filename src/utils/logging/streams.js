"use strict";

/**
 * src/utils/logging/streams.js
 *
 * Creates the raw file write streams and DailyRotateFile transports
 * consumed by consolePatch, manualLogger, and winston.
 *
 * Previously this file read logging.session and logging.dailyRotate
 * directly from config, but those keys didn't exist in the convict schema
 * so they were always undefined. They are now explicit schema entries and
 * exposed on config.logging.session / config.logging.dailyRotate.
 */

const fs = require("fs");
const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { format } = winston;

const { logging } = require("#config/loader.js");

// ─────────────────────────────────────────────────────────────────────────────
// Raw append streams — used by consolePatch and manualLogger
// ─────────────────────────────────────────────────────────────────────────────

function createLogStreams(files) {
  // Ensure parent directories exist before opening streams.
  // loader.js creates logDir and dbPath at startup; sub-directories
  // (info/, warn/, etc.) are created here on first use.
  for (const filePath of Object.values(files)) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  return {
    info: fs.createWriteStream(files.info, { flags: "a" }),
    notice: fs.createWriteStream(files.notice, { flags: "a" }),
    error: fs.createWriteStream(files.error, { flags: "a" }),
    warn: fs.createWriteStream(files.warn, { flags: "a" }),
    debug: fs.createWriteStream(files.debug, { flags: "a" }),
    security: fs.createWriteStream(files.security, { flags: "a" }),
    event: fs.createWriteStream(files.event, { flags: "a" }),
    analytics: fs.createWriteStream(files.analytics, { flags: "a" }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Session transport — one DailyRotateFile per server boot
// Written to logs/sessions/<timestamp>/
// ─────────────────────────────────────────────────────────────────────────────

function createSessionTransport(dir) {
  const s = logging.session; // camelCase block from buildLogConfig()

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new DailyRotateFile({
    dirname: dir,
    filename: s.filename,
    datePattern: s.datePattern,
    zippedArchive: s.zippedArchive,
    maxFiles: s.maxFiles,
    format: format.combine(
      format.timestamp(),
      format.printf(
        ({ timestamp, level, message }) =>
          `[${timestamp}] [${level.toUpperCase()}] ${message}`,
      ),
    ),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-level daily rotating transports — used by winston.js
// ─────────────────────────────────────────────────────────────────────────────

function buildTransport(level, filenamePrefix) {
  const r = logging.dailyRotate; // camelCase block from buildLogConfig()
  const dir = path.join(logging.logDir, level);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new DailyRotateFile({
    level,
    dirname: dir,
    filename: `${filenamePrefix}${r.filenameSuffix}`,
    datePattern: r.datePattern,
    zippedArchive: r.zippedArchive,
    maxFiles: r.maxFiles,
    format: format.combine(
      format.timestamp(),
      format.printf(
        ({ timestamp, level: lvl, message }) =>
          `[${timestamp}] [${lvl.toUpperCase()}] ${message}`,
      ),
    ),
  });
}

module.exports = {
  createLogStreams,
  createSessionTransport,
  buildTransport,
};
