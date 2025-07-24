// utils/diskSpaceMonitor.js
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const statvfs = promisify(require("statvfs"));
const { winstonLogger } = require("./logging");

class DiskSpaceMonitor {
  constructor(logDir, options = {}) {
    this.logDir = logDir;
    this.options = {
      // Disk space thresholds (in GB)
      warningThreshold: options.warningThreshold || 5,
      criticalThreshold: options.criticalThreshold || 2,
      emergencyThreshold: options.emergencyThreshold || 1,

      // Cleanup policies
      normalCleanupDays: options.normalCleanupDays || 30,
      warningCleanupDays: options.warningCleanupDays || 14,
      criticalCleanupDays: options.criticalCleanupDays || 7,
      emergencyCleanupDays: options.emergencyCleanupDays || 3,

      // Monitoring interval (in minutes)
      monitoringInterval: options.monitoringInterval || 30,

      // Maximum log directory size (in GB)
      maxLogDirectorySize: options.maxLogDirectorySize || 10,
    };

    this.monitoringTimer = null;
    this.lastCleanupTime = null;
    this.diskSpaceStatus = {
      availableGB: 0,
      usedGB: 0,
      logDirectorySizeGB: 0,
      status: "normal", // normal, warning, critical, emergency
      lastCheck: null,
      autoCleanupPerformed: false,
    };
  }

  async getDiskSpace() {
    try {
      const stats = await statvfs(this.logDir);
      const blockSize = stats.f_frsize || stats.f_bsize;
      const totalBytes = stats.f_blocks * blockSize;
      const freeBytes = stats.f_bavail * blockSize;
      const usedBytes = totalBytes - freeBytes;

      return {
        totalGB: totalBytes / 1024 ** 3,
        freeGB: freeBytes / 1024 ** 3,
        usedGB: usedBytes / 1024 ** 3,
      };
    } catch (error) {
      winstonLogger.error("Error getting disk space:", error);
      return null;
    }
  }

  async getDirectorySize(dir) {
    let size = 0;

    const calculateSize = async (currentDir) => {
      try {
        const items = await fs.promises.readdir(currentDir);

        for (const item of items) {
          const itemPath = path.join(currentDir, item);
          const stats = await fs.promises.stat(itemPath);

          if (stats.isDirectory()) {
            await calculateSize(itemPath);
          } else {
            size += stats.size;
          }
        }
      } catch (error) {
        winstonLogger.error(`Error calculating size for ${currentDir}:`, error);
      }
    };

    await calculateSize(dir);
    return size / 1024 ** 3; // Convert to GB
  }

  async checkDiskSpace() {
    const diskSpace = await this.getDiskSpace();
    if (!diskSpace) return this.diskSpaceStatus;

    const logDirectorySize = await this.getDirectorySize(this.logDir);

    this.diskSpaceStatus = {
      availableGB: diskSpace.freeGB,
      usedGB: diskSpace.usedGB,
      logDirectorySizeGB: logDirectorySize,
      lastCheck: new Date().toISOString(),
      autoCleanupPerformed: false,
    };

    // Determine status based on available space
    if (diskSpace.freeGB <= this.options.emergencyThreshold) {
      this.diskSpaceStatus.status = "emergency";
      await this.performEmergencyCleanup();
    } else if (diskSpace.freeGB <= this.options.criticalThreshold) {
      this.diskSpaceStatus.status = "critical";
      await this.performCleanup(this.options.criticalCleanupDays);
    } else if (diskSpace.freeGB <= this.options.warningThreshold) {
      this.diskSpaceStatus.status = "warning";
      await this.performCleanup(this.options.warningCleanupDays);
    } else if (logDirectorySize > this.options.maxLogDirectorySize) {
      this.diskSpaceStatus.status = "warning";
      await this.performCleanup(this.options.warningCleanupDays);
    } else {
      this.diskSpaceStatus.status = "normal";
    }

    return this.diskSpaceStatus;
  }

