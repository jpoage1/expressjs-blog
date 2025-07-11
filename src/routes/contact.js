// // src/routes/contact.js
// const express = require("express");
// const router = express.Router();
// const sendContactMail = require("../utils/sendContactMail");
// const getBaseContext = require("../utils/baseContext");
// const formLimiter = require("../utils/formLimiter");
// const verifyHCaptcha = require("../utils/verifyHCaptcha");

// router.post("/contact", formLimiter, async (req, res, next) => {
//   try {
//     const { name, email, message, hcaptchaToken } = req.body;
//     if (!hcaptchaToken) {
//       return res.status(400).send("Captcha token missing");
//     }
//     const valid = await verifyHCaptcha(hcaptchaToken);
//     if (!valid) {
//       return res.status(400).send("Captcha verification failed");
//     }
//     await sendContactMail({ name, email, message });
//     res.redirect("/contact/thankyou");
//   } catch (err) {
//     next(err);
//   }
// });

// router.get("/contact", async (req, res) => {
//   const context = await getBaseContext({
//     csrfToken: res.locals.csrfToken,
//     title: "Contact",
//   });
//   res.render("pages/contact.handlebars", context);
// });

// router.get("/contact/thankyou", async (req, res) => {
//   const context = await getBaseContext({
//     title: "Thank You",
//   });
//   res.render("pages/thankyou.handlebars", context);
// });

// module.exports = router;
// src/routes/contact.js
const express = require("express");
const router = express.Router();
const sendContactMail = require("../utils/sendContactMail");
const getBaseContext = require("../utils/baseContext");
const formLimiter = require("../utils/formLimiter");
const verifyHCaptcha = require("../utils/verifyHCaptcha");
const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");
const HttpError = require("../utils/HttpError");
const { baseUrl } = require("../utils/baseUrl");
const { qualifyLink } = require("../utils/qualifyLinks");

// Threat detection patterns
const THREAT_PATTERNS = {
  // Common phishing/spam indicators
  suspiciousKeywords: [
    'verify account', 'urgent action', 'suspended account', 'click here',
    'limited time', 'act now', 'confirm identity', 'update payment',
    'security alert', 'unusual activity'
  ],
  
  // Suspicious domains (add known bad actor domains)
  suspiciousDomains: [
    'tempmail.org', '10minutemail.com', 'guerrillamail.com',
    'throwaway.email', 'temp-mail.org'
  ],
  
  // Suspicious patterns
  suspiciousPatterns: [
    /https?:\/\/[^\s]+/gi, // URLs in messages
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email addresses
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, // Credit card patterns
    /\b\d{3}-\d{2}-\d{4}\b/g // SSN patterns
  ]
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
    encrypted: req.socket?.encrypted || false
  };

  // Security-relevant headers
  const securityHeaders = {
    userAgent: req.headers['user-agent'],
    acceptLanguage: req.headers['accept-language'],
    referer: req.headers['referer'],
    origin: req.headers['origin'],
    xForwardedFor: req.headers['x-forwarded-for'],
    xRealIp: req.headers['x-real-ip'],
    host: req.headers['host'],
    // Check for proxy/VPN indicators
    via: req.headers['via'],
    xForwardedProto: req.headers['x-forwarded-proto'],
    cfConnectingIp: req.headers['cf-connecting-ip'], // Cloudflare
    cfIpCountry: req.headers['cf-ipcountry'],
    cfRay: req.headers['cf-ray']
  };

  // Request timing and patterns
  const requestData = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    timestamp: timestamp,
    requestStart: req._startTime || Date.now(),
    processingTime: Date.now() - (req._startTime || Date.now())
  };

  // TLS/Security info
  let tlsData = null;
  if (req.socket && req.socket.encrypted) {
    try {
      const cipher = req.socket.getCipher ? req.socket.getCipher() : null;
      tlsData = {
        cipher: cipher,
        tlsVersion: req.socket.getProtocol ? req.socket.getProtocol() : null,
        authorized: req.socket.authorized
      };
    } catch (err) {
      tlsData = { error: 'TLS data unavailable' };
    }
  }

  return {
    requestId,
    timestamp,
    connection: connectionData,
    security: securityHeaders,
    request: requestData,
    tls: tlsData,
    additional: additionalData
  };
}

// Threat analysis function
function analyzeThreatLevel(formData, securityData) {
  let threatScore = 0;
  const indicators = [];

  // Check message content for suspicious patterns
  const message = formData.message?.toLowerCase() || '';
  const email = formData.email?.toLowerCase() || '';
  const name = formData.name?.toLowerCase() || '';

  // Suspicious keywords in message
  THREAT_PATTERNS.suspiciousKeywords.forEach(keyword => {
    if (message.includes(keyword.toLowerCase())) {
      threatScore += 3;
      indicators.push(`suspicious_keyword: ${keyword}`);
    }
  });

  // Check for suspicious email domains
  const emailDomain = email.split('@')[1];
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
  if (securityData.additional.clientData?.formTime < 5000) { // Less than 5 seconds
    threatScore += 2;
    indicators.push('rapid_submission');
  }

  // Check for suspicious user agent
  const userAgent = securityData.security.userAgent || '';
  if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawl')) {
    threatScore += 3;
    indicators.push('suspicious_user_agent');
  }

  // Check for missing referer (direct access)
  if (!securityData.security.referer) {
    threatScore += 1;
    indicators.push('no_referer');
  }

  // Determine threat level
  let threatLevel = 'low';
  if (threatScore >= 8) threatLevel = 'high';
  else if (threatScore >= 4) threatLevel = 'medium';

  return {
    score: threatScore,
    level: threatLevel,
    indicators: indicators,
    requiresReview: threatScore >= 4
  };
}

