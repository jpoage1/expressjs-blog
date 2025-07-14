const rateLimit = require("express-rate-limit");

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_MESSAGE = "Too many requests, please try again later.";

const formLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: RATE_LIMIT_MESSAGE,
});

module.exports = formLimiter;
