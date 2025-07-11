// src/middleware/baseContext.js
const getBaseContext = require("../utils/baseContext");

module.exports = async function baseContextMiddleware(req, res, next) {
  const isAuthenticated = req.isAuthenticated;
  console.log("test remote-user", req.isAuthenticated)
  const baseContext = await getBaseContext(isAuthenticated);
  res.locals.baseContext = baseContext;

  res.renderWithBaseContext = (template, overrides = {}) => {
    res.render(template, Object.assign({}, baseContext, overrides));
  };

  next();
};
