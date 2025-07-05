// src/csrfToken.js
const router = require("express").Router();
const cookieParser = require("cookie-parser");

const csrf = require("csurf");

router.use(cookieParser());
router.use(csrf({ cookie: true }));
router.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
module.exports = router;
