// // src/utils/securityForensics.js
const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");
const HttpError = require("../utils/HttpError");

const { winstonLogger } = require("../utils/logging");

// Threat detection patterns
const THREAT_PATTERNS = {
  // Common phishing/spam indicators
  suspiciousKeywords: [
    "verify account",
    "urgent action",
    "suspended account",
    "click here",
    "limited time",
    "act now",
    "confirm identity",
    "update payment",
    "security alert",
    "unusual activity",
  ],

  // Suspicious domains (add known bad actor domains)
  suspiciousDomains: [
    "tempmail.org",
    "10minutemail.com",
    "guerrillamail.com",
    "throwaway.email",
    "temp-mail.org",
  ],

  // Suspicious patterns
  suspiciousPatterns: [
    /https?:\/\/[^\s]+/gi, // URLs in messages
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email addresses
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, // Credit card patterns
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN patterns
  ],
};

// Enhanced forensic data collection (focused on threat detection)
function captureSecurityData(req, additionalData = {}) {
  const timestamp = new Date().toISOString();
  const requestId = crypto.randomUUID();

  // Connection and network data
  const connectionData = {
    ip: req.ip,
    ips: req.ips || [],
    remoteAddress: req.socket?.remoteAddress,
    protocol: req.protocol,
    secure: req.secure,
    hostname: req.hostname,
    originalUrl: req.originalUrl,
    encrypted: req.socket?.encrypted || false,
  };

  // Security-relevant headers
  const securityHeaders = {
    userAgent: req.headers["user-agent"],
    acceptLanguage: req.headers["accept-language"],
    referer: req.headers["referer"],
    origin: req.headers["origin"],
    xForwardedFor: req.headers["x-forwarded-for"],
    xRealIp: req.headers["x-real-ip"],
    host: req.headers["host"],
    // Check for proxy/VPN indicators
    via: req.headers["via"],
    xForwardedProto: req.headers["x-forwarded-proto"],
    cfConnectingIp: req.headers["cf-connecting-ip"], // Cloudflare
    cfIpCountry: req.headers["cf-ipcountry"],
    cfRay: req.headers["cf-ray"],
  };

  // Request timing and patterns
  const requestData = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    timestamp: timestamp,
    requestStart: req._startTime || Date.now(),
    processingTime: Date.now() - (req._startTime || Date.now()),
  };

  // TLS/Security info
  let tlsData = null;
  if (req.socket && req.socket.encrypted) {
    try {
      const cipher = req.socket.getCipher ? req.socket.getCipher() : null;
      tlsData = {
        cipher: cipher,
        tlsVersion: req.socket.getProtocol ? req.socket.getProtocol() : null,
        authorized: req.socket.authorized,
      };
    } catch (err) {
      tlsData = { error: "TLS data unavailable" };
    }
  }

  return {
    requestId,
    timestamp,
    connection: connectionData,
    security: securityHeaders,
    request: requestData,
    tls: tlsData,
    additional: additionalData,
  };
}

// Threat analysis function
function analyzeThreatLevel(formData, securityData) {
  let threatScore = 0;
  const indicators = [];

  // Check message content for suspicious patterns
  const message = formData.message?.toLowerCase() || "";
  const name = formData.name?.toLowerCase() || "";

  // Suspicious keywords in message
  THREAT_PATTERNS.suspiciousKeywords.forEach((keyword) => {
    if (message.includes(keyword.toLowerCase())) {
      threatScore += 3;
      indicators.push(`suspicious_keyword: ${keyword}`);
    }
  });

  const email = formData.email?.toLowerCase() || "";
  // Check for suspicious email domains
  const emailDomain = email.split("@")[1];
  if (emailDomain && THREAT_PATTERNS.suspiciousDomains.includes(emailDomain)) {
    threatScore += 5;
    indicators.push(`suspicious_email_domain: ${emailDomain}`);
  }

  // Check for suspicious patterns in content
  THREAT_PATTERNS.suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(message)) {
      threatScore += 2;
      indicators.push(`suspicious_pattern_${index}`);
    }
  });

  // Check for rapid form submission (potential automation)
  if (securityData.additional.clientData?.formTime < 5000) {
    // Less than 5 seconds
    threatScore += 2;
    indicators.push("rapid_submission");
  }

  // Check for suspicious user agent
  const userAgent = securityData.security.userAgent || "";
  if (!userAgent || userAgent.includes("bot") || userAgent.includes("crawl")) {
    threatScore += 3;
    indicators.push("suspicious_user_agent");
  }

  // Check for missing referer (direct access)
  if (!securityData.security.referer) {
    threatScore += 1;
    indicators.push("no_referer");
  }

  // Determine threat level
  let threatLevel = "low";
  if (threatScore >= 8) threatLevel = "high";
  else if (threatScore >= 4) threatLevel = "medium";

  return {
    score: threatScore,
    level: threatLevel,
    indicators: indicators,
    requiresReview: threatScore >= 4,
  };
}

async function logSecurityEvent(data, eventType = "contact_submission") {
  try {
    const date = new Date().toISOString().split("T")[0];
    const logEntry = {
      eventType,
      ...data,
      loggedAt: new Date().toISOString(),
    };

    // Log security event at custom 'security' level
    winstonLogger.log("security", logEntry);

    // Separate high-threat log file
    if (data.threatAnalysis?.level === "high") {
      const logDir = path.join(__dirname, "..", "..", "logs", "security");
      await fs.mkdir(logDir, { recursive: true });

      const alertFile = path.join(logDir, `high_threat_${date}.log`);
      await fs.appendFile(alertFile, message + "\n");
    }
  } catch (err) {
    // Fail silently or log to error log, depending on requirements
    winstonLogger.error(`Failed to log security event: ${err.message}`);
  }
}

module.exports = {
  captureSecurityData,
  analyzeThreatLevel,
  logSecurityEvent,
};
