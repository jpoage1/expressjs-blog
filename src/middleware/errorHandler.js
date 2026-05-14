// src/middleware/errorHandler
const crypto = require("crypto");
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
const { meta } = require("../config/loader");

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
    try {
      res.customRedirect(`${ERROR_REDIRECT_PATH}/${errorContext.statusCode}`);
    } catch (e) {
      console.error("Critical error", errorContext);
    }
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

  try {
    const session = res.locals.session || {
      isAuthenticated: false,
      user: null,
      groups: [],
    };
    const errorPageContext = await req.getBaseContext(session, context);
    res.status(errorContext.statusCode);
    res.renderGenericMessage(errorPageContext);
  } catch (e) {
    winstonLogger.error(e, { context });
    if (meta.node_env == "production") {
      res.send("Critical error.");
    } else {
      const response = "<pre>" + JSON.stringify(context, null, 2) + "</pre>";
      res.send(response);
    }
  }
};
