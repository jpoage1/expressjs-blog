// src/utils/baseUrl.js
// const { winstonLogger } = require("#logging/winston.js");

/** Resolve the canonical public base URL. */
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
  const config = require("#config");
  const { public } = config;
  // winstonLogger.warn("DEBUG_CONFIG", config);
  const finalBasePath = basePath || public?.basePath || "";
  const finalPort = port || public?.port;
  const finalProtocol = schema || public?.schema;
  const finalDomain = (domain || host || public?.domain)
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const omitPort =
    (finalPort == 80 && finalProtocol == "http") ||
    (finalPort == 443 && finalProtocol == "https");
  const showPort = omitPort ? "" : `:${finalPort}`;

  // return `${finalProtocol}://${finalDomain}${finalPort != 80 ? `:${finalPort}` : ""}`;
  return `${finalProtocol}://${finalDomain}${showPort}${finalBasePath}`;
}
function buildBaseUrl(pub) {
  const omitPort =
    (pub.port === 80 && pub.schema === "http") ||
    (pub.port === 443 && pub.schema === "https");
  const portPart = omitPort ? "" : `:${pub.port}`;
  const domain = pub.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `${pub.schema}://${domain}${portPart}${pub.base_path}`;
}

module.exports = { getBaseUrl, withBasePath, buildBaseUrl };
