const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./data/analytic2.sqlite3");
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
    forwardedIp TEXT,
    DirectIp TEXT,
    js_enabled INTEGER
  )
`);
db.run(`
CREATE VIEW IF NOT EXISTS analytics_view AS
SELECT
  id,
  datetime(timestamp / 1000, 'unixepoch') AS timestamp_human,
  url,
  referrer,
  user_agent,
  viewport,
  load_time,
  event,
  forwardedIp,
  directIp,
  js_enabled
FROM analytics;`);
module.exports = db;
