// src/routes/secured/routesList.js
const express = require("express");
const { getRoutes, refreshRoutes } = require("../../middleware/routesList");

const router = express.Router();

router.get("/routes", (req, res) => {
  try {
    const routes = getRoutes();
    res.json({
      count: routes.length,
      routes: routes,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve routes",
      message: error.message,
    });
  }
});

// Optional: endpoint to refresh the route cache
router.post("/routes/refresh", (req, res) => {
  try {
    const routes = refreshRoutes();
    res.json({
      message: "Routes refreshed",
      count: routes.length,
      routes: routes,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to refresh routes",
      message: error.message,
    });
  }
});

module.exports = router;
