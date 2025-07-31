const xss = require("xss");

function sanitizeObject(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  const sanitized = {};
  for (const key in obj) {
    const value = obj[key];
    sanitized[key] =
      typeof value === "string"
        ? xss(value)
        : Array.isArray(value)
        ? value.map((v) => (typeof v === "string" ? xss(v) : v))
        : sanitizeObject(value);
  }
  return sanitized;
}

function xssSanitizer(req, res, next) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.params) req.params = sanitizeObject(req.params);
  if (req.query) {
    try {
      Object.keys(req.query).forEach((k) => {
        const val = req.query[k];
        req.query[k] =
          typeof val === "string"
            ? xss(val)
            : Array.isArray(val)
            ? val.map((v) => (typeof v === "string" ? xss(v) : v))
            : val;
      });
    } catch {}
  }
  next();
}

module.exports = xssSanitizer;
