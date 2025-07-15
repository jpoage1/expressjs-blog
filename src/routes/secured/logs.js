const express = require("express");
const router = express.Router();
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const allowedLevels = ["warn", "error", "info", "debug", "functions", "notice"];

const dbPath = path.resolve(__dirname, "../../../data/logs.sqlite3");

if (!fs.existsSync(dbPath)) {
  fs.closeSync(fs.openSync(dbPath, "w"));
}

const db = new Database(dbPath, { readonly: true });

router.get("/logs", (req, res) => {
  res.renderWithBaseContext("admin-pages/logs", {
    showSidebar: false,
    showFooter: false,
  });
});

router.post("/logs", (req, res) => {
  const start = process.hrtime.bigint();

  const log_level = req.query.log_level || "*";
  const date = req.query.date || "*";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const parseStart = process.hrtime.bigint();

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

  const countStart = process.hrtime.bigint();

  // Count query - simple and fast
  const countQuery = `SELECT COUNT(*) as total FROM logs ${whereClause}`;
  const totalResult = db.prepare(countQuery).get(...params);
  const total = totalResult.total;

  const queryStart = process.hrtime.bigint();

  // STEP 1: Get just the log records we need (fast!)
  const logQuery = `
    SELECT id, timestamp, level
    FROM logs
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `;

  try {
    const logRows = db.prepare(logQuery).all(...params, limit, offset);

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

    const metadataRows = db.prepare(metadataQuery).all(...logIds);

    const mapStart = process.hrtime.bigint();

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

    const end = process.hrtime.bigint();

    req.log.info("logs route timings", {
      totalMs: Number(end - start) / 1e6,
      parseMs: Number(parseStart - start) / 1e6,
      countMs: Number(queryStart - countStart) / 1e6,
      queryMs: Number(mapStart - queryStart) / 1e6,
      mapMs: Number(end - mapStart) / 1e6,
    });

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
    console.error("Query error:", error);
    res.status(500).json({ error: "Failed to query logs" });
  }
});

module.exports = router;
