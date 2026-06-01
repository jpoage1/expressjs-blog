const PrimitiveError = require("#errors/PrimitiveError.js");

class PathNotFoundError extends PrimitiveError {
  constructor(sourceName, resolved) {
    // 1. Pass the formatted message to the parent Error class
    super(`Path "${sourceName}" does not exist at: ${resolved}`);

    // 2. Ensure the name property matches the class name
    this.name = "PathNotFoundError";

    // 3. Maintain clean stack traces (Node.js specific)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PathNotFoundError);
    }
  }
}

module.exports = PathNotFoundError;
