const util = require("util");
const { isProd } = require("./env");

function buildErrorRenderContext(context = {}) {
  const {
    requestId,
    timestamp,
    code,
    statusCode,
    message,
    stack,
    errorContext = {},
  } = context;

  const { req, ...newContext } = context;

  return {
    title: errorContext.title,
    message: isProd ? errorContext.message : message,
    content: isProd
      ? ""
      : util.inspect(
          {
            ...newContext,
            timestamp,
            requestId,
            method: req.method,
            url: req.originalUrl || req.url,
            code,
            statusCode,
            headers: req.headers,
            query: Object.assign({}, req.query),
            body: req.body,
            ip: req.ip || req.connection?.remoteAddress,
            stack,
          },
          { depth: 4, colors: false }
        ),
  };
}

module.exports = { buildErrorRenderContext };
