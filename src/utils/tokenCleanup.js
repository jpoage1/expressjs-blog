// src/utils/tokenCleanup.js
const { cleanupTokens } = require("./adminToken");
const { winstonLogger } = require("./logging");

// Set up periodic cleanup (run every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function startTokenCleanup() {
  setInterval(() => {
    cleanupTokens();
    winstonLogger.debug("Cleaned up expired pre-auth tokens");
  }, CLEANUP_INTERVAL);
}

module.exports = { startTokenCleanup };
