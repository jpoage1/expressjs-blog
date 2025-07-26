// src/utils/SecurityEvent.js
const fs = require("fs").promises;
const path = require("path");
const HttpError = require("./HttpError");
const { winstonLogger } = require("./logging");
const { captureSecurityData } = require("./securityForensics");

const EVENT_TYPES = {
  // Validation Events
  VALIDATION_FAILURE: {
    message: "Input validation failed",
    statusCode: 400,
    level: "warning",
    category: "validation",
  },
  INVALID_INPUT: {
    message: "Invalid input provided",
    statusCode: 400,
    level: "warning",
    category: "validation",
  },

  // Authentication Events
  INVALID_TOKEN: {
    message: "Invalid or expired token",
    statusCode: 401,
    level: "warning",
    category: "auth",
  },
  AUTH_FAILURE: {
    message: "Authentication failed",
    statusCode: 401,
    level: "warning",
    category: "auth",
  },

  // CAPTCHA Events
  MISSING_CAPTCHA: {
    message: "CAPTCHA token missing from submission",
    statusCode: 400,
    level: "info",
    category: "captcha",
  },
  CAPTCHA_FAILED: {
    message: "CAPTCHA verification failed",
    statusCode: 403,
    level: "warning",
    category: "captcha",
  },

  // Threat Events
  THREAT_BLOCKED: {
    message: "Submission blocked due to high threat level",
    statusCode: 403,
    level: "critical",
    category: "threat",
  },
  SUSPICIOUS_ACTIVITY: {
    message: "Suspicious activity detected",
    statusCode: 403,
    level: "warning",
    category: "threat",
  },

  // Success Events
  CONTACT_SUCCESS: {
    message: "Contact form submitted successfully",
    statusCode: 200,
    level: "info",
    category: "success",
  },
  PAGE_ACCESS: {
    message: "Page accessed",
    statusCode: 200,
    level: "info",
    category: "access",
  },

  // Error Events
  CONTACT_ERROR: {
    message: "Error processing contact form",
    statusCode: 500,
    level: "error",
    category: "error",
  },
  SYSTEM_ERROR: {
    message: "System error occurred",
    statusCode: 500,
    level: "error",
    category: "error",
  },
};
class SecurityEvent extends HttpError {
  constructor(eventType, metadata = {}, options = {}) {
    // Handle both string event types and direct metadata for backwards compatibility
    let actualEventType, actualMetadata;

    if (typeof eventType === "string" && EVENT_TYPES[eventType.toUpperCase()]) {
      actualEventType = eventType.toUpperCase();
      actualMetadata = metadata;
    } else if (typeof eventType === "string") {
      // Legacy support - treat as custom event
      actualEventType = "CUSTOM_EVENT";
      actualMetadata = { customEventType: eventType, ...metadata };
    } else {
      // If first param is metadata, treat as generic security event
      actualEventType = "SYSTEM_ERROR";
      actualMetadata = eventType || {};
    }

    const eventConfig =
      EVENT_TYPES[actualEventType] || EVENT_TYPES.SYSTEM_ERROR;

    super(eventConfig.message, eventConfig.statusCode, actualMetadata);

    this.name = "SecurityEvent";
    this.eventType = actualEventType;
    this.level = eventConfig.level;
    this.category = eventConfig.category;
    this.timestamp = new Date().toISOString();
    this.cause = options.cause || null;
    this.autoLog = options.autoLog !== false; // Default to true

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SecurityEvent);
    }

    // Auto-log unless explicitly disabled
    if (this.autoLog) {
      this.log();
    }
  }

  /**
   * Log this security event
   */
  log(additionalContext = {}) {
    const logData = {
      eventType: this.eventType,
      level: this.level,
      category: this.category,
      message: this.message,
      timestamp: this.timestamp,
      metadata: this.metadata,
      ...additionalContext,
    };

    winstonLogger.security(logData);

    // Handle high-threat events with special logging
    if (
      this.level === "critical" ||
      this.metadata.threatAnalysis?.level === "high"
    ) {
      this._logHighThreatEvent(logData);
    }
  }

  /**
   * Create and log a security event in one call
   */
  static create(eventType, metadata = {}, options = {}) {
    return new SecurityEvent(eventType, metadata, options);
  }

  /**
   * Create and log a security event from a request context
   */
  static fromRequest(req, eventType, additionalData = {}, options = {}) {
    const securityData = captureSecurityData(req, additionalData);
    return new SecurityEvent(eventType, securityData, options);
  }

  /**
   * Log a security event without creating an error (for success events)
   */
  static async logEvent(eventType, metadata = {}, additionalContext = {}) {
    try {
      const eventConfig =
        EVENT_TYPES[eventType.toUpperCase()] || EVENT_TYPES.SYSTEM_ERROR;

      const logEntry = {
        eventType: eventType.toUpperCase(),
        level: eventConfig.level,
        category: eventConfig.category,
        message: eventConfig.message,
        timestamp: new Date().toISOString(),
        metadata,
        ...additionalContext,
      };

      winstonLogger.security(logEntry);

      // Handle high-threat events
      if (
        eventConfig.level === "critical" ||
        metadata.threatAnalysis?.level === "high"
      ) {
        await SecurityEvent._logHighThreatEvent(logEntry);
      }

      return logEntry;
    } catch (error) {
      winstonLogger.error(`Failed to log security event: ${error.message}`);
    }
  }

  /**
   * Log page access events
   */
  static async logAccess(req, pageData = {}, additionalData = {}) {
    const securityData = captureSecurityData(req, {
      pageAccess: pageData,
      processingStep: "page_render",
      ...additionalData,
    });

    return await SecurityEvent.logEvent("PAGE_ACCESS", securityData);
  }

  /**
   * Create a SecurityEvent from any error
   */
  static fromError(
    error,
    eventType = "SYSTEM_ERROR",
    additionalMetadata = {},
    options = {}
  ) {
    if (error instanceof SecurityEvent) {
      return error;
    }

    const metadata = {
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalMetadata,
    };

    return new SecurityEvent(eventType, metadata, {
      cause: error,
      ...options,
    });
  }

  /**
   * Handle validation failures with consistent logging
   */
  static handleValidationFailure(req, formData, reason, next) {
    const securityData = captureSecurityData(req, {
      formData,
      failureReason: reason,
      processingStep: "validation",
    });

    const securityEvent = new SecurityEvent("VALIDATION_FAILURE", securityData);
    next(securityEvent);
  }

  /**
   * Handle CAPTCHA failures
   */
  static handleCaptchaFailure(req, reason, threatAnalysis = null, next) {
    const securityData = captureSecurityData(req, {
      failureReason: reason,
      threatAnalysis,
      processingStep: "captcha_validation",
    });

    const securityEvent = new SecurityEvent("CAPTCHA_FAILED", securityData);
    next(securityEvent);
  }

  /**
   * Handle threat blocking
   */
  static async blockThreat(
    req,
    threatAnalysis,
    reason = "high_threat_detected"
  ) {
    const securityData = captureSecurityData(req, {
      threatAnalysis,
      action: "blocked",
      blockReason: reason,
      processingStep: "threat_analysis",
    });

    return new SecurityEvent("THREAT_BLOCKED", securityData);
  }

  /**
   * Private method to handle high-threat event logging
   */
  static async _logHighThreatEvent(logEntry) {
    try {
      const date = new Date().toISOString().split("T")[0];
      const logDir = path.join(__dirname, "..", "..", "logs", "security");
      await fs.mkdir(logDir, { recursive: true });

      const alertFile = path.join(logDir, `high_threat_${date}.log`);
      const message = JSON.stringify(logEntry, null, 2);
      await fs.appendFile(alertFile, message + "\n");
    } catch (error) {
      winstonLogger.error(`Failed to log high-threat event: ${error.message}`);
    }
  }

  /**
   * Instance method for high-threat logging
   */
  async _logHighThreatEvent(logEntry) {
    return SecurityEvent._logHighThreatEvent(logEntry);
  }

  /**
   * Convert to JSON for serialization
   */
  toJSON() {
    return {
      name: this.name,
      eventType: this.eventType,
      level: this.level,
      category: this.category,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      metadata: this.metadata,
      stack: this.stack,
      cause:
        this.cause instanceof Error
          ? {
              name: this.cause.name,
              message: this.cause.message,
              stack: this.cause.stack,
            }
          : this.cause,
    };
  }

  /**
   * Check if this is a specific type of security event
   */
  isType(eventType) {
    return this.eventType === eventType.toUpperCase();
  }

  /**
   * Check if this is in a specific category
   */
  isCategory(category) {
    return this.category === category.toLowerCase();
  }

  /**
   * Check if this is a critical event
   */
  isCritical() {
    return this.level === "critical";
  }
}

module.exports = SecurityEvent;
