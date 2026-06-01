// src/authConfig.js
"use strict";

/**
 * src/middleware/authConfig.js
 *
 * Configures express-openid-connect (OIDC middleware).
 *
 * Previously contained hardcoded secrets, client IDs, and the Authelia URL.
 * All values now come from config.toml / environment variables via convict.
 *
 * Required config.toml keys (or env var equivalents):
 *   [auth.oidc]
 *   secret          = "..."   (OIDC_SECRET)
 *   client_id       = "..."   (OIDC_CLIENT_ID)
 *   client_secret   = "..."   (OIDC_CLIENT_SECRET)
 *   issuer_base_url = "..."   (OIDC_ISSUER_BASE_URL)
 *   scope           = "openid profile email groups"
 *   callback_path   = "/auth/callback"
 *
 *   [endpoints]
 *   login_path = "/auth/login"
 */

const { auth, requiresAuth } = require("express-openid-connect");
const config = require("#config");
const { auth: authCfg, session, endpoints } = config;
const oidc = authCfg.oidc;

const { TRUST_PROXY } = require("#constants/middlewareConstants.js");

const { getBaseUrl } = require("#utils/baseUrl.js");
const config = require("#config");
const { meta, session } = config;

// ── Startup guard ────────────────────────────────────────────────────────────
// Catch the common misconfiguration early with an actionable message instead
// of a cryptic OIDC library error at first request.

if (authCfg.enabled) {
  if (!oidc.issuer_base_url) {
    throw new Error(
      '[authConfig] auth is enabled but auth.oidc.issuer_base_url is not set. ' +
      'Set OIDC_ISSUER_BASE_URL or add issuer_base_url to [auth.oidc] in config.toml.'
    );
  }
  if (oidc.secret === 'insecure_default_secret_change_me' &&
      config.meta.node_env === 'production') {
    throw new Error(
      '[authConfig] OIDC_SECRET is still the insecure default. ' +
      'Set a strong random value in production.'
    );
  }
}

// ── OIDC configuration ───────────────────────────────────────────────────────

const oidcConfig = {
  // idpLogout: true,
  secret: oidc.secret,
  clientID: oidc.client_id,
  clientSecret: oidc.client_secret ?? undefined,
  baseURL: getBaseUrl(config.public),
  issuerBaseURL: oidc.issuer_base_url,
  authRequired: false,

  authorizationParams: {
    response_type: "code",
    response_mode: "query",
    scope: oidc.scope,
    // audience: "expressjs-blog",
  },
  routes: {
    callback: oidc.callback_path,
    login: "/auth/_login", // internal — triggers the OIDC redirect
    logout: "/auth/logout",
  },

   // Session cookie config flows from the same convict session block
  // used by express-session elsewhere in the app.
  session,

  afterCallback: async (req, res, session, decodedToken) => {
    req.log.warn(
      "User Authenticated:" +
        JSON.stringify(decodedToken) +
        JSON.stringify(session),
    );
    // try {
    const jose = require("jose");
    const claims = jose.decodeJwt(sessionData.id_token);

    // const userInfo = await req.oidc.fetchUserInfo();
      req.log.info.("OIDC callback — claims received", { sub: claims.sub });

    return {
      ...session,
      sub: claims.sub,
      // userProfile: {
      //   username: userInfo.preferred_username || userInfo.name,
      //   groups: userInfo.groups || [],
      // },
    };
    // } catch (err) {
    //   req.log.error(
    //     "Failed to fetch UserInfo during callback:" + JSON.stringify(err),
    //   );
    //   return session; // Fallback to basic session if fetch fails
    // }
  },
  // afterCallback: async (req, res, session, decodedToken) => {
  //   // 1. Manually fetch the fresh user info (including groups) once
  //   // const userInfo = await req.oidc.fetchUserInfo();

  //   // 2. Attach it to the session object
  //   // This gets encrypted into the 'appSession' cookie
  //   return {
  //     ...session,
  //     // userinfo: userInfo,
  //     // groups: userInfo.groups || [],
  //   };
  // },
};

function disableAuth(req, res, next) {
  next();
}

module.exports = config.auth.enabled ? auth(authConfig) : disableAuth;
