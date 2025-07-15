// src/middleware/formatHtml.js
const beautify = require("js-beautify").html;
const {
  BEAUTIFY_OPTIONS,
  ERROR_MESSAGES,
} = require("../constants/htmlFormatConstants");

module.exports = function (req, res, next) {
  const originalSend = res.send;

  res.send = function (body) {
    if (res.headersSent) {
      req.log.warn("Attempted to send after headers were already sent.");
      return next();
    }

    const contentType = res.get("Content-Type") || "";
    const isHTML = contentType.includes("text/html");

    if (!isHTML) {
      return originalSend.call(this, body);
    }

    try {
      body = beautify(body, BEAUTIFY_OPTIONS);
    } catch (e) {
      req.log.error(ERROR_MESSAGES.BEAUTIFY_ERROR, e);
    }

    return originalSend.call(this, body);
  };

  next();
};
