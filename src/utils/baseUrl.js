// src/utils/baseUrl.js
function getBaseUrl({ schema = null, host = null, port = null } = {}) {
  const envSchema = process.env.TEST_SCHEMA || process.env.SERVER_SCHEMA;
  const envDomain = process.env.TEST_DOMAIN || process.env.SERVER_DOMAIN;
  const envPort = process.env.TEST_PORT || process.env.SERVER_PORT;

  const finalPort = envPort || port || 3000;
  const finalProtocol = envSchema || schema || "https";
  const finalDomain = (envDomain || host || "localhost")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return `${finalProtocol}://${finalDomain}${finalPort != 80 ? `:${finalPort}` : ""}`;
}
const baseUrl = getBaseUrl();

module.exports = { baseUrl, getBaseUrl };
