// src/middleware/errorHandler
const crypto = require("crypto");
const getBaseContext = require("../utils/baseContext");
const { getErrorContext } = require("../utils/errorContext");
const { buildErrorRenderContext } = require("../utils/buildErrorRenderContext");
const { isDev } = require("../utils/env");
const {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_STACK_TRACE,
  DEFAULT_STATUS_CODE,
  DEFAULT_LOG_LEVEL,
  ERROR_REDIRECT_PATH,
} = require("../constants/errorConstants");
const { winstonLogger } = require("../utils/logging");

module.exports = async (err, req, res, next) => {
  const statusCode = err.statusCode ?? DEFAULT_STATUS_CODE;
  const message = err.message ?? DEFAULT_ERROR_MESSAGE;
  const stack = err.stack ?? DEFAULT_STACK_TRACE;
  const code = err.code ?? null;
  const requestId = crypto.randomUUID?.() ?? Date.now().toString(36);
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    level: DEFAULT_LOG_LEVEL,
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
    metadata: err.metadata,
  };

  if (req?.log?.error) {
    req.log.error(logEntry); // fixme, logs arent logging?
    winstonLogger.error(logEntry);
  } else {
    winstonLogger.error(logEntry);
  }

  const errorContext = getErrorContext(code || statusCode);

  if (!isDev && !req?.isAuthenticated) {
    res.customRedirect(
      `${ERROR_REDIRECT_PATH}?code=${errorContext.statusCode}`
    );
    return;
  }

  const context = buildErrorRenderContext({
    req,
    requestId,
    timestamp,
    code,
    statusCode,
    message,
    stack,
    errorContext,

    level: DEFAULT_LOG_LEVEL,

    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.ip || req.connection?.remoteAddress,
    metadata: err.metadata,
  });

  const errorPageContext = await getBaseContext(req?.isAuthenticated, context);
  res.status(errorContext.statusCode);
  res.renderGenericMessage(errorPageContext);
};