  async performCleanup(retentionDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedFiles = 0;
    let freedSpace = 0;

    // Clean up session directories
    const sessionsDir = path.join(this.logDir, "sessions");
    if (fs.existsSync(sessionsDir)) {
      const sessions = await fs.promises.readdir(sessionsDir);

      for (const sessionFolder of sessions) {
        const sessionPath = path.join(sessionsDir, sessionFolder);
        const stats = await fs.promises.stat(sessionPath);

        if (stats.isDirectory() && stats.mtime < cutoffDate) {
          const sizeBeforeDelete = await this.getDirectorySize(sessionPath);
          await fs.promises.rm(sessionPath, { recursive: true, force: true });
          freedSpace += sizeBeforeDelete;
          deletedFiles++;
        }
      }
    }

    // Clean up old log files in other directories
    const logDirectories = [
      "info",
      "error",
      "warn",
      "debug",
      "notice",
      "functions",
    ];

    for (const dir of logDirectories) {
      const dirPath = path.join(this.logDir, dir);
      if (fs.existsSync(dirPath)) {
        const files = await fs.promises.readdir(dirPath);

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = await fs.promises.stat(filePath);

          if (stats.isFile() && stats.mtime < cutoffDate) {
            freedSpace += stats.size / 1024 ** 3;
            await fs.promises.unlink(filePath);
            deletedFiles++;
          }
        }
      }
    }

    this.lastCleanupTime = new Date().toISOString();
    this.diskSpaceStatus.autoCleanupPerformed = true;

    winstonLogger.warn(
      `Cleanup completed: ${deletedFiles} files/directories deleted, ${freedSpace.toFixed(2)} GB freed`
    );
    return { deletedFiles, freedSpace };
  }

  async performEmergencyCleanup() {
    winstonLogger.warn("Performing emergency cleanup...");

    // More aggressive cleanup - keep only last 24 hours of logs
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    const result = await this.performCleanup(1);

    // If still not enough space, remove function logs
    const diskSpace = await this.getDiskSpace();
    if (diskSpace && diskSpace.freeGB <= this.options.emergencyThreshold) {
      const functionsDir = path.join(this.logDir, "functions");
      if (fs.existsSync(functionsDir)) {
        await fs.promises.rm(functionsDir, { recursive: true, force: true });
        await fs.promises.mkdir(functionsDir, { recursive: true });
      }
    }

    return result;
  }

  startMonitoring() {
    this.stopMonitoring(); // Stop any existing monitoring

    this.monitoringTimer = setInterval(
      async () => {
        await this.checkDiskSpace();
      },
      this.options.monitoringInterval * 60 * 1000
    ); // Convert minutes to milliseconds

    // Initial check
    this.checkDiskSpace();
  }

  stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  getStatus() {
    return this.diskSpaceStatus;
  }

  // Express middleware for admin notifications
  adminNotificationMiddleware() {
    return async (req, res, next) => {
      if (req.path.startsWith("/admin")) {
        const status = await this.checkDiskSpace();
        res.locals.diskSpaceStatus = status;
      }
      next();
    };
  }

  // API endpoint for status
  getStatusEndpoint() {
    return async (req, res) => {
      try {
        const status = await this.checkDiskSpace();
        res.json({
          success: true,
          data: status,
          thresholds: {
            warning: this.options.warningThreshold,
            critical: this.options.criticalThreshold,
            emergency: this.options.emergencyThreshold,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Failed to get disk space status",
          details: error.message,
        });
      }
    };
  }

  // Manual cleanup endpoint
  manualCleanupEndpoint() {
    return async (req, res) => {
      try {
        const { retentionDays } = req.body;
        const days = retentionDays || this.options.normalCleanupDays;

        const result = await this.performCleanup(days);
        const newStatus = await this.checkDiskSpace();

        res.json({
          success: true,
          cleanup: result,
          newStatus: newStatus,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Failed to perform cleanup",
          details: error.message,
        });
      }
    };
  }
}

module.exports = DiskSpaceMonitor;
