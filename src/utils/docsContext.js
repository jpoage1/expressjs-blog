// src/utils/docsContext.js
const path = require("path");
const fs = require("fs/promises");
const yaml = require("js-yaml");

const config = require("#config");
const generateDocsMenuModel = require("./generateDocsMenuModel.js");
const { qualifyNavLinks, processMenuLinks } = require("@jpoage1/base-context");

const { meta } = require("#config");
const navLinks = require(
  path.resolve(path.join(meta.content, "config/navLinks.json")),
);

const getSiteTitle = (owner) => `${owner}'s Software Blog`;

const YAML_DOCS_DIR = path.join(meta.content, "/docs");

/**
 * Load and parse all YAML documentation files in content/docs/
 * Returns an object keyed by filename (without .yaml) with YAML content
 */
async function loadAllYamlDocs() {
  const entries = {};
  const files = await fs.readdir(YAML_DOCS_DIR);

  for (const file of files) {
    if (!file.endsWith(".yaml")) continue;
    const fullPath = path.join(YAML_DOCS_DIR, file);
    const content = await fs.readFile(fullPath, "utf8");
    const parsed = yaml.load(content);
    const key = path.basename(file, ".yaml");
    entries[key] = parsed;
  }

  return entries;
}

/**
 * Base context generator
 */
module.exports = async function getDocsContext(session, overrides = {}) {
  const filteredNavLinks = processMenuLinks(navLinks, session);
  const qualifiedNavLinks = qualifyNavLinks(filteredNavLinks);
  const siteOwner = meta.site_owner;

  const allYamlDocs = await loadAllYamlDocs();
  const currentPath = overrides.docPath || null;
  const currentModule = overrides.docModule || null;
  const docsMenu = generateDocsMenuModel(
    allYamlDocs,
    currentPath,
    currentModule,
  );

  const context = {
    title: getSiteTitle(siteOwner),
    siteOwner,
    originCountry: meta.country,
    navLinks: qualifiedNavLinks,
    baseUrl: config.public.baseUrl,
    paths: docsMenu,
    isAuthenticated: session.isAuthenticated,
    showFooter: true,
    showSidebar: true,
    ...overrides,
  };

  return context;
};
