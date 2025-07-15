// src/routes/index.js
const express = require("express");
const router = express.Router();

function flattenRouterLayers(stack, acc = []) {
  for (const layer of stack) {
    acc.push(layer);
    const h = layer.handle;
    console.log(layer);
    if (typeof h === "function") {
      if (h.stack && Array.isArray(h.stack)) {
        flattenRouterLayers(h.stack, acc);
      } else if (h.handle && h.handle.stack && Array.isArray(h.handle.stack)) {
        flattenRouterLayers(h.handle.stack, acc);
      }
    }
  }
  return acc;
}

router.get("/routes", (req, res) => {
  const rootStack = req.app._router?.stack || req.app.router?.stack;
  if (!rootStack) return res.sendStatus(500);
  const flat = flattenRouterLayers(rootStack);
  const routes = [];
  flat.forEach((layer) => {
    if (layer.route && layer.route.path && layer.route.methods) {
      routes.push({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods).map((m) => m.toUpperCase()),
      });
    }
  });
  res.status(200).json(routes);
});

module.exports = router;
