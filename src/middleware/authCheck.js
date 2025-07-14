// middleware/authCheck.js
const fetch = require("node-fetch");
const {
  VERIFY_URL,
  CACHE_TTL,
  AUTH_TIMEOUT_MS,
  LOG_MESSAGES,
} = require("../constants/authConstants");

// Simple in-memory cache
const authCache = new Map();

function getCacheKey(cookie, authHeader) {
  return `${cookie}:${authHeader}`;
}

function isCacheValid(entry) {
  return entry && Date.now() - entry.timestamp < CACHE_TTL;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of authCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL) {
      authCache.delete(key);
    }
  }
}, CACHE_TTL);

module.exports = async (req, res, next) => {
  const cookie = req.headers["cookie"] || "";
  const authHeader = req.headers["authorization"] || "";
  const cacheKey = getCacheKey(cookie, authHeader);

  const cached = authCache.get(cacheKey);
  if (isCacheValid(cached)) {
    req.isAuthenticated = cached.isAuthenticated;
    return next();
  }

  req.isAuthenticated = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    const resVerify = await fetch(VERIFY_URL, {
      headers: { cookie, authorization: authHeader },
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    req.isAuthenticated = resVerify.status === 200;

    authCache.set(cacheKey, {
      isAuthenticated: req.isAuthenticated,
      timestamp: Date.now(),
    });
  } catch {
    req.isAuthenticated = false;
    if (req.log) {
      req.log.warn(LOG_MESSAGES.AUTH_SERVER_UNAVAILABLE);
    } else {
      console.warn(LOG_MESSAGES.AUTH_SERVER_UNAVAILABLE);
    }
  }

  next();
};
