const path = require("path");
const getBaseContext = require("../utils/baseContext");

module.exports = async (err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? "Internal Server Error";

  if (req?.log?.error) {
    req.log.error(
      JSON.stringify({
        message,
        stack: err.stack || "No stack trace available",
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        code: err.code || null,
      })
    );
  } else {
    console.error(err);
  }
  const errorContextMap = {
    EBADCSRFTOKEN: {
      title: "Forbidden",
      message:
        "Invalid CSRF token. Your request was blocked for security reasons.",
      statusCode: 403,
    },
    404: {
      title: "Not Found",
      message: "The requested resource was not found.",
      statusCode: 404,
    },
  };
  const errorKey = err.code || err.statusCode;
  const errorContext = errorContextMap[errorKey] || {
    title: "Error",
    message,
    statusCode,
  };

  const context = await getBaseContext({
    title: errorContext.title,
    message: errorContext.message,
    statusCode: errorContext.statusCode,
    content: "",
  });

  res.status(errorContext.statusCode).render("pages/error", context);
};
