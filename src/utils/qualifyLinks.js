const { baseUrl } = require("../utils/baseUrl");
// const baseUrl = getBaseUrl({ protocol: req.protocol, host: req.get("host") });

function qualifyLink(href) {
  if (!href) return href;
  // Return unchanged if href is absolute URL or protocol-relative
  if (/^(?:[a-zA-Z][a-zA-Z\d+\-.]*:)?\/\//.test(href)) return href;
  // Prefix with baseUrl if relative
  return baseUrl + href;
}

function qualifyNavLinks(links) {
  return links.map(link => {
    const qualified = { ...link };
    if (qualified.href) {
      qualified.href = qualifyLink(qualified.href);
    }
    if (qualified.submenu) {
      qualified.submenu = qualifyNavLinks(qualified.submenu);
    }
    return qualified;
  });
}

module.exports = { qualifyNavLinks, qualifyLink }
