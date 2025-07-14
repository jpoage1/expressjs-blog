// src/middleware/formatHtml.js
const beautify = require("js-beautify").html;
const {
  BEAUTIFY_OPTIONS,
  ERROR_MESSAGES,
} = require("../constants/htmlFormatConstants");

module.exports = function (req, res, next) {
  const originalSend = res.send;

  res.send = function (body) {
    const contentType = res.get("Content-Type") || "";
    const isHTML =
      contentType.includes("text/html") ||
      (typeof body === "string" && body.trim().startsWith("<"));

    if (isHTML) {
      try {
        body = beautify(body, BEAUTIFY_OPTIONS);
      } catch (e) {
        console.error(ERROR_MESSAGES.BEAUTIFY_ERROR, e);
      }
    }

    return originalSend.call(this, body);
  };

  next();
};
