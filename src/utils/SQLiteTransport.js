const Transport = require("winston-transport");
const Database = require("better-sqlite3");
const path = require("path");

class SQLiteTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.db = new Database(path.resolve(__dirname, "../../data/logs.sqlite3"));

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        level TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL
      );
      CREATE TABLE IF NOT EXISTS log_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER NOT NULL,
        key_id INTEGER NOT NULL,
        value TEXT NOT NULL,
        FOREIGN KEY(log_id) REFERENCES logs(id) ON DELETE CASCADE,
        FOREIGN KEY(key_id) REFERENCES keys(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
      CREATE INDEX IF NOT EXISTS idx_log_metadata_logid_keyid ON log_metadata(log_id, key_id);
      CREATE INDEX IF NOT EXISTS idx_log_metadata_keyid_value ON log_metadata(key_id, value);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_keys_key ON keys(key);
    `);

    this.insertLog = this.db.prepare(
      `INSERT INTO logs (timestamp, level) VALUES (?, ?)`
    );
    this.getKeyId = this.db.prepare(`SELECT id FROM keys WHERE key = ?`);
    this.insertKey = this.db.prepare(`INSERT INTO keys (key) VALUES (?)`);
    this.insertMetadata = this.db.prepare(
      `INSERT INTO log_metadata (log_id, key_id, value) VALUES (?, ?, ?)`
    );
  }

  getOrCreateKeyId(key) {
    let row = this.getKeyId.get(key);
    if (!row) {
      const info = this.insertKey.run(key);
      return info.lastInsertRowid;
    }
    return row.id;
  }

  // Helper function to safely stringify values
  safeStringify(value) {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (err) {
        return "[Circular Reference]";
      }
    }
    return String(value);
  }

  log(info, callback) {
    setImmediate(() => this.emit("logged", info));

    const {
      timestamp = new Date().toISOString(),
      level,
      message,
      ...meta
    } = info;

    const insertLogTxn = this.db.transaction(() => {
      const result = this.insertLog.run(timestamp, level);
      const logId = result.lastInsertRowid;

      // Store message
      if (message) {
        const messageKeyId = this.getOrCreateKeyId("message");
        this.insertMetadata.run(
          logId,
          messageKeyId,
          this.safeStringify(message)
        );
      }

      // Store all metadata
      for (const [key, value] of Object.entries(meta)) {
        const keyId = this.getOrCreateKeyId(key);
        this.insertMetadata.run(logId, keyId, this.safeStringify(value));
      }
    });

    try {
      insertLogTxn();
    } catch (error) {
      console.error("SQLite logging error:", error);
      // Don't fail silently - this could hide important issues
    }

    callback();
  }
}

module.exports = SQLiteTransport;
