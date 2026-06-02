const exports = {
  // Namespaces
  errors: require("#errors"),
  logging: require("#logging"),
  utils: require("#utils"),

  CSP_DIRECTIVES: require("#config/securityConfig.js").CSP_DIRECTIVES,

  // Middleware
  resolveReturnUrl: require("#middleware/resolveReturnUrl.js"),
  securityPolicy: require("#middleware/applyProductionSecurity.js")
    .securityPolicy,

  presentation: require("#controllers/presentationController.js"),

  qualifyLink: requireparentExports("#utils/qualifyLinks").qualifyLink,
};

const flattened = Object.entries(exports).reduce((acc, [groupKey, val]) => {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    Object.assign(acc, val); // flatten members
    acc[groupKey] = val; // keep namespace
  } else {
    acc[groupKey] = val; // primitives/functions: namespace only
  }
  return acc;
}, {});

module.exports = flattened;
