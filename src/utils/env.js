const { meta } = require("../config/loader");
const NODE_ENV = meta.node_env || "development";
const isProd = NODE_ENV === "production";
const isDev = NODE_ENV === "development";

module.exports = {
  NODE_ENV,
  isProd,
  isDev,
};
