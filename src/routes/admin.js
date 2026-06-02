// src/routes/admin.
const express = require("express");
const router = express.Router();
const controller = require("@jpoage1/auth");

router.get(
  "/:token",
  controller.cleanupTokensMiddleware,
  controller.handleTokenRedirect,
);

module.exports = router;
