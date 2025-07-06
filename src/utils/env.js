const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";
const isDev = NODE_ENV === "development";

module.exports = {
  NODE_ENV,
  isProd,
  isDev,
};
