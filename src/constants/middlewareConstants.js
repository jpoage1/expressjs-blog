const TRUST_PROXY = true;
const EXCLUDED_PATHS = ["/contact", "/analytics", "/track"];
const DATA_LIMIT_BYTES = 10 * 1024;
const RAW_BODY_LIMIT_BYTES = 100 * 1024;
const RAW_BODY_TYPE = "*/*";
const FALLBACK_ENCODING = "utf8";
const FALLBACK_BODY = {};

module.exports = {
  TRUST_PROXY,
  EXCLUDED_PATHS,
  DATA_LIMIT_BYTES,
  RAW_BODY_LIMIT_BYTES,
  RAW_BODY_TYPE,
  FALLBACK_ENCODING,
  FALLBACK_BODY,
};
