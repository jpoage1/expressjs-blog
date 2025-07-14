// src/routes/index.js
const express = require("express");
const router = express.Router();

const logs = require("./logs");

router.use(logs);
// router.use(routesList);

module.exports = router;
