const fs = require("fs").promises;
const path = require("path");
const { diskSpaceMonitor } = require("../../utils/logging");

exports.requireAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: "Admin access required" });
  }
};

exports.getDiskSpaceStatus = diskSpaceMonitor.getStatusEndpoint();
exports.manualDiskCleanup = diskSpaceMonitor.manualCleanupEndpoint();

exports.getDiskSpaceConfig = (req, res) => {
  res.json({
    success: true,
    data: {
      thresholds: {
        warning: diskSpaceMonitor.options.warningThreshold,
        critical: diskSpaceMonitor.options.criticalThreshold,
        emergency: diskSpaceMonitor.options.emergencyThreshold,
      },
      cleanup: {
        normalCleanupDays: diskSpaceMonitor.options.normalCleanupDays,
        warningCleanupDays: diskSpaceMonitor.options.warningCleanupDays,
        criticalCleanupDays: diskSpaceMonitor.options.criticalCleanupDays,
        emergencyCleanupDays: diskSpaceMonitor.options.emergencyCleanupDays,
      },
      monitoring: {
        interval: diskSpaceMonitor.options.monitoringInterval,
        maxLogDirectorySize: diskSpaceMonitor.options.maxLogDirectorySize,
      },
    },
  });
};

exports.updateDiskSpaceConfig = (req, res) => {
  try {
    const { thresholds, cleanup, monitoring } = req.body;

    if (thresholds) Object.assign(diskSpaceMonitor.options, thresholds);
    if (cleanup) Object.assign(diskSpaceMonitor.options, cleanup);
    if (monitoring) {
      Object.assign(diskSpaceMonitor.options, monitoring);
      diskSpaceMonitor.startMonitoring();
    }

    res.json({
      success: true,
      message: "Configuration updated successfully",
      data: diskSpaceMonitor.options,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update configuration",
      details: error.message,
    });
  }
};

exports.getLogDirectoryContents = async (req, res) => {
  try {
    const logDir = path.join(__dirname, "..", "..", "logs");

    const getDirectoryInfo = async (dir) => {
      const items = await fs.readdir(dir);
      const info = [];

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);

        info.push({
          name: item,
          type: stats.isDirectory() ? "directory" : "file",
          size: stats.size,
          modified: stats.mtime,
          relativePath: path.relative(logDir, itemPath),
        });
      }

      return info.sort((a, b) => b.modified - a.modified);
    };

    const contents = await getDirectoryInfo(logDir);
    res.json({ success: true, data: contents });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get log directory contents",
      details: error.message,
    });
  }
};
