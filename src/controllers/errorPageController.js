// src/routes/errorPage
const { getErrorContext } = require("../utils/errorContext");

module.exports = async (req, res) => {
  const code = req.params.code || parseInt(req.query.code, 10) || 500;
  const errorContext = getErrorContext(code);

  const context = {
    title: errorContext.title,
    message: errorContext.message,
    statusCode: errorContext.statusCode,
    content: "",
  };

  res.status(errorContext.statusCode);
  res.renderGenericMessage(context);
};
