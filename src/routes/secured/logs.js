const express = require("express");
const router = express.Router();
const controller = require("../../controllers/secured/logsController");

router.get("/logs", controller.renderLogsPage);
router.post("/logs", controller.fetchLogs);
router.post("/logs/analytics", controller.fetchAnalyticsLogs);

module.exports = router;
