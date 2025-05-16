// src/middleware/controllers.js
const loadControllers = require("../loaders/controllers");
const models = require("../models");

const loadControllersMiddleware = (req, res, next) => {
  const controllers = loadControllers("./controllers", "path");
  req.controllers = controllers;
  req.models = models;
  next();
};
module.exports = loadControllersMiddleware;
