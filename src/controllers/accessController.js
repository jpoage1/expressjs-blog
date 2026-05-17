const { session } = require("../config/loader.js");

/**
 * Handles the GET request from a recruiter clicking the unique link.
 */
exports.handleAccessConsumption = async (req, res, next) => {
  const { token } = req.params;

  try {
    res.renderWithBaseContext("pages/credentials.handlebars", {
      title: "Guest Access",
      token: token ?? "",
    });
  } catch (err) {
    next(err);
  }
};

exports.renderPortal = async (req, res, next) => {
  res.renderWithBaseContext("admin-pages/accessManager.handlebars", {
    title: "Access Management",
    // Base context handles user/session data
  });
};

exports.userInfoApiController = async (req, res) => {
  const userInfo = await req.oidc.fetchUserInfo();

  res.status(200).json(userInfo);
};
exports.logoutSuccessApiController = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Local application session cleared",
  });
};
exports.logoutApiController = (req, res) => {
  try {
    res.oidc.logout({
      returnTo: "/api/auth/logout/success",
    });
  } catch (e) {
    res.send(e.message);
  }
};
exports.logoutController = (req, res) => {
  try {
    res.oidc.logout({
      returnTo: "/auth/logout/success",
    });
  } catch (e) {
    res.send(e.message);
  }
};

exports.loginController = (req, res) => {
  const rd = req.query.rd;
  const destination = rd
    ? `/guest-access?rd=${encodeURIComponent(rd)}`
    : "/guest-access";

  try {
    res.oidc.login({
      returnTo: "/guest-access",
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
};
