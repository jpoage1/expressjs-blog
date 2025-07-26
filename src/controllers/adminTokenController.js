const { validateToken, cleanupTokens } = require("../utils/adminToken");
const SecurityEvent = require("../utils/SecurityEvent");

exports.cleanupTokensMiddleware = (req, res, next) => {
  if (Math.random() < 0.1) {
    cleanupTokens();
  }
  next();
};

// this is redirecting to authelia, despite being a "safe ip"

exports.handleTokenRedirect = (req, res, next) => {
  const { token } = req.params;
  if (req.isAuthenticated || !token) return next();

  if (!validateToken(token)) {
    const error = new SecurityEvent("INVALID_TOKEN", { token });
    return next(error);
  }

  const scheme = req.protocol;
  const host = req.get("host");
  const referrer = req.get("Referer") || req.get("Referrer") || "";

  const redirectTo = referrer.startsWith("http")
    ? referrer
    : `${scheme}://${host}${referrer}`;

  const adminLoginUrl = `${process.env.AUTH_LOGIN}${redirectTo}`;
  res.set("Content-Type", "text/html");
  res.customRedirect(adminLoginUrl, 301);
  console.log("test");
};
