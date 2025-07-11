module.exports = (req, res, next) => {
    if (!req.isAuthenticated) {
        next()
    }
}
