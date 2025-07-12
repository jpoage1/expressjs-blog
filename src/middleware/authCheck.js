// middleware/authCheck.js
const fetch = require("node-fetch");

const VERIFY_URL = process.env.AUTH_VERIFY;
const CACHE_TTL = parseInt(process.env.AUTH_CACHE_TTL) || 120000; // 2 minutes default

// Simple in-memory cache
const authCache = new Map();

// Helper to generate cache key
function getCacheKey(cookie, authHeader) {
  return `${cookie}:${authHeader}`;
}

// Helper to check if cache entry is valid
function isCacheValid(entry) {
  return entry && Date.now() - entry.timestamp < CACHE_TTL;
}

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of authCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL) {
      authCache.delete(key);
    }
  }
}, CACHE_TTL); // Clean up when entries would expire

module.exports = async (req, res, next) => {
  const cookie = req.headers["cookie"] || "";
  const authHeader = req.headers["authorization"] || "";
  const cacheKey = getCacheKey(cookie, authHeader);

  // Check cache first
  const cached = authCache.get(cacheKey);
  if (isCacheValid(cached)) {
    req.isAuthenticated = cached.isAuthenticated;
    return next();
  }

  // Default to unauthenticated
  req.isAuthenticated = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const resVerify = await fetch(VERIFY_URL, {
      headers: {
        cookie,
        authorization: authHeader,
      },
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const isAuthenticated = resVerify.status === 200;

    // Cache the result
    authCache.set(cacheKey, {
      isAuthenticated,
      timestamp: Date.now(),
    });

    req.isAuthenticated = isAuthenticated;
  } catch (err) {
    // Auth server down/timeout - silently fail, don't crash the app
    req.isAuthenticated = false;

    // Optional: Log for debugging, but don't spam logs
    if (req.log) {
      req.log.warn(
        "[AuthCheck] Auth server unavailable, continuing unauthenticated"
      );
    } else {
      console.warn(
        "[AuthCheck] Auth server unavailable, continuing unauthenticated"
      );
    }
  }

  next();
};
