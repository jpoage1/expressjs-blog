// src/services/blocklist.js
// Maintains an in-memory Set of blocked IPs, refreshed from Postgres on a
// timer. The middleware reads from the Set — zero latency, no DB call per
// request. When you manually set blocked=TRUE on a visitor row, the change
// takes effect within one refresh cycle (default 5 minutes).
//
// If Postgres is unreachable, the Set stays as-is (last known state).
// On first boot with no DB, the Set is empty — fail-open by design.

const { getBlockedIPs } = require("#services/visitorService.js");
const { ApiError } = require("#utils/errors.js");

let blockedSet = new Set();
let intervalHandle = null;

async function refresh() {
  try {
    blockedSet = await getBlockedIPs();
  } catch (err) {
    ApiError("Blocklist refresh failed", err).log();
  }
}

/**
 * Check whether an IP is currently blocked.
 */
function isBlocked(ip) {
  return blockedSet.has(ip);
}

/**
 * Start the periodic refresh. Call once at app startup.
 * @param {number} intervalMs - refresh interval in milliseconds (default 5 min)
 */
function start(intervalMs = 5 * 60_000) {
  // Initial load — don't await, app startup shouldn't block on this
  refresh();
  intervalHandle = setInterval(refresh, intervalMs);
  intervalHandle.unref(); // don't keep the process alive just for this
}

/**
 * Stop the refresh timer. Call on graceful shutdown if needed.
 */
function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = { isBlocked, start, stop, refresh };
