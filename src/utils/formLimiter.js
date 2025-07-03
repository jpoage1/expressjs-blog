const rateLimit = require("express-rate-limit");

const formLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // max 5 requests per window per IP
  message: "Too many requests, please try again later.",
});
module.exports = formLimiter;
