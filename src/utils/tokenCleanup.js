// src/utils/tokenCleanup.js
const { cleanupTokens } = require("./adminToken");

// Set up periodic cleanup (run every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function startTokenCleanup() {
  setInterval(() => {
    cleanupTokens();
    console.log("Cleaned up expired pre-auth tokens");
  }, CLEANUP_INTERVAL);
}

module.exports = { startTokenCleanup };
