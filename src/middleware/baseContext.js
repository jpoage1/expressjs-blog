// src/middleware/baseContext.js
const getBaseContext = require("../utils/baseContext");

module.exports = async function baseContextMiddleware(req, res, next) {
  const isAuthenticated = req.isAuthenticated;

  const scheme = req.protocol;
  const host = req.get("host");
  const requestUri = req.originalUrl;
  const rd = `${scheme}://${host}${requestUri}`;

  const adminLoginUrl = `${process.env.AUTH_LOGIN}${encodeURIComponent(rd)}`;

  const baseContext = await getBaseContext(isAuthenticated, { adminLoginUrl });
  res.locals.baseContext = baseContext;

  res.renderWithBaseContext = (template, overrides = {}) => {
    res.render(template, Object.assign({}, baseContext, overrides));
  };

  next();
};
