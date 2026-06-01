// src/logging/format.js
const util = require("util");
const { SPLAT } = require("triple-beam");

const config = require("#config");

const formatMessage = (info) => {
  const { timestamp, level, message, callSite } = info;
  const splat = (info[SPLAT] || []).filter(
    (arg) => !(arg && typeof arg === "object" && "callSite" in arg),
  );

  const strippedSplat = splat.map((arg) => {
    if (arg instanceof Error && arg.cause) {
      const stripped = Object.create(Object.getPrototypeOf(arg));
      Object.assign(stripped, arg);
      Object.defineProperty(stripped, "cause", { enumerable: false });
      return stripped;
    }
    return arg;
  });

  const settings = config.logging.prettyPrint;
  const formattedMessage = util.formatWithOptions(
    {
      colors: settings.colors,
      depth: settings.depth,
      breakLength: settings.breakLength,
      compact: settings.compact,
    },
    message,
    ...strippedSplat,
  );

  return `[${timestamp}] [${level}]  [${callSite ?? "unknown"}] ${formattedMessage}`;
};
module.exports = {
  formatMessage,
};
