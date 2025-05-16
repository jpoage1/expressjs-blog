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
        url: req.url,
      })
    );
  } else {
    console.error(err);
  }

  const context = await getBaseContext({
    title: statusCode === 404 ? "Not Found" : "Error",
    message,
    statusCode,
    content: "",
  });

  res.status(statusCode).render("pages/error", context);
};
