// src/routes/errorPage
const getBaseContext = require("../utils/baseContext");
const { getErrorContext } = require("../utils/errorContext");

module.exports = async (req, res) => {
  const code = parseInt(req.query.code, 10) || 500;
  const errorContext = getErrorContext(code);

  const context = {
    title: errorContext.title,
    message: errorContext.message,
    statusCode: errorContext.statusCode,
    content: "",
  };

  res.status(errorContext.statusCode)
  res.renderWithBaseContext("pages/error", context);
};
