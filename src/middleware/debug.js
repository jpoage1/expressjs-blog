// src/setupMiddleware.js

const router = require("express").Router();
const { TRUST_PROXY } = require("../constants/middlewareConstants");
const { meta, session } = require("#config");
const { requiresAuth } = require("express-openid-connect");

const cookieParser = require("cookie-parser");
router.use(cookieParser());

const debug = async (req, res) => {
  try {
    const tokenSet = req.oidc.tokenSet;
    const username = req.oidc?.user?.name ?? undefined;

    let userinfo;
    try {
      userinfo = await req.oidc.fetchUserInfo();
    } catch (e) {
      userinfo = e.message;
    }

    const diagnostics = {
      session,
      "req.cookies": req.cookies,
      "req.signedCookies": req.signedCookies,
      "req.oidc.fetchUserInfo()": userinfo,
      "req.locals.session": res.locals.session || "unset",
      "req.oidc.user": req.oidc.user || "unset",
      "req.oidc.idTokenClaims.claims": req.oidc.idTokenClaims || "not set",

      metadata: {
        "trust-proxy": TRUST_PROXY,
        baseUrl: res.locals.baseUrl,
        user: username,
        // 1. Connection Security (Critical for Access Tokens)
        protocol: req.protocol,
        isSecure: req.secure, // If this is false, the SDK drops the access_token
        // 2. Auth State
        isAuthenticated: req.oidc.isAuthenticated(),

        // 3. Token Inventory (What the library actually holds)
        tokensInStore: tokenSet ? Object.keys(tokenSet) : "NONE",

        // 4. Scopes (What was actually granted by Authelia)
        grantedScopes: tokenSet?.scope,
        "req.openidTokens": req.openidTokens,
      },
    };

    // Log to console for persistent record
    console.warn("--- DIAGNOSTIC DATA ---");
    res.send("<pre>" + JSON.stringify(diagnostics, null, 2) + "</pre>");

    // res.json(diagnostics);
  } catch (e) {
    res.json(e.stack);
  }
};

router.get("/debug", debug);

const { claimIncludes } = require("express-openid-connect");

router.get("/debug/claim", claimIncludes("groups", "guests"), debug);

module.exports = router;
