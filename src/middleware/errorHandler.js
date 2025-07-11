// src/middleware/errorHandler
const crypto = require("crypto");
const getBaseContext = require("../utils/baseContext");
const { getErrorContext } = require("../utils/errorContext");
const { buildErrorRenderContext } = require("../utils/buildErrorRenderContext");
const { isDev } = require("../utils/env");

module.exports = async (err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? "Internal Server Error";
  const stack = err.stack ?? "No stack trace available";
  const code = err.code ?? null;
  const requestId = crypto.randomUUID?.() ?? Date.now().toString(36);
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    level: "error",
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    code,
    message,
    stack,
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.ip || req.connection?.remoteAddress,
  };

  if (req?.log?.error) {
    req.log.error(logEntry);
  } else {
    console.error(logEntry);
  }

  const errorContext = getErrorContext(code || statusCode);

  if (!isDev) {
    res.redirect(`/error?code=${errorContext.statusCode}`);
    return;
  }

  const context = {
    req,
    requestId,
    timestamp,
    code,
    statusCode,
    message,
    stack,
    errorContext,
  };

  res.status(errorContext.statusCode);
  res.renderWithBaseContext("pages/error", context);
};
