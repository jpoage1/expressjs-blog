const DEFAULT_STATUS = 500;

const codeMap = {
  403: {
    title: "Forbidden",
    message: "Your request could not be processed.",
  },
  404: {
    title: "Not Found",
    message: "The requested resource was not found.",
  },
  500: {
    title: "Server Error",
    message: "An unexpected error occurred. Please try again later.",
  },
};

const nameMap = {
  EBADCSRFTOKEN: {
    title: "Forbidden",
    message: "Your request could not be processed.",
    statusCode: 403,
  },
};

function getErrorContext(codeOrName) {
  if (typeof codeOrName === "string" && nameMap[codeOrName]) {
    return nameMap[codeOrName];
  }

  const code = parseInt(codeOrName, 10);
  const context = codeMap[code] || codeMap[DEFAULT_STATUS];

  return {
    ...context,
    statusCode: code || DEFAULT_STATUS,
  };
}

module.exports = { getErrorContext };
