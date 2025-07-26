// src/routes/helpers/contactHelpers.js
const HttpError = require("../../utils/HttpError");
const {
  captureSecurityData,
  logSecurityEvent,
} = require("../../utils/securityForensics");

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
async function handleInvalidInput(req, next, formData, emailResult) {
  const invalidData = captureSecurityData(req, {
    formData,
    failureReason: emailResult.message || "invalid_input",
    processingStep: "validation",
  });
  await logSecurityEvent(invalidData, "validation_failure");
  next(new HttpError("Invalid input", 400, invalidData));
}

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

async function logSubmission(securityData, threatAnalysis, formData) {
  await logSecurityEvent(
    {
      ...securityData,
      threatAnalysis,
      formData: {
        name: formData.name,
        email: formData.email,
        hasMessage: !!formData.message,
        hasSubject: !!formData.subject,
      },
    },
    "contact_submission"
  );
}

async function handleCaptchaFailure(
  securityData,
  threatAnalysis,
  next,
  reason
) {
  await logSecurityEvent(
    {
      ...securityData,
      threatAnalysis,
      validationResult: "failed",
      failureReason: reason,
    },
    "validation_failure"
  );
  next(new HttpError("Captcha verification failed", 400));
}

async function blockHighThreat(securityData, threatAnalysis) {
  await logSecurityEvent(
    {
      ...securityData,
      threatAnalysis,
      action: "blocked_high_threat",
    },
    "threat_blocked"
  );
}

function prepareEmail({ name, email, message, subject }, threatAnalysis) {
  const base = { name, email, message, subject };
  if (threatAnalysis.level === "medium") {
    base.securityFlag = `[SECURITY REVIEW REQUIRED - Score: ${threatAnalysis.score}]`;
  }
  return base;
}

async function logSuccess(securityData, threatAnalysis) {
  await logSecurityEvent(
    {
      ...securityData,
      threatAnalysis,
      processingResult: "success",
      emailSent: true,
    },
    "contact_success"
  );
}

async function logUnhandledError(req, err) {
  const errorData = captureSecurityData(req, {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    processingStep: "error_handling",
  });
  await logSecurityEvent(errorData, "contact_error");
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
