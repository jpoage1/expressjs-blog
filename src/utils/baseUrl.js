// src/utils/baseUrl.js
const { public } = require("#config/loader.js");
const config = require("#config/loader.js");
console.log(config);

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
let baseUrl = {};
// The content module needs to import baseUrl before the config is loaded.
try {
  baseUrl = getBaseUrl();
} catch (e) {
  console.info(
    `Notice: baseUrl cannot be configured yet. The config likely has not yet been hydrated; swallowing the error now.\nMessage: ${e.message}`,
  );
  // Swallow the error so that the content module can hydrate the baseUrl
}

module.exports = { baseUrl, getBaseUrl, withBasePath };
