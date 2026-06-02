const { evaluateRules } = require("@jpoage1/auth");
const { handleRedirect } = require("./redirect.js");

/**
 * Route-level policy enforcement middleware.
 * @param {Object} config - { policy: "allow"|"deny"|"deny-children", rules: Array }
 */
function setPolicy(config) {
  return (req, res, next) => {
    const session = res.locals.session || {
      isAuthenticated: false,
      groups: [],
      user: null,
    };
    // return res.json(session);
    const policy = config.policy || "allow";
    const rules = config.rules || [];
    const redirectTarget = config.redirectOnFail || "/";

    // 1. "allow" and "deny-children" permit access to the route itself
    if (policy === "allow" || policy === "deny-children") {
      return next();
    }

    // 2. "deny" requires authentication AND passing the rule set
    if (policy === "deny") {
      if (session.isAuthenticated && evaluateRules(rules, session)) {
        return next();
      }

      // Log the rejection for audit trails
      if (req.log) {
        req.log.warn(
          { user: session.user, policy, rules },
          "Access Denied by Policy",
        );
      }

      // CASE: User is not logged in - Redirect to OIDC Login
      if (!session.isAuthenticated) {
        req.log.warn("REDIRECT " + JSON.stringify(session));
        return handleRedirect(req, res, "/guest-access", 302);
      }

      // CASE: User is logged in but lacks permissions - Redirect to target (or 403 page)
      return handleRedirect(req, res, redirectTarget, 302);
    }

    // Default safety: Fail closed
    res.status(403).send("Security Policy Violation");
  };
}

module.exports = setPolicy;
