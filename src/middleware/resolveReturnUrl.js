const { baseUrl } = require("../utils/baseUrl");
const config = require("../utils/baseUrl");

function resolveReturnUrl(req, res, next) {
  const domain = config.public.domain;
  const fallbackUrl = baseUrl;
  const referrer = req.body?.referrer;

  req.returnUrl = fallbackUrl;

  if (typeof referrer !== "string") return next();

  try {
    const url = new URL(referrer);
    const isSameDomain = url.hostname.endsWith(domain);
    const isNotPresentation = !url.pathname.includes(
      "/projects/website-presentation",
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
