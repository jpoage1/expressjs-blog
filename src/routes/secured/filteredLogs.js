const router = require("express").Router();
const { getFilteredLogs } = require("../controllers/filteredLogsController");

router.get("/filtered-logs", getFilteredLogs);

module.exports = router;
