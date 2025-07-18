// src/middleware/baseContext.js
const getBaseContext = require("../utils/baseContext");
const { qualifyLink } = require("../utils/qualifyLinks");
const { generateToken } = require("../utils/adminToken");

module.exports = async function baseContextMiddleware(req, res, next) {
  const isAuthenticated = req.isAuthenticated;
  const token = generateToken();
  const adminLoginUrl = qualifyLink(`/${token}`);

  const baseContext = await getBaseContext(isAuthenticated, { adminLoginUrl });
  res.locals.baseContext = baseContext;

  res.renderWithBaseContext = (template, overrides = {}) => {
    res.render(template, Object.assign({}, baseContext, overrides));
  };

  res.renderGenericMessage = (overrides = {}) => {
    res.render(
      "pages/generic-message",
      Object.assign({}, baseContext, overrides)
    );
  };

  next();
};
