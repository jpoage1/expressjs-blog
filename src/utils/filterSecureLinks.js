// src/utils/filterSecureLinks.js
function filterSecureLinks(links, isAuthenticated) {
  return links
    .filter(link => isAuthenticated || !link.secure)
    .map(link => {
      const item = { ...link };
      if (item.submenu) {
        item.submenu = filterSecureLinks(item.submenu, isAuthenticated);
        if (!item.submenu.length) delete item.submenu;
      }
      return item;
    });
}
module.exports = filterSecureLinks
