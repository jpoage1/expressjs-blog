const express = require("express");
const router = express.Router();

const logEvent = require("../middleware/analytics.js");
const securedMiddleware = require("./secured");

const {
  handleAccessConsumption,
  renderPortal,
} = require("../controllers/accessController");

router.get(
  "/access/manager",
  logEvent("admin"),
  securedMiddleware,
  renderPortal,
);

router.get("/guest-access/:token", logEvent("admin"), handleAccessConsumption);

module.exports = router;
