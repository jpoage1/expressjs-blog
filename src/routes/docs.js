// src/routes/docs.js
const express = require("express");
const router = express.Router();
const {
  renderDocsIndex,
  renderDocsSummary,
  renderDocsByType,
  renderDocsModule,
} = require("../controllers/docsControllers");

router.get("/", renderDocsIndex);
router.get("/summary", renderDocsSummary);
router.get("/:moduleType", renderDocsByType);
router.get("/:moduleType/:module", renderDocsModule);

module.exports = router;
