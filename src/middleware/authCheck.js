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
const SAFE_IPS = ["192.168.1.200", "192.168.1.50"];

module.exports = async (req, res, next) => {
  const forwardedIp = req.ip;
  const directIp = req.connection.remoteAddress;
  // Determine the client IP address.
  // req.ip is often provided by Express and correctly handles X-Forwarded-For if Express is configured for it.
  // If not, you might need to manually check req.headers['x-forwarded-for']
  const clientIp = req.ip; // Or req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
  console.log(`${forwardedIp} ${directIp}`);
  // --- Bypass Logic ---
  // Check if the client IP is in the list of safe IPs
  if (SAFE_IPS.includes(clientIp)) {
    req.isAuthenticated = true; // Mark as authenticated (bypassed)
    if (req.log) {
      req.log.info(`Bypassing authentication for safe IP: ${clientIp}`);
    } else {
      console.info(`Bypassing authentication for safe IP: ${clientIp}`);
    }
    return next(); // Proceed to the next middleware/route handler
  }
  // --- End Bypass Logic ---
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
