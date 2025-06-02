// src/middleware/formatHtml.js
const beautify = require("js-beautify").html;

module.exports = function (req, res, next) {
  const originalSend = res.send;

  res.send = function (body) {
    const contentType = res.get("Content-Type") || "";
    const isHTML = contentType.includes("text/html") || typeof body === "string" && body.trim().startsWith("<");

    if (isHTML) {
      try {
        body = beautify(body, {
          indent_size: 2,
          wrap_line_length: 80,
          end_with_newline: true,
        });
      } catch (e) {
        console.error("Beautify error:", e);
      }
    }

    return originalSend.call(this, body);
  };

  next();
};

