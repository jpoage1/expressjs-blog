// generateDocsMenuModel.js

/**
 * Transforms loaded YAML docs data into a structured menu model for the docsMenu partial.
 * @param {Object} allDocs - Parsed YAML content keyed by path (filename), values are module objects.
 * @param {String} currentPath - Optional, path currently viewed (for UI state).
 * @param {String} currentModule - Optional, module currently viewed (for UI state).
 * @returns {Array} Array of path objects with modules array.
 */
function generateDocsMenuModel(
  allDocs,
  currentPath = null,
  currentModule = null
) {
  return Object.entries(allDocs).map(([path, modules]) => {
    // modules is an object with module keys and values being their doc data
    // filter out crossCuttingSummary key if present
    const filteredModules = Object.entries(modules).filter(
      ([modKey]) => modKey !== "crossCuttingSummary"
    );

    return {
      name: path,
      isActive: path === currentPath,
      modules: filteredModules.map(([modKey, modData]) => ({
        name: modKey,
        displayName: modKey,
        isActive: path === currentPath && modKey === currentModule,
      })),
    };
  });
}

function formatModuleName(moduleKey) {
  // Convert camelCase or snake_case to spaced words with initial caps
  // Example: newsletterService => Newsletter Service, posts_menu => Posts Menu
  const withSpaces = moduleKey
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ");
  return withSpaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

module.exports = generateDocsMenuModel;
