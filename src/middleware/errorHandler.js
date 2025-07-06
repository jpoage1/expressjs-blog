const crypto = require("crypto");
const getBaseContext = require("../utils/baseContext");
module.exports = async (err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? "Internal Server Error";
  const stack = err.stack ?? "No stack trace available";
  const code = err.code ?? null;
  const requestId = crypto.randomUUID?.() ?? Date.now().toString(36);

  const logEntry = {
    timestamp: new Date().toISOString(),
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
    console.error(JSON.stringify(logEntry, null, 2));
  }

  const errorContextMap = {
    EBADCSRFTOKEN: {
      title: "Forbidden",
      message: "Your request could not be processed.",
      statusCode: 403,
    },
    404: {
      title: "Not Found",
      message: "The requested resource was not found.",
      statusCode: 404,
    },
  };

  const errorContext = errorContextMap[code || statusCode] || {
    title: `Error ${statusCode}`,
    message: "An unexpected error occurred. Please try again later.",
    statusCode,
  };
  const isProd = process.env.NODE_ENV == "production";
  const context = {
    title: errorContext.title,
    message: isProd ? errorContext.message : message,
    content: isProd
      ? ""
      : {
          requestId,
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode,
          headers: req.headers,
          query: req.query,
          body: req.body,
          ip: req.ip || req.connection?.remoteAddress,
          stack,
        },
  };

  if (process.env.NODE_ENV === "production") {
    res.redirect(`/error?code=${errorContext.statusCode}`);
  } else {
    const errorPageContext = await getBaseContext(context);
    res.status(errorContext.statusCode).render("pages/error", errorPageContext);
  }
};
