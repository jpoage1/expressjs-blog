const express = require("express");
const router = express.Router();

const { renderPresentation } = require("../controllers/presentationController");
const resolveReturnUrl = require("../middleware/resolveReturnUrl");
const { securityPolicy } = require("../middleware/applyProductionSecurity");
const { CSP_DIRECTIVES } = require("../config/securityConfig");

router.get(
  "/",
  resolveReturnUrl,
  securityPolicy({
    scriptSrc: [...CSP_DIRECTIVES.scriptSrc, "'unsafe-eval'"],
    styleSrc: [...CSP_DIRECTIVES.styleSrc, "'unsafe-inline'"],
  }),
  renderPresentation
);

module.exports = router;
