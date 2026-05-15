// src/utils/baseUrl.js
const { public } = require("../config/loader");
function getBaseUrl({ schema = null, host = null, port = null } = {}) {
  const envSchema = public.schema;
  const envDomain = public.domain;
  const envPort = public.port;

  const finalPort = envPort || port;
  const finalProtocol = envSchema || schema;
  const finalDomain = (envDomain || host)
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const omitPort =
    (finalPort == 80 && finalProtocol == "http") ||
    (finalProtocol == "443" && finalProtocol == "https");
  const showPort = omitPort ? "" : `:${finalPort}`;

  // return `${finalProtocol}://${finalDomain}${finalPort != 80 ? `:${finalPort}` : ""}`;
  return `${finalProtocol}://${finalDomain}${showPort}`;
}
const baseUrl = getBaseUrl();

module.exports = { baseUrl, getBaseUrl };
