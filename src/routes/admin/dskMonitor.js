const express = require("express");
const router = express.Router();
const controller = require("../controllers/admin/diskSpaceController");
const { diskSpaceMonitor } = require("../../utils/logging");

router.use(controller.requireAdmin);
router.use(diskSpaceMonitor.adminNotificationMiddleware());

router.get("/disk-space/status", controller.getDiskSpaceStatus);
router.post("/disk-space/cleanup", controller.manualDiskCleanup);
router.get("/disk-space/config", controller.getDiskSpaceConfig);
router.put("/disk-space/config", controller.updateDiskSpaceConfig);
router.get("/logs/directory", controller.getLogDirectoryContents);

module.exports = router;
