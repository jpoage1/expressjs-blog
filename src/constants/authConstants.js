// constants/authConstants.js
const VERIFY_URL = process.env.AUTH_VERIFY;
const CACHE_TTL = parseInt(process.env.AUTH_CACHE_TTL, 10) || 120000; // 2 minutes default
const AUTH_TIMEOUT_MS = 5000; // 5 second timeout

const LOG_MESSAGES = {
  AUTH_SERVER_UNAVAILABLE:
    "[AuthCheck] Auth server unavailable, continuing unauthenticated",
};

module.exports = {
  VERIFY_URL,
  CACHE_TTL,
  AUTH_TIMEOUT_MS,
  LOG_MESSAGES,
};
