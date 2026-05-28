// src/utils/baseUrl.js
const { public } = require("../config/loader");

function withBasePath(path = "") {
  const basePath = public.basePath;
  return `${basePath}${path}`;
}

function getBaseUrl({
  schema = null,
  host = null,
  port = null,
  basePath = "",
} = {}) {
  const envSchema = public.schema;
  const envDomain = public.domain;
  const envPort = public.port;
  const envBasePath = public.basePath;

  const finalBasePath = envBasePath || basePath || "";
  const finalPort = envPort || port;
  const finalProtocol = envSchema || schema;
  const finalDomain = (envDomain || host)
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const omitPort =
    (finalPort == 80 && finalProtocol == "http") ||
    (finalPort == 443 && finalProtocol == "https");
  const showPort = omitPort ? "" : `:${finalPort}`;

  // return `${finalProtocol}://${finalDomain}${finalPort != 80 ? `:${finalPort}` : ""}`;
  return `${finalProtocol}://${finalDomain}${showPort}${finalBasePath}`;
}
const baseUrl = getBaseUrl();

module.exports = { baseUrl, getBaseUrl, withBasePath };
