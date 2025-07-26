// src/routes/helpers/contactHelpers.js
const SecurityEvent = require("#src/utils/SecurityEvent.js");
const { captureSecurityData } = require("../../utils/securityForensics");

function isReasonableLength(str, maxLen) {
  return (
    typeof str === "string" && str.trim().length > 0 && str.length <= maxLen
  );
}

function isValidInput(name, subject, message, emailResult) {
  return (
    emailResult.valid &&
    isReasonableLength(name, 100) &&
    isReasonableLength(subject, 150) &&
    isReasonableLength(message, 2000)
  );
}

/**
 * Handle invalid input with consistent security logging
 */
async function handleInvalidInput(req, next, formData, emailResult) {
  SecurityEvent.handleValidationFailure(
    req,
    formData,
    emailResult.message || "invalid_input",
    next
  );
}

/**
 * Build security data for logging
 */
function buildSecurityData(
  req,
  { formData, captchaProvided, clientData, step }
) {
  return captureSecurityData(req, {
    formData,
    captchaProvided,
    clientData,
    processingStep: step,
  });
}

/**
 * Log successful form submission
 */
async function logSubmission(securityData, threatAnalysis, formData) {
  await SecurityEvent.logEvent("CONTACT_SUCCESS", {
    ...securityData,
    threatAnalysis,
    formData: {
      name: formData.name,
      email: formData.email,
      hasMessage: !!formData.message,
      hasSubject: !!formData.subject,
    },
  });
}

/**
 * Handle CAPTCHA failure with consistent logging
 */
async function handleCaptchaFailure(req, threatAnalysis, next, reason) {
  SecurityEvent.handleCaptchaFailure(req, reason, threatAnalysis, next);
}

/**
 * Block high threat submissions
 */
async function blockHighThreat(req, threatAnalysis) {
  return await SecurityEvent.blockThreat(req, threatAnalysis);
}

/**
 * Prepare email content with security flags if needed
 */
function prepareEmail({ name, email, message, subject }, threatAnalysis) {
  const base = { name, email, message, subject };

  if (threatAnalysis.level === "medium") {
    base.securityFlag = `[SECURITY REVIEW REQUIRED - Score: ${threatAnalysis.score}]`;
  }

  return base;
}

/**
 * Log successful email sending
 */
async function logSuccess(securityData, threatAnalysis) {
  await SecurityEvent.logEvent("CONTACT_SUCCESS", {
    ...securityData,
    threatAnalysis,
    processingResult: "success",
    emailSent: true,
  });
}

/**
 * Log unhandled errors with security context
 */
async function logUnhandledError(req, err) {
  SecurityEvent.fromRequest(req, "CONTACT_ERROR", {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    processingStep: "error_handling",
  });
}

module.exports = {
  isValidInput,
  handleInvalidInput,
  buildSecurityData,
  logSubmission,
  handleCaptchaFailure,
  blockHighThreat,
  prepareEmail,
  logSuccess,
  logUnhandledError,
};
