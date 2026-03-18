const { baseUrl } = require("../utils/baseUrl");

function qualifyLink(href) {
  if (!href) return href;
  // Return unchanged if href is absolute URL or protocol-relative
  if (/^(?:[a-zA-Z][a-zA-Z\d+\-.]*:)?\/\//.test(href)) return href;
  // Prefix with baseUrl if relative
  return baseUrl + href;
}

function qualifyNavLinks(links) {
  return links.map((link) => {
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
const mapMenuTree = (links, transformFn) => {
  return links.map((link) => {
    const processed = transformFn({ ...link });
    if (processed.submenu) {
      processed.submenu = mapMenuTree(processed.submenu, transformFn);
    }
    return processed;
  });
};

function qualifyNavLinks(links, baseUrl) {
  return mapMenuTree(links, (link) => {
    if (link.href) {
      link.href = qualifyLink(link.href, baseUrl);
    }
    return link;
  });
}

function qualifySitemapLinks(links) {
  return links.map((item) => {
    const qualified = { ...item };

    if (typeof qualified.loc === "string") {
      qualified.loc = qualifyLink(qualified.loc);
    }

    if (Array.isArray(qualified.children)) {
      qualified.children = qualifySitemapLinks(qualified.children);
    }

    return qualified;
  });
}

module.exports = { qualifyNavLinks, qualifySitemapLinks, qualifyLink };
