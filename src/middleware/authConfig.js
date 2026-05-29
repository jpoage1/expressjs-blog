// src/authConfig.js
console.warn("Fix auth config authConfig.js has hard coded config values");
const { TRUST_PROXY } = require("../constants/middlewareConstants");

const config = require("../config/loader");
const { meta, session } = config;
const { auth, requiresAuth } = require("express-openid-connect");
const { baseUrl } = require("../utils/baseUrl.js");

const authConfig = {
  // idpLogout: true,
  afterCallback: async (req, res, session, decodedToken) => {
    req.log.warn(
      "User Authenticated:" +
        JSON.stringify(decodedToken) +
        JSON.stringify(session),
    );
    // try {
    const jose = require("jose");
    const claims = jose.decodeJwt(session.id_token);
    // const userInfo = await req.oidc.fetchUserInfo();
    req.log.warn("claims: " + JSON.stringify(claims));
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
  session,
  secret: "insecure_secret",
  clientID: "expressjs-blog",
  clientSecret: "insecure_secret",
  baseURL: baseUrl,
  issuerBaseURL: "https://auth.jasonpoage.com",
  authRequired: false,
  authorizationParams: {
    response_type: "code",
    response_mode: "query",
    scope: "openid profile email groups",
    // audience: "expressjs-blog",
  },
  routes: {
    callback: "/auth/callback",
    login: "/auth/_login",
    logout: "/auth/logout",
  },
};

function disableAuth(req, res, next) {
  next();
}

module.exports = config.auth.enabled ? auth(authConfig) : disableAuth;
