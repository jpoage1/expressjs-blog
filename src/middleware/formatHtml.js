// src/middleware/formatHtml.js
const beautify = require("js-beautify").html;

module.exports = function (req, res, next) {
  const originalSend = res.send;

     res.send = function (body) {
       if (
         typeof body === "string" &&
         res.get("Content-Type")?.includes("text/html")
       ) {
         body = beautify(body, {
           indent_size: 2,
           wrap_line_length: 80,
           end_with_newline: true,
         });
       }
       return originalSend.call(this, body);
     };

  next();
};
