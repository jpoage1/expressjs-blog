// src/utils/adminToken.js
const crypto = require("crypto");

const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
const preAuthTokens = new Map(); // token -> expiry timestamp (ms)

function generateToken() {
  const token = crypto.randomBytes(24).toString("base64url");
  const expiry = Date.now() + TOKEN_TTL_MS;
  preAuthTokens.set(token, expiry);
  return token;
}

function validateToken(token) {
  const expiry = preAuthTokens.get(token);
  if (!expiry || expiry < Date.now()) {
    // Remove expired token
    preAuthTokens.delete(token);
    return false;
  }
  return true;
}

function revokeToken(token) {
  return preAuthTokens.delete(token);
}

function cleanupTokens() {
  const now = Date.now();
  for (const [token, expiry] of preAuthTokens.entries()) {
    if (expiry < now) {
      preAuthTokens.delete(token);
    }
  }
}

// Optional: Get token info for debugging
function getTokenInfo(token) {
  const expiry = preAuthTokens.get(token);
  if (!expiry) return null;

  return {
    token,
    expiresAt: new Date(expiry),
    isExpired: expiry < Date.now(),
    ttlMs: expiry - Date.now(),
  };
}

// Optional: Get all active tokens (for admin/debugging)
function getAllTokens() {
  const now = Date.now();
  const tokens = [];

  for (const [token, expiry] of preAuthTokens.entries()) {
    tokens.push({
      token,
      expiresAt: new Date(expiry),
      isExpired: expiry < now,
      ttlMs: expiry - now,
    });
  }

  return tokens;
}

module.exports = {
  generateToken,
  validateToken,
  revokeToken,
  cleanupTokens,
  getTokenInfo,
  getAllTokens,
  TOKEN_TTL_MS,
};
