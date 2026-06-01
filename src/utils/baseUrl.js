// src/utils/baseUrl.js
const config = require("#config");

function withBasePath(path = "") {
  const basePath = public.basePath;
  return `${basePath}${path}`;
}

function getBaseUrl({
  schema = null,
  host = null,
  domain = null,
  port = null,
  basePath = "",
} = {}) {
  const { public } = config;
  const finalBasePath = basePath || public?.basePath || "";
  const finalPort = port || public.port;
  const finalProtocol = schema || public.schema;
  const finalDomain = (domain || host || public.domain)
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const omitPort =
    (finalPort == 80 && finalProtocol == "http") ||
    (finalPort == 443 && finalProtocol == "https");
  const showPort = omitPort ? "" : `:${finalPort}`;

  // return `${finalProtocol}://${finalDomain}${finalPort != 80 ? `:${finalPort}` : ""}`;
  return `${finalProtocol}://${finalDomain}${showPort}${finalBasePath}`;
}

module.exports = { getBaseUrl, withBasePath };
