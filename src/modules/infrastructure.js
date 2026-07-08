// src/modules/infrastructure.js
//
// Composition root for live infrastructure: logger, mailer, and security,
// built from @jpoage1/* factories and wired with this app's config.

import { createLogger } from "@jpoage1/logger";
import { buildLogConfig, buildCspDirectives } from "@jpoage1/config";
import {
  createTransporter,
  createMailer,
  createHCaptchaVerifier,
  validateAndSanitizeEmail,
} from "@jpoage1/mailer";
import {
  createSecurityEvent,
  captureSecurityData,
  analyzeThreatLevel,
  createProductionSecurity,
} from "@jpoage1/security";
import { HttpError } from "@jpoage1/errors";

export function createInfrastructure(cfg, baseUrl) {
  const logging = cfg.get("logging");
  const mailCfg = cfg.get("mail");
  const hcaptchaCfg = cfg.get("hcaptcha");

  const { logger } = createLogger(buildLogConfig(cfg));

  const transporter = createTransporter(mailCfg);
  const mailer = {
    ...createMailer({ transporter, mailConfig: mailCfg, HttpError, logger }),
    validateAndSanitizeEmail,
    verifyHCaptcha: createHCaptchaVerifier(hcaptchaCfg.secret),
  };

  const SecurityEvent = createSecurityEvent({
    logger,
    logDir: logging.log_dir,
    HttpError,
  });
  const security = {
    SecurityEvent,
    analyzeThreatLevel,
    captureSecurityData,
  };

  const securityCfg = cfg.get("security");
  const cspDirectives = buildCspDirectives(cfg, baseUrl);
  const { applyProductionSecurity, securityPolicy } = createProductionSecurity({
    cspDirectives,
    hstsMaxAge: securityCfg.hsts_max_age,
    healthCheckPath: securityCfg.health_check,
    node_env: cfg.get("meta").node_env,
    HttpError,
    // Rate-limiting is handled by the ingress (limit-rps/limit-burst-multiplier
    // in chart/values.yaml), so skip the in-app limiter entirely.
    rateLimitOptions: { skip: () => true },
  });

  return {
    logger,
    mailer,
    security,
    cspDirectives,
    securityPolicy,
    applyProductionSecurity,
  };
}
