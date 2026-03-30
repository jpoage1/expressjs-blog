const express = require("express");
const router = express.Router();

const logEvent = require("../middleware/analytics.js");
const { auth, requiresAuth } = require("express-openid-connect");
const setPolicy = require("../middleware/setPolicy.js");

const {
  handleAccessConsumption,
  renderPortal,
  loginController,
  logoutApiController,
  logoutSuccessApiController,
  logoutController,
  userInfoApiController,
} = require("../controllers/accessController");

// -- Generate acccess token
router.get(
  "/access/manager",
  logEvent("admin"),
  setPolicy({
    policy: "deny",
    rules: [["user:jason"], ["group:professors"]],
  }),
  renderPortal,
);

// -- Logout
router.post("/api/auth/logout", logoutApiController);
// router.get("/auth/login", loginController);
router.use("/auth/login", loginController);
router.get("/api/auth/logout", logoutApiController);
router.get("/api/auth/logout/success", logoutSuccessApiController);
router.get("/guest-access/logout", logoutController);

// -- User info
router.get("/api/auth/userinfo", userInfoApiController);
router.get("/api/auth/status", (req, res) => {
  // res.locals.session is populated by your authCheck middleware
  res.json(res.locals.session);
});

// -- Login
router.get(
  "/guest-access",
  logEvent("admin"),
  // requiresAuth(),
  handleAccessConsumption,
);
// -- Login using access token
router.get("/guest-access/:token", logEvent("admin"), handleAccessConsumption);

module.exports = router;
