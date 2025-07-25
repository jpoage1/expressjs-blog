// src/routes/admin.
const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminTokenController");

router.get(
  "/:token",
  controller.cleanupTokensMiddleware,
  controller.handleTokenRedirect
);

module.exports = router;
