const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const { winstonLogger } = require("../../utils/logging");
const analyticsDb = require("../../utils/sqlite3");

const allowedLevels = [
  "warn",
  "error",
  "security",
  "event",
  "analytics",
  "info",
  "debug",
  "functions",
  "notice",
];
const logsDbPath = path.resolve(__dirname, "../../../data/logs.sqlite3");

if (!fs.existsSync(logsDbPath)) {
  fs.closeSync(fs.openSync(logsDbPath, "w"));
}

const logsDb = new Database(logsDbPath, { readonly: true });

exports.renderLogsPage = (req, res) => {
  res.renderWithBaseContext("admin-pages/logs", {
    showSidebar: false,
    showFooter: false,
  });
};

exports.fetchLogs = (req, res) => {
  const log_level = req.query.log_level || "*";
  const date = req.query.date || "*";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  if (log_level !== "*" && !allowedLevels.includes(log_level)) {
    return res.status(400).json({ error: "Invalid log_level" });
  }

  const conditions = [];
  const params = [];

  if (log_level !== "*") {
    conditions.push("level = ?");
    params.push(log_level);
  }

  if (date !== "*") {
    conditions.push("date(timestamp) = ?");
    params.push(date);
  }

  const whereClause = conditions.length
    ? "WHERE " + conditions.join(" AND ")
    : "";
  const countQuery = `SELECT COUNT(*) as total FROM logs ${whereClause}`;
  const totalResult = logsDb.prepare(countQuery).get(...params);
  const total = totalResult.total;

  const logQuery = `
    SELECT id, timestamp, level
    FROM logs
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `;

  try {
    const logRows = logsDb.prepare(logQuery).all(...params, limit, offset);
    if (logRows.length === 0) {
      return res.json({
        logs: [],
        pagination: { page, limit, total, totalPages: 0, hasMore: false },
      });
    }

    const logIds = logRows.map((row) => row.id);
    const placeholders = logIds.map(() => "?").join(",");
    const metadataQuery = `
      SELECT m.log_id, k.key, m.value
      FROM log_metadata m
      JOIN keys k ON k.id = m.key_id
      WHERE m.log_id IN (${placeholders})
    `;
    const metadataRows = logsDb.prepare(metadataQuery).all(...logIds);

    const metadataMap = {};
    metadataRows.forEach((row) => {
      if (!metadataMap[row.log_id]) metadataMap[row.log_id] = {};
      try {
        metadataMap[row.log_id][row.key] = JSON.parse(row.value);
      } catch {
        metadataMap[row.log_id][row.key] = row.value;
      }
    });

    const logs = logRows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      level: row.level,
      ...(metadataMap[row.id] || {}),
    }));

    const totalPages = Math.ceil(total / limit);

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
  } catch (error) {
    winstonLogger.error("Query error:", error);
    res.status(500).json({ error: "Failed to query logs" });
  }
};

exports.fetchAnalyticsLogs = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(400).json({ error: "Invalid pagination parameters" });
  }

  const conditions = [];
  const params = [];
  const whereClause = conditions.length
    ? "WHERE " + conditions.join(" AND ")
    : "";

  try {
    const countQuery = `SELECT COUNT(*) as total FROM analytics_view ${whereClause}`;
    analyticsDb.get(countQuery, params, (err, totalResult) => {
      if (err) {
        winstonLogger.error("Count query error:", err);
        return res.status(500).json({ error: "Failed to query logs" });
      }

      const total = totalResult.total;
      const queryParams = [...params, limit, offset];

      const logsQuery = `
        SELECT
          id,
          timestamp_human AS timestamp,
          url,
          referrer,
          user_agent,
          viewport,
          load_time,
          event,
          forwardedIp,
          directIp,
          js_enabled
        FROM analytics_view
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `;

      analyticsDb.all(logsQuery, queryParams, (err, logs) => {
        if (err) {
          winstonLogger.error("Logs query error:", err);
          return res.status(500).json({ error: "Failed to query logs" });
        }

        const totalPages = Math.ceil(total / limit);
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
      });
    });
  } catch (error) {
    winstonLogger.error("Query error:", error);
    res.status(500).json({ error: "Failed to query logs" });
  }
};
