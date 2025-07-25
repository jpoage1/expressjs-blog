// functionLogger.js
const fs = require("fs");
const path = require("path");
const { formatFunctionName, formatLogMessage } = require("./formatters");

const dynamicCustomStreams = {};

function functionLog(functionsLogDir, functionName, ...args) {
  const safeFunctionName = formatFunctionName(functionName).replace(
    /[^a-z0-9_\-]/gi,
    "_"
  );
  const message = formatLogMessage(functionName, args);

  if (!dynamicCustomStreams[safeFunctionName]) {
    const customFilePath = path.join(
      functionsLogDir,
      `${safeFunctionName}.log`
    );
    dynamicCustomStreams[safeFunctionName] = fs.createWriteStream(
      customFilePath,
      { flags: "a" }
    );
  }

  dynamicCustomStreams[safeFunctionName].write(message);
}

module.exports = { functionLog };
