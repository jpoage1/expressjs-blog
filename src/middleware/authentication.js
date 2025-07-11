// middleware/authCheck.js
const fetch = require("node-fetch"); // if not using global fetch
const VERIFY_URL = "https://auth.jasonpoage.com/api/verify";
const CACHE_TTL_MS = 3000;

const sessionCache = new Map();

function cacheKey(req) {
  return req.headers["cookie"] || req.headers["authorization"] || "";
}

function isCachedValid(key) {
  const entry = sessionCache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS && entry.status === 200;
}

async function checkAuthFallback(req) {
  try {
    const res = await fetch(VERIFY_URL, {
      headers: { cookie: req.headers["cookie"] || "" },
      credentials: "include"
    });

    const body = await res.text();

    console.log("[AuthCheck] Response status:", res.status);
    console.log("[AuthCheck] Response headers:", Object.fromEntries(res.headers.entries()));
    console.log("[AuthCheck] Response body:", body);

    sessionCache.set(cacheKey(req), { timestamp: Date.now(), status: res.status });

    return res.status === 200;
  } catch (err) {
    console.error("[AuthCheck] Fetch error:", err);
    return false;
  }
}

module.exports = async (req, res, next) => {
  const remoteUser = req.headers["remote-user"];
  if (remoteUser) {
    req.isAuthenticated = true;
    console.log("Authenticated: ", remoteUser)
    return next();
  }

  const key = cacheKey(req);
  if (isCachedValid(key) !== false ) {
    req.isAuthenticated = true;
    console.log("Authenticated Key", key)
    return next();
  }

  req.isAuthenticated = await checkAuthFallback(req);

  console.log("Authenticated Result", req.isAuthenticated)
  next();
};