// Enhanced logging with threat analysis
async function logSecurityEvent(data, eventType = 'contact_submission') {
  try {
    const logDir = path.join(__dirname, '..', 'logs', 'security');
    await fs.mkdir(logDir, { recursive: true });
    
    const logFile = path.join(logDir, `${eventType}_${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = {
      ...data,
      loggedAt: new Date().toISOString()
    };
    
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    
    // Create separate high-threat log
    if (data.threatAnalysis?.level === 'high') {
      const alertFile = path.join(logDir, `high_threat_${new Date().toISOString().split('T')[0]}.log`);
      await fs.appendFile(alertFile, JSON.stringify(logEntry) + '\n');
    }
    
  } catch (err) {
    console.error('Failed to log security event:', err);
  }
}

// Middleware to capture request start time
router.use((req, res, next) => {
  req._startTime = Date.now();
  next();
});

router.post("/contact", formLimiter, async (req, res, next) => {
  try {
    const { name, email, message, subject, hcaptchaToken, clientData } = req.body;
    // Basic input validation
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
    }

    function isReasonableLength(str, maxLen) {
      return typeof str === 'string' && str.trim().length > 0 && str.length <= maxLen;
    }

    if (
      !isReasonableLength(name, 100) ||
      !isValidEmail(email) ||
      !isReasonableLength(subject, 150) ||
      !isReasonableLength(message, 2000)
    ) {
      const invalidData = captureSecurityData(req, {
        formData: { name, email, subject, message },
        failureReason: 'invalid_input',
        processingStep: 'validation'
      });

      await logSecurityEvent(invalidData, 'validation_failure');
      return next(new HttpError("Invalid input", 400));
    }
    // Capture security data
    const securityData = captureSecurityData(req, {
      formData: { name, email, message, subject },
      captchaProvided: !!hcaptchaToken,
      clientData: clientData, // From client-side
      processingStep: 'initial_validation'
    });

    // Analyze threat level
    const threatAnalysis = analyzeThreatLevel(
      { name, email, message, subject }, 
      securityData
    );

    // Enhanced logging with threat analysis
    await logSecurityEvent({
      ...securityData,
      threatAnalysis: threatAnalysis,
      formData: { name, email, hasMessage: !!message, hasSubject: !!subject }
    }, 'contact_submission');

    // CAPTCHA validation
    if (!hcaptchaToken) {
      await logSecurityEvent({
        ...securityData,
        threatAnalysis: threatAnalysis,
        validationResult: 'failed',
        failureReason: 'missing_captcha'
      }, 'validation_failure');
      
      return next(new HttpError("Captcha token missing", 400));
    }
    
    const valid = await verifyHCaptcha(hcaptchaToken);
    if (!valid) {
      await logSecurityEvent({
        ...securityData,
        threatAnalysis: threatAnalysis,
        validationResult: 'failed',
        failureReason: 'captcha_failed'
      }, 'validation_failure');
      
      return next(new HttpError("Captcha verification failed", 400));
    }

    // High threat handling
    if (threatAnalysis.level === 'high') {
      await logSecurityEvent({
        ...securityData,
        threatAnalysis: threatAnalysis,
        action: 'blocked_high_threat'
      }, 'threat_blocked');
      
      // Still redirect to thank you to not reveal detection
      res.redirect("/contact/thankyou");
      return;
    }

    // Send email (but flag for review if medium threat)
    const emailData = { name, email, message, subject };
    if (threatAnalysis.level === 'medium') {
      emailData.securityFlag = `[SECURITY REVIEW REQUIRED - Score: ${threatAnalysis.score}]`;
    }
    
    await sendContactMail(emailData);
    
    // Log successful completion
    await logSecurityEvent({
      ...securityData,
      threatAnalysis: threatAnalysis,
      processingResult: 'success',
      emailSent: true
    }, 'contact_success');
    
    res.redirect("/contact/thankyou");
    
  } catch (err) {
    const errorData = captureSecurityData(req, {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name
      },
      processingStep: 'error_handling'
    });
    
    await logSecurityEvent(errorData, 'contact_error');
    next(err);
  }
});

router.get("/contact", async (req, res) => {
  const securityData = captureSecurityData(req, {
    pageAccess: 'contact_form',
    processingStep: 'page_render'
  });
  
  await logSecurityEvent(securityData, 'page_access');
  
  const context = {
    csrfToken: res.locals.csrfToken,
    title: "Contact",
    formAction: qualifyLink("/contact"),
    formMethod: "POST"
  };
  res.renderWithBaseContext("pages/contact.handlebars", context);
});

router.get("/contact/thankyou", async (req, res) => {
  const securityData = captureSecurityData(req, {
    pageAccess: 'thankyou_page',
    processingStep: 'page_render'
  });
  
  await logSecurityEvent(securityData, 'thankyou_access');
  
  res.renderWithBaseContext("pages/thankyou.handlebars", {
    title: "Thank You",
  });
});

module.exports = router;
