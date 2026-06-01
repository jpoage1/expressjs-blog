class PrimitiveError extends Error {
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
  warn() {
    console.warn("PRIMITIVE_ERROR: ", this);
    return this;
  }
  error() {
    console.error("PRIMITIVE_ERROR: ", this);
    return this;
  }
  info() {
    console.log("PRIMITIVE_ERROR: ", this);
    return this;
  }
  notice() {
    console.log(`Notice: ${this}`);
    return this;
  }
  log(level = "log") {
    console["level"]("PRIMITIVE_ERROR: ", this);
    return this;
  }
}
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
function createNewProxy(TargetClass) {
  return new Proxy(TargetClass, {
    apply(target, thisArg, argumentsList) {
      return new target(...argumentsList);
    },
    construct(target, argumentsList, newTarget) {
      return Reflect.construct(target, argumentsList, newTarget);
    },
  });
}

const _errors = { PrimitiveError, PathNotFoundError };

module.exports = Object.fromEntries(
  Object.entries(_errors).map(([key, value]) => [key, createNewProxy(value)]),
);
