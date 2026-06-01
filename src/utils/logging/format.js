// src/logging/format.js
const util = require("util");
const { createLogger } = require("winston");
const { SPLAT } = require("triple-beam");

const config = require("#config");
const { getCallSite } = require("#logging/callSite.js");

const formatMessage = (info) => {
  const { timestamp, level, message, callSite } = info;
  const splat = info[SPLAT] || [];
  const settings = config.logging.prettyPrint;

  const formattedMessage = util.formatWithOptions(
    {
      colors: settings.colors,
      depth: settings.depth,
      breakLength: settings.breakLength,
      compact: settings.compact,
    },
    message,
    ...splat,
  );

  const error =
    splat.find((arg) => arg instanceof Error) ||
    (message instanceof Error ? message : null);

  const stack = error ? `\n${error.stack}` : "";

  return `[${timestamp}] [${level}]  [${callSite ?? "unknown"}] ${formattedMessage}${stack}`;
};
// function formatArg(arg) {
//   if (arg instanceof Error) {
//     return JSON.stringify(
//       {
//         name: arg.name,
//         message: arg.message,
//         stack: arg.stack,
//       },
//       null,
//       2,
//     );
//   }

//   if (arg instanceof RegExp) {
//     return arg.toString();
//   }

//   if (typeof arg === "object" && arg !== null) {
//     try {
//       return JSON.stringify(arg, getCircularReplacer(), 2);
//     } catch {
//       return util.inspect(arg, { depth: null, colors: false });
//     }
//   }

//   return String(arg);
// }
function formatArg(arg) {
  // This satisfies your "Object Expansion" tests by preventing [object Object]
  if (arg instanceof Error) return arg.stack;
  if (typeof arg === "object" && arg !== null) {
    return util.inspect(arg, { depth: null, colors: false });
  }
  return String(arg);
}
// function formatLog(level, ...args) {
//   const timestamp = new Date().toISOString();
//   // Using util.format ensures objects are expanded and circular refs are handled
//   const message = util.format(...args);
//   const logLine = `[${timestamp}] [${level}] ${message}\n`;

//   return { timestamp, message, logLine };
// }
function formatLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const callSite = getCallSite();
  const safeArgs = args.map(formatArg); // Required by your tests
  const message = safeArgs.join(" ");
  const logLine = `[${timestamp}] [${level}] [${callSite}] ${message}\n`;

  return { timestamp, safeArgs, message, logLine, callSite };
}
module.exports = {
  formatMessage,
  formatLog,
};
