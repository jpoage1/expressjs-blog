const fs = require("fs");
const path = require("path");
const { winstonLogger } = require("./logging");

const logDir = path.join(__dirname, "../../logs");

class LogManager {
  constructor(logDir, options = {}) {
    this.logDir = logDir;
    this.serverStart = Date.now();
    this.isDevelopment = process.env.NODE_ENV !== "production";

    // Configurable thresholds
    this.config = {
      development: {
        maxSessionCount: 25, // Fewer sessions in dev
        sessionRetentionHours: 1, // Very short retention
        maxTotalSizeMB: 50, // Small disk footprint
        maxDiskUsagePercent: 85, // Panic threshold
        cleanupIntervalMinutes: 15, // Frequent cleanup
        emergencyCleanupRatio: 0.7, // Keep only 30% newest in emergency
      },
      production: {
        maxSessionCount: 100,
        sessionRetentionHours: 24,
        maxTotalSizeMB: 200,
        maxDiskUsagePercent: 90,
        cleanupIntervalMinutes: 60,
        emergencyCleanupRatio: 0.5,
      },
      ...options, // Allow override
    };

    this.currentConfig = this.isDevelopment
      ? this.config.development
      : this.config.production;
    this.lastCleanupFile = path.join(logDir, ".last-cleanup");
    this.metricsFile = path.join(logDir, ".cleanup-metrics");

    winstonLogger.info(
      `LogManager initialized for ${this.isDevelopment ? "development" : "production"}`
    );
    winstonLogger.info(`Config:`, this.currentConfig);
  }

  // Main cleanup orchestrator
  cleanup(force = false) {
    try {
      const metrics = this.getMetrics();
      winstonLogger.info(`\n=== Log Cleanup Started ===`);
      winstonLogger.info(`Current sessions: ${metrics.sessionCount}`);
      winstonLogger.info(`Total size: ${metrics.totalSizeMB.toFixed(2)}MB`);
      winstonLogger.info(`Disk usage: ${metrics.diskUsagePercent.toFixed(1)}%`);

      // Emergency cleanup if disk is critically full
      if (metrics.diskUsagePercent > this.currentConfig.maxDiskUsagePercent) {
        winstonLogger.info(`🚨 EMERGENCY CLEANUP: Disk usage critical!`);
        return this.emergencyCleanup();
      }

      // Size-based cleanup if total size exceeded
      if (metrics.totalSizeMB > this.currentConfig.maxTotalSizeMB) {
        winstonLogger.info(`📦 SIZE-BASED CLEANUP: Total size exceeded`);
        return this.sizeLimitedCleanup();
      }

      // Regular cleanup if time-based or forced
      if (force || this.shouldRunRegularCleanup()) {
        winstonLogger.info(`🕒 REGULAR CLEANUP: Time-based maintenance`);
        return this.regularCleanup();
      }

      winstonLogger.info(`✅ No cleanup needed`);
      return { cleaned: false, reason: "thresholds not met" };
    } catch (error) {
      winstonLogger.error(`❌ Cleanup failed:`, error);
      return { cleaned: false, error: error.message };
    }
  }

  // Get current metrics
  getMetrics() {
    const sessionsDir = path.join(this.logDir, "sessions");
    if (!fs.existsSync(sessionsDir)) {
      return {
        sessionCount: 0,
        totalSizeMB: 0,
        diskUsagePercent: 0,
        sessions: [],
      };
    }

    const sessions = this.getSessionsWithMetadata();
    const totalSize = this.calculateDirectorySize(sessionsDir);
    const diskUsage = this.getDiskUsage();

    return {
      sessionCount: sessions.length,
      totalSizeMB: totalSize / (1024 * 1024),
      diskUsagePercent: diskUsage,
      sessions: sessions,
    };
  }

