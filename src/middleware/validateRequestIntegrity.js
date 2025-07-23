// middleware/validateHttpRequest.js
const HttpError = require("../utils/HttpError");
const {
  ALLOWED_HTTP_METHODS,
  MAX_HEADER_COUNT,
  DISALLOWED_CONTENT_TYPE_SUBSTRINGS,
  MAX_CONTENT_LENGTH,
} = require("../constants/httpLimits");
const { HTTP_ERRORS } = require("../constants/httpMessages");

module.exports = (req, res, next) => {
  const contentLength = parseInt(req.get("content-length") || "0", 10);
  const contentType = req.headers["content-type"] || "";
  const headerCount = Object.keys(req.headers).length;

  if (!ALLOWED_HTTP_METHODS.includes(req.method)) {
    return next(
      new HttpError(HTTP_ERRORS.METHOD_NOT_ALLOWED(req.method), 405, {
        method: req.method,
      })
    );
  }

  if (contentLength > MAX_CONTENT_LENGTH) {
    return next(
      new HttpError(HTTP_ERRORS.PAYLOAD_TOO_LARGE, 413, {
        payloadSize: contentLength,
      })
    );
  }

  if (DISALLOWED_CONTENT_TYPE_SUBSTRINGS.some((t) => contentType.includes(t))) {
    return next(
      new HttpError(HTTP_ERRORS.FILE_UPLOADS_NOT_ALLOWED, 400, {
        contentType: contentType,
      })
    );
  }

  if (headerCount > MAX_HEADER_COUNT) {
    return next(
      new HttpError(HTTP_ERRORS.TOO_MANY_HEADERS, 400, { headerCount })
    );
  }

  next();
};
