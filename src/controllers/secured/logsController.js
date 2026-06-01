// src/controllers/secured/logsController.js
//
// fetchLogs      — reads from daily log files on disk (no SQLite, no ORM)
// fetchAnalytics — reads from Postgres visitors/requests/security_flags tables
// renderLogsPage — unchanged
//
// Response shape is intentionally stable: when Fluentd replaces file-based
// shipping, fetchLogs swaps its data source without any frontend changes.

const fs = require("fs");
const path = require("path");
const { winstonLogger } = require("#logging");
const { logging } = require("#config");
const { getPool } = require("#db/pool.js");

const allowedLevels = [
  "error",
  "warn",
  "security",
  "notice",
  "event",
  "info",
  "debug",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read log entries from a DailyRotateFile log directory.
 * Each level writes to logs/<level>/<level>-YYYY-MM-DD.log (or <level>.log
 * for the current day's active file). Lines are plain text formatted as:
 *   [ISO-timestamp] [LEVEL] message
 *
 * Returns an array of { timestamp, level, message } objects, most recent first.
 */
function readLevelFile(level, date) {
  const logDir = path.join(logging.logDir, level);

  if (!fs.existsSync(logDir)) return [];

  // Prefer the dated file when a date filter is active, otherwise use
  // the current rolling file. Falls back to the most recently modified
  // file in the directory if neither exists.
  let filePath;
  if (date) {
    filePath = path.join(logDir, `${level}-${date}.log`);
  } else {
    // Active file (winston-daily-rotate-file keeps a symlink-style named file)
    const active = path.join(logDir, `${level}.log`);
    filePath = fs.existsSync(active) ? active : null;
  }

  if (!filePath || !fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split("\n").filter(Boolean);

  return lines
    .map((line) => {
      // Format: [2026-05-31T00:00:00.000Z] [LEVEL] rest of message
      const match = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+([\s\S]*)$/);
      if (!match) return null;
      return {
        timestamp: match[1],
        level: match[2].toLowerCase(),
        message: match[3],
      };
    })
    .filter(Boolean)
    .reverse(); // most recent first
}

function paginate(items, page, limit) {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  return {
    items: items.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

exports.renderLogsPage = (req, res) => {
  res.renderWithBaseContext("admin-pages/logs", {
    showSidebar: false,
    showFooter: false,
  });
};

// ---------------------------------------------------------------------------
// Logs — file-based
// Swap this function's body for a Loki HTTP query when Fluentd is in place.
// The response envelope stays identical.
// ---------------------------------------------------------------------------

exports.fetchLogs = (req, res) => {
  const logLevel = req.query.log_level || "*";
  const date = req.query.date || null;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 50, 1);

  if (logLevel !== "*" && !allowedLevels.includes(logLevel)) {
    return res.status(400).json({ error: "Invalid log_level" });
  }

  try {
    const levels = logLevel === "*" ? allowedLevels : [logLevel];
    const allEntries = levels.flatMap((level) => readLevelFile(level, date));

    // Sort descending across all levels when reading multiple
    allEntries.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

    const { items: logs, pagination } = paginate(allEntries, page, limit);

    // Stable response shape — matches what a Loki query would return
    res.json({ logs, pagination });
  } catch (err) {
    winstonLogger.error("fetchLogs error:", err);
    res.status(500).json({ error: "Failed to read logs" });
  }
};

// ---------------------------------------------------------------------------
// Analytics — Postgres
// ---------------------------------------------------------------------------

exports.fetchAnalyticsLogs = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 50, 1);
  const offset = (page - 1) * limit;

  // Optional filters
  const classification = req.query.classification || null; // e.g. "bad_actor"
  const flagType = req.query.flag_type || null; // e.g. "probe"
  const flagStatus = req.query.flag_status || "pending"; // default: pending flags

  try {
    // --- Visitor + request summary ---
    const visitorsQuery = `
      SELECT
        v.id,
        v.ip,
        v.user_agent,
        v.first_seen,
        v.last_seen,
        v.classification,
        v.blocked,
        COUNT(r.id) AS request_count
      FROM visitors v
      LEFT JOIN requests r ON r.visitor_id = v.id
      ${classification ? "WHERE v.classification = $3" : ""}
      GROUP BY v.id
      ORDER BY v.last_seen DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) AS total FROM visitors
      ${classification ? "WHERE classification = $1" : ""}
    `;

    const visitorParams = classification
      ? [limit, offset, classification]
      : [limit, offset];

    const countParams = classification ? [classification] : [];

    const [visitorsResult, countResult] = await Promise.all([
      getPool().query(visitorsQuery, visitorParams),
      getPool().query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit);

    // --- Pending flags for the returned visitors ---
    const visitorIds = visitorsResult.rows.map((r) => r.id);
    let flags = [];

    if (visitorIds.length > 0) {
      const placeholders = visitorIds.map((_, i) => `$${i + 2}`).join(", ");
      const flagsQuery = `
        SELECT visitor_id, flag_type, created_at, route, hit_count, status, details
        FROM security_flags
        WHERE status = $1
          AND visitor_id IN (${placeholders})
        ORDER BY created_at DESC
      `;
      const flagsResult = await getPool().query(flagsQuery, [
        flagStatus,
        ...visitorIds,
      ]);
      flags = flagsResult.rows;
    }

    // Attach flags to their visitor
    const flagsByVisitor = {};
    flags.forEach((f) => {
      if (!flagsByVisitor[f.visitor_id]) flagsByVisitor[f.visitor_id] = [];
      flagsByVisitor[f.visitor_id].push(f);
    });

    const logs = visitorsResult.rows.map((v) => ({
      id: v.id,
      ip: v.ip,
      userAgent: v.user_agent,
      firstSeen: v.first_seen,
      lastSeen: v.last_seen,
      classification: v.classification,
      blocked: v.blocked,
      requestCount: parseInt(v.request_count, 10),
      flags: flagsByVisitor[v.id] || [],
    }));

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    winstonLogger.error("fetchAnalyticsLogs error:", err);
    res.status(500).json({ error: "Failed to query analytics" });
  }
};
