const getBaseContext = require("../utils/baseContext");
module.exports = async (req, res) => {
  const code = parseInt(req.query.code, 10) || 500;

  const errorContextMap = {
    403: {
      title: "Forbidden",
      message: "Your request could not be processed.",
    },
    404: {
      title: "Not Found",
      message: "The requested resource was not found.",
    },
    500: {
      title: "Server Error",
      message: "An unexpected error occurred. Please try again later.",
    },
  };

  const errorContext = errorContextMap[code] || errorContextMap[500];

  const context = await getBaseContext({
    title: errorContext.title,
    message: errorContext.message,
    statusCode: code,
    content: "",
  });

  res.status(code).render("pages/error", context);
};
