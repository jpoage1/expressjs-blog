const { isProd } = require("./env");

function buildErrorRenderContext({
  req,
  requestId,
  timestamp,
  code,
  statusCode,
  message,
  stack,
  errorContext,
}) {
  return {
    title: errorContext.title,
    message: isProd ? errorContext.message : message,
    content: isProd
      ? ""
      : JSON.stringify(
          {
            timestamp,
            requestId,
            method: req.method,
            url: req.originalUrl || req.url,
            code,
            statusCode,
            headers: req.headers,
            query: req.query,
            body: req.body,
            ip: req.ip || req.connection?.remoteAddress,
            stack,
          },
          null,
          2
        ),
  };
}

module.exports = { buildErrorRenderContext };
