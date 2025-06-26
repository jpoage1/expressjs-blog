// src/utils/BaseRoute.js
const express = require("express");

class BaseRoute {
  constructor() {
    this.router = express.Router();
  }

  getRouter() {
    return this.router;
  }
}

module.exports = BaseRoute;
