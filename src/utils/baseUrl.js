// src/utils/baseUrl.js
function getBaseUrl({ schema = null, host = null } = {}) {
  const envSchema = process.env.SERVER_SCHEMA;
  const envDomain = process.env.SERVER_DOMAIN;

  const finalProtocol = envSchema || schema || "https";
  const finalDomain = (envDomain || host || "localhost")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return `${finalProtocol}://${finalDomain}`;
}
const baseUrl = getBaseUrl();

module.exports = { baseUrl, getBaseUrl };
