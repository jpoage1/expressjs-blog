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
        url: req.url,
      })
    );
  } else {
    console.error(err);
  }

  res.status(statusCode).render("pages/error", {
    statusCode,
    message,
    content: "", // remove markdown HTML injection, keep content empty or static partial if needed
  });
};
