const path = require("path");
const fs = require("fs/promises");
const marked = require("marked");

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

  // Render markdown error page or fallback text
  try {
    const markdownPath = path.resolve(__dirname, "../views/error.md");
    const mdContent = await fs.readFile(markdownPath, "utf-8");
    const htmlContent = marked(mdContent.replace("{{message}}", message));

    res
      .status(statusCode)
      .render("error", { content: htmlContent, statusCode, message });
  } catch {
    // fallback plain HTML if markdown or template fails
    res.status(statusCode).render("error", {
      content: `<h1>Error ${statusCode}</h1><p>${message}</p>`,
      statusCode,
      message,
    });
  }
};
