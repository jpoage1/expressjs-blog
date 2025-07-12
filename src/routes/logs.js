const express = require("express");
const router = express.Router();
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const secured = require("../middleware/secured");

const allowedLevels = ["warn", "error", "info", "debug", "functions", "notice"];

const dbPath = path.resolve(__dirname, "../../data/logs.sqlite3");

if (!fs.existsSync(dbPath)) {
  fs.closeSync(fs.openSync(dbPath, "w"));
}

const db = new Database(dbPath, { readonly: true });

router.get("/logs", secured, (req, res) => {
  res.renderWithBaseContext("pages/logs", {
    showSidebar: false,
    showFooter: false,
  });
});

router.post("/logs", secured, (req, res) => {
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
    conditions.push("l.level = ?");
    params.push(log_level);
  }

  if (date !== "*") {
    conditions.push("date(l.timestamp) = ?");
    params.push(date);
  }

  const whereClause = conditions.length
    ? "WHERE " + conditions.join(" AND ")
    : "";

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(DISTINCT l.id) as total
    FROM logs l
    ${whereClause}
  `;

  const totalResult = db.prepare(countQuery).get(...params);
  const total = totalResult.total;

  // Get paginated results
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
    LIMIT ? OFFSET ?
  `;

  try {
    const rows = db.prepare(query).all(...params, limit, offset);

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
  } catch {
    res.status(500).json({ error: "Failed to query logs" });
  }
});

module.exports = router;
