// src/modules/infrastructure.js
//
// Composition root for live infrastructure: logger, mailer, security, and
// auth, built from @jpoage1/* factories and wired with this app's config.

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
import {
  createAuthCheck,
  createOidcMiddleware,
  evaluateRules,
  generateToken,
} from "@jpoage1/auth";
import { HttpError } from "@jpoage1/errors";

export function createInfrastructure(cfg, baseUrl) {
  const logging = cfg.get("logging");
  const mailCfg = cfg.get("mail");
  const hcaptchaCfg = cfg.get("hcaptcha");
  const authCfg = cfg.get("auth");
  const sessionCfg = cfg.get("session");

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

  const oidcMiddleware = createOidcMiddleware(authCfg, sessionCfg, baseUrl);
  const authCheck = createAuthCheck({ enabled: authCfg.enabled });

  const securityCfg = cfg.get("security");
  const cspDirectives = buildCspDirectives(cfg, baseUrl);
  const { applyProductionSecurity, securityPolicy } = createProductionSecurity({
    cspDirectives,
    hstsMaxAge: securityCfg.hsts_max_age,
    healthCheckPath: securityCfg.health_check,
    node_env: cfg.get("meta").node_env,
    HttpError,
  });

  return {
    logger,
    mailer,
    security,
    generateToken,
    evaluateRules,
    oidcMiddleware,
    authCheck,
    cspDirectives,
    securityPolicy,
    applyProductionSecurity,
  };
}
