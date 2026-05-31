// src/services/visitorService.js
// All database operations for visitor tracking and security flagging.
// Uses raw pg prepared statements — no ORM, no query builder.
// Every write is fire-and-forget: a failed insert must never reject a request.
const pool = require("../db/pool");

// --- Prepared SQL ---

const UPSERT_VISITOR = `
  INSERT INTO visitors (ip, user_agent, first_seen, last_seen)
  VALUES ($1, $2, NOW(), NOW())
  ON CONFLICT (ip, user_agent)
  DO UPDATE SET last_seen = NOW()
  RETURNING id
`;

const INSERT_REQUEST = `
  INSERT INTO requests (visitor_id, method, url, status_code, referrer, meta)
  VALUES ($1, $2, $3, $4, $5, $6)
`;

const INSERT_FLAG = `
  INSERT INTO security_flags (visitor_id, flag_type, route, hit_count, details)
  VALUES ($1, $2, $3, $4, $5)
`;

const GET_BLOCKED_IPS = `
  SELECT DISTINCT ip FROM visitors WHERE blocked = TRUE
`;

// --- Operations ---

/**
 * Resolve or create a visitor record. Returns the visitor id.
 * The UPSERT updates last_seen on every hit so you always know recency.
 */
async function upsertVisitor(ip, userAgent) {
  const { rows } = await pool.query(UPSERT_VISITOR, [ip, userAgent]);
  return rows[0].id;
}

/**
 * Append a request record. meta is a plain JS object (stored as JSONB).
 */
async function recordRequest(
  visitorId,
  method,
  url,
  statusCode,
  referrer,
  meta,
) {
  await pool.query(INSERT_REQUEST, [
    visitorId,
    method,
    url,
    statusCode,
    referrer || null,
    JSON.stringify(meta || {}),
  ]);
}

/**
 * Create a security flag for human review. details is a plain JS object.
 */
async function createFlag(visitorId, flagType, route, hitCount, details) {
  await pool.query(INSERT_FLAG, [
    visitorId,
    flagType,
    route || null,
    hitCount,
    JSON.stringify(details || {}),
  ]);
}

/**
 * Returns the set of currently blocked IPs. Used by the blocklist service.
 */
async function getBlockedIPs() {
  const { rows } = await pool.query(GET_BLOCKED_IPS);
  return new Set(rows.map((r) => r.ip));
}

module.exports = {
  upsertVisitor,
  recordRequest,
  createFlag,
  getBlockedIPs,
};
