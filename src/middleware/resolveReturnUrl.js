const { baseUrl } = require("../utils/baseUrl");

function resolveReturnUrl(req, res, next) {
  const myDomain = "jasonpoage.com";
  const fallbackUrl = baseUrl;
  const referrer = req.body?.referrer;

  req.returnUrl = fallbackUrl;

  if (typeof referrer !== "string") return next();

  try {
    const url = new URL(referrer);
    const isSameDomain = url.hostname.endsWith(myDomain);
    const isNotPresentation = !url.pathname.includes(
      "/projects/website-presentation"
    );

    if (isSameDomain && isNotPresentation) {
      req.returnUrl = referrer;
    }
  } catch {
    // noop
  }

  next();
}

module.exports = resolveReturnUrl;
