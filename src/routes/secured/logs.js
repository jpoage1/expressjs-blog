const express = require("express");
const router = express.Router();
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const { winstonLogger } = require("../../utils/logging");

const allowedLevels = ["warn", "error", "info", "debug", "functions", "notice"];

const logsDbPath = path.resolve(__dirname, "../../../data/logs.sqlite3");

if (!fs.existsSync(logsDbPath)) {
  fs.closeSync(fs.openSync(logsDbPath, "w"));
}

const logsDb = new Database(logsDbPath, { readonly: true });
const analyticsDb = require("../../utils/sqlite3");

router.get("/logs", (req, res) => {
  res.renderWithBaseContext("admin-pages/logs", {
    showSidebar: false,
    showFooter: false,
  });
});

router.post("/logs", (req, res) => {
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

  // Count query - simple and fast
  const countQuery = `SELECT COUNT(*) as total FROM logs ${whereClause}`;
  const totalResult = logsDb.prepare(countQuery).get(...params);
  const total = totalResult.total;

  // STEP 1: Get just the log records we need (fast!)
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

    // STEP 2: Get metadata only for these specific logs
    const logIds = logRows.map((row) => row.id);
    const placeholders = logIds.map(() => "?").join(",");

    const metadataQuery = `
      SELECT 
        m.log_id,
        k.key,
        m.value
      FROM log_metadata m
      JOIN keys k ON k.id = m.key_id
      WHERE m.log_id IN (${placeholders})
    `;

    const metadataRows = logsDb.prepare(metadataQuery).all(...logIds);

    // STEP 3: Build metadata lookup map
    const metadataMap = {};
    metadataRows.forEach((row) => {
      if (!metadataMap[row.log_id]) {
        metadataMap[row.log_id] = {};
      }
      try {
        metadataMap[row.log_id][row.key] = JSON.parse(row.value);
      } catch {
        metadataMap[row.log_id][row.key] = row.value;
      }
    });

    // STEP 4: Combine logs with their metadata
    const logs = logRows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      level: row.level,
      ...(metadataMap[row.id] || {}),
    }));

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    winstonLogger.error("Query error:", error);
    res.status(500).json({ error: "Failed to query logs" });
  }
});
router.post("/logs/analytics", (req, res) => {
  // const event = req.query.event || "*";
  // const date = req.query.date || "*";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(400).json({ error: "Invalid pagination parameters" });
  }

  const conditions = [];
  const params = [];

  // Uncomment and modify these when you want to add filters
  // if (event !== "*") {
  //   conditions.push("event = ?");
  //   params.push(event);
  // }
  // if (date !== "*") {
  //   conditions.push("date(timestamp_human) = ?");
  //   params.push(date);
  // }

  const whereClause = conditions.length
    ? "WHERE " + conditions.join(" AND ")
    : "";

  try {
    // Count total matching rows
    const countQuery = `SELECT COUNT(*) as total FROM analytics_view ${whereClause}`;

    analyticsDb.get(countQuery, params, (err, totalResult) => {
      if (err) {
        winstonLogger.error("Count query error:", err);
        return res.status(500).json({ error: "Failed to query logs" });
      }

      const total = totalResult.total;

      // Query logs with pagination
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

      const queryParams = [...params, limit, offset];

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
});

module.exports = router;
