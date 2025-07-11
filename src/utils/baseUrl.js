// src/utils/baseUrl.js
function getBaseUrl({ protocol = null, host = null } = {}) {
  const envProtocol = process.env.PROTOCOL;
  const envDomain = process.env.DOMAIN;

  const finalProtocol = envProtocol || protocol || "https";
  const finalDomain = (envDomain || host || "localhost")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return `${finalProtocol}://${finalDomain}`;
}
const baseUrl = getBaseUrl();

module.exports = { baseUrl, getBaseUrl };
