const express = require("express");
const router = express.Router();
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const secured = require("../middleware/secured");

const allowedLevels = ["warn", "error", "info", "debug", "functions", "notice"];
const allowedTypes = ["testing", "live", "dev"];

const dbPath = path.resolve(__dirname, "../../data/logs.sqlite3");

if (!fs.existsSync(dbPath)) {
  // Create empty file to allow readonly open later
  fs.closeSync(fs.openSync(dbPath, "w"));
  // Optionally initialize schema here or open writable once for setup
}

const db = new Database(dbPath, { readonly: true });

router.get("/logs", secured, (req, res) => {
  // res.render("pages/logs", { layout: "logs" });
  res.renderWithBaseContext("pages/logs", { showSidebar: false, showFooter: false });
});

router.post("/logs", secured, (req, res) => {
  const log_type = req.query.log_type || "*";
  const log_level = req.query.log_level || "*";
  const date = req.query.date || "*";

  if (log_level !== "*" && !allowedLevels.includes(log_level)) {
    return res.status(400).json({ error: "Invalid log_level" });
  }
  if (log_type !== "*" && !allowedTypes.includes(log_type)) {
    return res.status(400).json({ error: "Invalid log_type" });
  }

  const conditions = [];
  const params = [];

  if (log_level !== "*") {
    conditions.push("l.level = ?");
    params.push(log_level);
  }

  if (date !== "*") {
    conditions.push("date(l.timestamp) = ?");
    params.push(date);
  }

  if (log_type !== "*") {
    conditions.push(`EXISTS (
      SELECT 1 FROM log_metadata m
      JOIN keys k ON k.id = m.key_id
      WHERE m.log_id = l.id AND k.key = 'type' AND m.value = ?
    )`);
    params.push(log_type);
  }

  const whereClause = conditions.length
    ? "WHERE " + conditions.join(" AND ")
    : "";

  const query = `
    SELECT
      l.id,
      l.timestamp,
      l.level,
      GROUP_CONCAT(k.key || '=' || m.value, '||') AS meta_kv
    FROM logs l
    LEFT JOIN log_metadata m ON m.log_id = l.id
    LEFT JOIN keys k ON k.id = m.key_id
    ${whereClause}
    GROUP BY l.id
    ORDER BY l.timestamp DESC
    LIMIT 500
  `;

  try {
    const rows = db.prepare(query).all(...params);

    const logs = rows.map((row) => {
      const meta = {};
      if (row.meta_kv) {
        for (const pair of row.meta_kv.split("||")) {
          const [k, v] = pair.split("=");
          if (k && v !== undefined) {
            try {
              meta[k] = JSON.parse(v);
            } catch {
              meta[k] = v;
            }
          }
        }
      }
      return {
        id: row.id,
        timestamp: row.timestamp,
        level: row.level,
        ...meta,
      };
    });

    res.json(logs);
  } catch {
    res.status(500).json({ error: "Failed to query logs" });
  }
});

module.exports = router;
