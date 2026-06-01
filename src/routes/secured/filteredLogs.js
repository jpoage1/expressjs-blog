const router = require("express").Router();
const { getFilteredLogs } = require("#controllers/filteredLogsController.js");

router.get("/filtered-logs", getFilteredLogs);

module.exports = router;
