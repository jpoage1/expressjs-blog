const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./data/analytics.sqlite3");
db.run(`
  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    url TEXT,
    referrer TEXT,
    user_agent TEXT,
    viewport TEXT,
    load_time REAL,
    event TEXT,
    ip TEXT,
    js_enabled INTEGER
  )
`);

module.exports = db;
