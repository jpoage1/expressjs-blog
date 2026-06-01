const _errors = {
  HttpError: require("#errors/HttpError.js"),
  PrimitiveError: require("#errors/PrimitiveError.js"),
  PathNotFoundError: require("#errors/PathNotFoundError.js"),
  ApiError: require("#errors/ApiError.js"),
  DatabaseError: require("#errors/DatabaseError.js"),
};

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

module.exports = Object.fromEntries(
  Object.entries(_errors).map(([key, value]) => [key, createNewProxy(value)]),
);
