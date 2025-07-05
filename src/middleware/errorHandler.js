const path = require("path");

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
      message: "Your request could not be processed.",
      statusCode: 403,
    },
    404: {
      title: "Not Found",
      message: "The requested resource was not found.",
      statusCode: 404,
    },
  };
  const errorKey = err.code || err.statusCode;
  const defaultErrorContext = {
    title: `Error ${statusCode}`,
    message: "An unexpected error occurred. Please try again later.",
    statusCode,
  };
  const errorContext = errorContextMap[errorKey] || defaultErrorContext;

  res.redirect(`/error?code=${errorContext.statusCode}`);
};
