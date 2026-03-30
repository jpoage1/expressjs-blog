// middleware/authCheck.js

module.exports = async (req, res, next) => {
  // Initialize default state
  res.locals.session = { isAuthenticated: false, user: null, groups: [] };

  if (req.oidc.isAuthenticated()) {
    // Pull data directly from the encrypted session cookie
    // No network calls, no Map lookups, no staleness
    const user = await req.oidc.fetchUserInfo();

    res.locals.session = {
      isAuthenticated: true,
      ...user,
    };
  }

  next();
};
