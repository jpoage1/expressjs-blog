class PathNotFoundError extends Error {
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

class ContextualError extends Error {
  constructor(context, originalError = null) {
    const validContext =
      typeof context === "string" ? context : String(context);

    let detailedMessage = validContext;
    if (originalError instanceof Error) {
      detailedMessage = `${validContext}: ${originalError.message}`;
    } else if (originalError !== null && originalError !== undefined) {
      detailedMessage = `${validContext}: ${String(originalError)}`;
    }

    super(detailedMessage);
    this.name = this.constructor.name;

    if (originalError instanceof Error) {
      this.originalError = originalError;
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    } else if (originalError !== null && originalError !== undefined) {
      this.stack = `${this.stack}\nContext Data: ${String(originalError)}`;
    }
  }
}

module.exports = { ContextualError, PathNotFoundError };
