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
// const getBaseContext = require("../utils/baseContext");
const formLimiter = require("../utils/formLimiter");
const verifyHCaptcha = require("../utils/verifyHCaptcha");
const crypto = require("crypto");
const HttpError = require("../utils/HttpError");
const { qualifyLink } = require("../utils/qualifyLinks");
const {
  captureSecurityData,
  analyzeThreatLevel,
  logSecurityEvent,
} = require("../utils/securityForensics");
const { validateAndSanitizeEmail } = require("../utils/emailValidator");

function isReasonableLength(str, maxLen) {
  return (
    typeof str === "string" && str.trim().length > 0 && str.length <= maxLen
  );
}
router.post("/contact", formLimiter, async (req, res, next) => {
  try {
    const { name, email, message, subject, clientData } = req.body;
    const hcaptchaToken =
      req.body.hcaptchaToken || req.body["g-recaptcha-response"];

    const emailResult = validateAndSanitizeEmail(email);

    if (
      !emailResult.valid ||
      !isReasonableLength(name, 100) ||
      !isReasonableLength(subject, 150) ||
      !isReasonableLength(message, 2000)
    ) {
      const invalidData = captureSecurityData(req, {
        formData: { name, email, subject, message },
        failureReason: emailResult.message || "invalid_input",
        processingStep: "validation",
      });

      await logSecurityEvent(invalidData, "validation_failure");
      return next(new HttpError("Invalid input", 400, invalidData));
    }
    // Capture security data
    const securityData = captureSecurityData(req, {
      formData: { name, email, message, subject },
      captchaProvided: !!hcaptchaToken,
      clientData: clientData, // From client-side
      processingStep: "initial_validation",
    });

    // Analyze threat level
    const threatAnalysis = analyzeThreatLevel(
      { name, email, message, subject },
      securityData
    );

    // Enhanced logging with threat analysis
    await logSecurityEvent(
      {
        ...securityData,
        threatAnalysis: threatAnalysis,
        formData: { name, email, hasMessage: !!message, hasSubject: !!subject },
      },
      "contact_submission"
    );

    // CAPTCHA validation
    if (!hcaptchaToken) {
      await logSecurityEvent(
        {
          ...securityData,
          threatAnalysis: threatAnalysis,
          validationResult: "failed",
          failureReason: "missing_captcha",
        },
        "validation_failure"
      );

      return next(new HttpError("Captcha token missing", 400));
    }

    const valid = await verifyHCaptcha(hcaptchaToken);
    if (!valid) {
      await logSecurityEvent(
        {
          ...securityData,
          threatAnalysis: threatAnalysis,
          validationResult: "failed",
          failureReason: "captcha_failed",
        },
        "validation_failure"
      );

      return next(new HttpError("Captcha verification failed", 400));
    }

    // High threat handling
    if (threatAnalysis.level === "high") {
      await logSecurityEvent(
        {
          ...securityData,
          threatAnalysis: threatAnalysis,
          action: "blocked_high_threat",
        },
        "threat_blocked"
      );

      // Still redirect to thank you to not reveal detection
      res.customRedirect("/contact/thankyou");
      return;
    }

    // Send email (but flag for review if medium threat)
    const emailData = { name, email, message, subject };
    if (threatAnalysis.level === "medium") {
      emailData.securityFlag = `[SECURITY REVIEW REQUIRED - Score: ${threatAnalysis.score}]`;
    }

    await sendContactMail(emailData);

    // Log successful completion
    await logSecurityEvent(
      {
        ...securityData,
        threatAnalysis: threatAnalysis,
        processingResult: "success",
        emailSent: true,
      },
      "contact_success"
    );

    res.customRedirect("/contact/thankyou");
  } catch (err) {
    const errorData = captureSecurityData(req, {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      processingStep: "error_handling",
    });

    await logSecurityEvent(errorData, "contact_error");
    next(err);
  }
});

router.get("/contact", async (req, res) => {
  const securityData = captureSecurityData(req, {
    pageAccess: "contact_form",
    processingStep: "page_render",
  });

  await logSecurityEvent(securityData, "page_access");

  const context = {
    csrfToken: res.locals.csrfToken,
    title: "Contact",
    formAction: qualifyLink("/contact"),
    formMethod: "POST",
  };
  res.renderWithBaseContext("pages/contact.handlebars", context);
});

router.get("/contact/thankyou", async (req, res) => {
  const securityData = captureSecurityData(req, {
    pageAccess: "thankyou_page",
    processingStep: "page_render",
  });

  await logSecurityEvent(securityData, "thankyou_access");

  res.renderGenericMessage({
    title: "Thank You",
    message:
      "Your message has been sent successfully. We will get back to you shortly.",
  });
});

module.exports = router;
