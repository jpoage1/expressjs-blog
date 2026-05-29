const { getBaseUrl } = require("../utils/baseUrl");
const config = require("../config/loader");

const baseUrl = getBaseUrl(config.public);

const isDisabled = (item) => item?.disabled ?? false;
const isEnabled = (item) => !isDisabled(item);

function qualifyLink(href, baseUrl = "") {
  if (!href) return href;
  // Return unchanged if href is absolute URL or protocol-relative
  if (/^(?:[a-zA-Z][a-zA-Z\d+\-.]*:)?\/\//.test(href)) return href;
  // Prefix with baseUrl if relative
  return baseUrl + href;
}

const mapMenuTree = (links, transformFn) => {
  return links.filter(isEnabled).map((link) => {
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
  return links.filter(isEnabled).map((item) => {
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

module.exports = {
  qualifyNavLinks,
  mapMenuTree,
  qualifySitemapLinks,
  qualifyLink,
};
