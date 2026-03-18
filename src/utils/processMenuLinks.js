// src/utils/processMenuLinks.js
function processMenuLinks(links, isAuthenticated, currentPath) {
  return links
    .filter((link) => isAuthenticated || !link.secure)
    .map((link) => {
      const item = { ...link };
      if (item.appendCurrentPath && typeof item.href === "string") {
        if (currentPath !== "/" && !item.href.endsWith(currentPath)) {
          item.href = item.href + currentPath;
        }
      } else if (item.html) {
        item.href = `/docs/hexa/${item.html}`; // fixme
      } else if (item.frame) {
        item.href = `/docs/hexa/${item.frame}`; // fixme
      } else if (item.mermaid) {
        item.href = `/docs/hexa/${item.mermaid}`; // fixme
      }
      if (item.submenu) {
        item.submenu = processMenuLinks(
          item.submenu,
          isAuthenticated,
          currentPath,
        );
        if (!item.submenu.length) delete item.submenu;
      }
      return item;
    });
}
module.exports = processMenuLinks;
