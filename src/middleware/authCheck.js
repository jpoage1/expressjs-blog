// middleware/authCheck.js

const crypto = require("crypto");
function generateNonce() {
  return crypto.randomBytes(16).toString("base64");
}

module.exports = async (req, res, next) => {
  // Initialize default state
  res.locals.session = {
    nonce: generateNonce(),
    isAuthenticated: false,
    user: null,
    groups: [],
  };

  if (req.oidc.isAuthenticated()) {
    // Pull data directly from the encrypted session cookie
    // No network calls, no Map lookups, no staleness
    try {
      const user = await req.oidc.fetchUserInfo();
      const claims = req.oidc.idTokenClaims;
      const oidcNonce = claims.nonce;

      res.locals.session = {
        // claims,
        isAuthenticated: true,
        nonce: oidcNonce,
        ...user,
      };
    } catch (e) {
      // This should clear the session when i get around to it
      return next();
    }
  }

  next();
};
