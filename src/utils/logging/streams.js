"use strict";

const fs = require("fs");
const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { format } = winston;

// Do NOT destructure logging at module load time.
// loader.js runs buildLogConfig() as part of its module body, but Node's
// require cache means streams.js can be required BEFORE that body finishes
// (e.g. via logging/config.js → logging/index.js → streams.js).
// Reading config.logging inside each function means we access it after
// the loader module has fully executed.
const { logging } = require("#config");

// ── Raw append streams ────────────────────────────────────────────────────────

function createLogStreams(files) {
  for (const filePath of Object.values(files)) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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

// ── Session transport ─────────────────────────────────────────────────────────

function createSessionTransport(dir) {
  const s = logging.session;

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

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

// ── Per-level daily rotating transports ──────────────────────────────────────

function buildTransport(level, filenamePrefix) {
  const r = logging.dailyRotate;
  const dir = path.join(logging.logDir, level);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

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

module.exports = { createLogStreams, createSessionTransport, buildTransport };