  // Get sessions with rich metadata
  getSessionsWithMetadata() {
    const sessionsDir = path.join(this.logDir, "sessions");
    if (!fs.existsSync(sessionsDir)) return [];

    return fs
      .readdirSync(sessionsDir)
      .map((sessionFolder) => {
        const sessionPath = path.join(sessionsDir, sessionFolder);
        try {
          if (!fs.statSync(sessionPath).isDirectory()) return null;

          const files = fs.readdirSync(sessionPath);
          let latestMtime = 0;
          let totalSize = 0;

          files.forEach((file) => {
            const filePath = path.join(sessionPath, file);
            const stat = fs.statSync(filePath);
            latestMtime = Math.max(latestMtime, stat.mtimeMs);
            totalSize += stat.size;
          });

          const ageHours = (Date.now() - latestMtime) / (1000 * 60 * 60);

          return {
            folder: sessionFolder,
            path: sessionPath,
            latestMtime,
            ageHours,
            sizeMB: totalSize / (1024 * 1024),
            fileCount: files.length,
            isCurrentSession: latestMtime >= this.serverStart,
            isStale: ageHours > this.currentConfig.sessionRetentionHours,
          };
        } catch (error) {
          winstonLogger.warn(
            `Error processing session ${sessionFolder}:`,
            error.message
          );
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.latestMtime - a.latestMtime); // Newest first
  }

  // Emergency cleanup - keep only newest sessions
  emergencyCleanup() {
    const sessions = this.getSessionsWithMetadata();
    const keepCount = Math.floor(
      sessions.length * this.currentConfig.emergencyCleanupRatio
    );
    const sessionsToDelete = sessions.slice(keepCount);

    winstonLogger.info(
      `Keeping ${keepCount} newest sessions, deleting ${sessionsToDelete.length}`
    );

    let deletedCount = 0;
    let freedMB = 0;

    sessionsToDelete.forEach((session) => {
      if (this.deleteSession(session)) {
        deletedCount++;
        freedMB += session.sizeMB;
      }
    });

    this.updateMetrics({ deletedCount, freedMB, type: "emergency" });
    return { cleaned: true, type: "emergency", deletedCount, freedMB };
  }

  // Size-limited cleanup - delete until under threshold
  sizeLimitedCleanup() {
    const sessions = this.getSessionsWithMetadata();
    const targetSizeMB = this.currentConfig.maxTotalSizeMB * 0.8; // Clean to 80% of limit

    let currentSizeMB = sessions.reduce((sum, s) => sum + s.sizeMB, 0);
    let deletedCount = 0;
    let freedMB = 0;

    // Delete oldest first until we're under the target
    for (
      let i = sessions.length - 1;
      i >= 0 && currentSizeMB > targetSizeMB;
      i--
    ) {
      const session = sessions[i];
      if (!session.isCurrentSession) {
        if (this.deleteSession(session)) {
          deletedCount++;
          freedMB += session.sizeMB;
          currentSizeMB -= session.sizeMB;
        }
      }
    }

    this.updateMetrics({ deletedCount, freedMB, type: "size-limited" });
    return { cleaned: true, type: "size-limited", deletedCount, freedMB };
  }

  // Regular cleanup - age and count based
  regularCleanup() {
    const sessions = this.getSessionsWithMetadata();
    let deletedCount = 0;
    let freedMB = 0;

    sessions.forEach((session, index) => {
      const shouldDeleteByAge = !session.isCurrentSession && session.isStale;
      const shouldDeleteByCount = index >= this.currentConfig.maxSessionCount;

      if (shouldDeleteByAge || shouldDeleteByCount) {
        if (this.deleteSession(session)) {
          deletedCount++;
          freedMB += session.sizeMB;

          const reason = shouldDeleteByAge
            ? `age (${session.ageHours.toFixed(1)}h)`
            : "count limit";
          winstonLogger.info(
            `  Deleted ${session.folder} - ${reason} - ${session.sizeMB.toFixed(2)}MB`
          );
        }
      }
    });

    this.updateLastCleanup();
    this.updateMetrics({ deletedCount, freedMB, type: "regular" });
    return { cleaned: true, type: "regular", deletedCount, freedMB };
  }

  // Helper methods
  deleteSession(session) {
    try {
      fs.rmSync(session.path, { recursive: true, force: true });
      return true;
    } catch (error) {
      winstonLogger.error(`Failed to delete ${session.path}:`, error.message);
      return false;
    }
  }

  shouldRunRegularCleanup() {
    try {
      const lastCleanup = fs.readFileSync(this.lastCleanupFile, "utf8");
      const timeSinceLastCleanup = Date.now() - parseInt(lastCleanup);
      const cleanupInterval =
        this.currentConfig.cleanupIntervalMinutes * 60 * 1000;
      return timeSinceLastCleanup > cleanupInterval;
    } catch {
      return true; // First run
    }
  }

  updateLastCleanup() {
    fs.writeFileSync(this.lastCleanupFile, Date.now().toString());
  }

  updateMetrics(data) {
    const metrics = {
      timestamp: new Date().toISOString(),
      environment: this.isDevelopment ? "development" : "production",
      ...data,
    };

    // Append to metrics log
    const logLine = JSON.stringify(metrics) + "\n";
    fs.appendFileSync(this.metricsFile, logLine);
  }

  calculateDirectorySize(dirPath) {
    let totalSize = 0;

    const calculateSize = (itemPath) => {
      try {
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          fs.readdirSync(itemPath).forEach((item) =>
            calculateSize(path.join(itemPath, item))
          );
        } else {
          totalSize += stat.size;
        }
      } catch (error) {
        // Skip inaccessible files
      }
    };

    if (fs.existsSync(dirPath)) {
      calculateSize(dirPath);
    }

    return totalSize;
  }

  getDiskUsage() {
    try {
      const stats = fs.statSync(this.logDir);
      // This is a simplified version - in production you might want to use a library
      // like 'diskusage' or 'statvfs' for accurate disk space calculation
      return 0; // Placeholder - implement based on your system
    } catch {
      return 0;
    }
  }

  // Utility method to show current status
  status() {
    const metrics = this.getMetrics();
    winstonLogger.info(`\n=== Log Manager Status ===`);
    winstonLogger.info(
      `Environment: ${this.isDevelopment ? "development" : "production"}`
    );
    winstonLogger.info(
      `Sessions: ${metrics.sessionCount} (max: ${this.currentConfig.maxSessionCount})`
    );
    winstonLogger.info(
      `Total size: ${metrics.totalSizeMB.toFixed(2)}MB (max: ${this.currentConfig.maxTotalSizeMB}MB)`
    );
    winstonLogger.info(
      `Retention: ${this.currentConfig.sessionRetentionHours}h`
    );

    if (metrics.sessions.length > 0) {
      const oldest = metrics.sessions[metrics.sessions.length - 1];
      const newest = metrics.sessions[0];
      winstonLogger.info(
        `Oldest session: ${oldest.ageHours.toFixed(1)}h old (${oldest.sizeMB.toFixed(2)}MB)`
      );
      winstonLogger.info(
        `Newest session: ${newest.ageHours.toFixed(1)}h old (${newest.sizeMB.toFixed(2)}MB)`
      );
    }

    return metrics;
  }
}

// Usage:
const logManager = new LogManager(logDir, {
  // Optional custom config overrides
  development: {
    maxSessionCount: 15, // Even more aggressive for your dev setup
    sessionRetentionHours: 0.5, // 30 minutes
  },
});

// Call this on server start
function cleanupOldSessions() {
  return logManager.cleanup();
}

// Export for use in other modules
module.exports = { LogManager, cleanupOldSessions };
