// src/routes/errorPage
const getBaseContext = require("../utils/baseContext");
const { getErrorContext } = require("../utils/errorContext");

module.exports = async (req, res) => {
  const code = parseInt(req.query.code, 10) || 500;
  const errorContext = getErrorContext(code);

  const context = await getBaseContext({
    title: errorContext.title,
    message: errorContext.message,
    statusCode: errorContext.statusCode,
    content: "",
  });

  res.status(errorContext.statusCode).render("pages/error", context);
};
