const { HttpError } = require("@jpoage1/errors");

module.exports = (req, res, next) => {
  if (!res.locals.session.isAuthenticated) {
    return next(new HttpError({ statusCode: 404 }));
  }
  next();
};
