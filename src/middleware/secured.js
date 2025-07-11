const HttpError = require("../utils/HttpError")

module.exports = (req, res, next) => {
    if (!req.isAuthenticated) {
        next(new HttpError({statusCode: 404}))
    }
    next()
}
