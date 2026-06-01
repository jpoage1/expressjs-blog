const { winstonLogger } = require("#utils/logging/winston.js");
const { PrimitiveError } = require("#utils/primitiveErrors.js");

class ApiError extends PrimitiveError {
  log() {
    winstonLogger.error(this);
    return this;
  }
}
class DatabaseError extends ApiError {
  constructor(context, originalError = null) {
    super(context, originalError);
    this.name = "DatabaseError";
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

const _errors = { PrimitiveError, ApiError, DatabaseError, PathNotFoundError };

module.exports = Object.fromEntries(
  Object.entries(_errors).map(([key, value]) => [key, createNewProxy(value)]),
);
