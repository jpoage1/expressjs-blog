// middleware/authCheck.js
const fetch = require("node-fetch");
const { auth } = require("../config/loader");
const { verify: verify_url, cache_ttl, timeout_ms } = auth;
const { LOG_MESSAGES } = require("../constants/authConstants");

// Simple in-memory cache
const authCache = new Map();

function getCacheKey(cookie, authHeader) {
  return `${cookie}:${authHeader}`;
}

function isCacheValid(entry) {
  return entry && Date.now() - entry.timestamp < cache_ttl;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of authCache.entries()) {
    if (now - entry.timestamp >= cache_ttl) {
      authCache.delete(key);
    }
  }
}, cache_ttl);
// const SAFE_IPS = ["192.168.1.200", "192.168.1.50"];
const SAFE_IPS = [];

module.exports = async (req, res, next) => {
  // Determine the client IP address.
  // req.ip is often provided by Express and correctly handles X-Forwarded-For if Express is configured for it.
  // If not, you might need to manually check req.headers['x-forwarded-for']
  const clientIp = req.ip; // Or req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
  // --- Bypass Logic ---
  // Check if the client IP is in the list of safe IPs
  if (SAFE_IPS.includes(clientIp)) {
    // -- fixme; harden for production by disabling this
    res.locals.session = {
      isAuthenticated: true,
      user: "local-admin",
      groups: ["admin", "guests"], // Assign groups needed for menu visibility
    };
    if (req.log) {
      req.log.security(`Bypassing authentication for safe IP: ${clientIp}`);
    } else {
      console.security(`Bypassing authentication for safe IP: ${clientIp}`);
    }
    return next(); // Proceed to the next middleware/route handler
  }
  // --- End Bypass Logic ---

  const cookie = req.headers["cookie"] || "";
  const authHeader = req.headers["authorization"] || "";
  const cacheKey = getCacheKey(cookie, authHeader);

  const cached = authCache.get(cacheKey);
  if (isCacheValid(cached)) {
    res.locals.session = cached.session;
    return next();
  }

  res.locals.session = { isAuthenticated: false, user: null, groups: [] };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), auth.timeout_ms);

    const resVerify = await fetch(verify_url, {
      headers: { cookie, authorization: authHeader },
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (resVerify.status === 200) {
      // Extract Authelia identity headers from the verification response
      const user = resVerify.headers.get("remote-user");
      const groupsHeader = resVerify.headers.get("remote-groups") || "";
      const groups = groupsHeader
        ? groupsHeader.split(",").map((g) => g.trim())
        : [];

      res.locals.session = {
        isAuthenticated: true,
        user: user,
        groups: groups,
      };
    }

    authCache.set(cacheKey, {
      session: res.locals.session,
      timestamp: Date.now(),
    });
  } catch (e) {
    req.isAuthenticated = false;
    if (req.log) {
      req.log.warn(LOG_MESSAGES.AUTH_SERVER_UNAVAILABLE, e.stack);
    } else {
      console.warn(LOG_MESSAGES.AUTH_SERVER_UNAVAILABLE, e.stack);
    }
  }

  next();
};
