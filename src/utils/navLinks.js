const path = require("path");
const { meta } = require("#config");

const _navLinks = [
  path.join(meta.content, "config/navLinks.json"),
  path.join(meta.content, "config/navLinks.js"),
];

function _getNavLinks(navLinks) {
  let resolved;
  for (navLinks of navLinks) {
    resolved = path.resolve(navLinks);
    if (resolved) return require(resolved);
  }
  throw new Error(
    `nav links not found in ${JSON.stringify(navLinks, null, 2)}`,
  );
}
module.exports = _getNavLinks(_navLinks);
