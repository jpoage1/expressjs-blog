// constants/authConstants.js
const { auth } = require("../config/loader");
const { verify: verify_url, cache_ttl, timeout_ms } = auth;

const LOG_MESSAGES = {
  AUTH_SERVER_UNAVAILABLE:
    "[AuthCheck] Auth server unavailable, continuing unauthenticated",
};

module.exports = {
  VERIFY_URL: verify_url,
  CACHE_TTL: cache_ttl,
  AUTH_TIMEOUT_MS: timeout_ms,
  LOG_MESSAGES,
};
