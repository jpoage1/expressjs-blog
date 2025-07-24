// src/utils/docsContext.js
const path = require("path");
const fs = require("fs/promises");
const yaml = require("js-yaml");

const { qualifyNavLinks } = require("./qualifyLinks");
const { baseUrl } = require("./baseUrl");
const generateDocsMenuModel = require("./generateDocsMenuModel");
const navLinks = require(path.join(__dirname, "../../content/navLinks.json"));
const processMenuLinks = require("../utils/processMenuLinks");

const getSiteTitle = (owner) => `${owner}'s Software Blog`;

const YAML_DOCS_DIR = path.join(__dirname, "../../content/docs");

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
module.exports = async function getDocsContext(
  isAuthenticated,
  overrides = {}
) {
  const filteredNavLinks = processMenuLinks(navLinks, isAuthenticated);
  const qualifiedNavLinks = qualifyNavLinks(filteredNavLinks);
  const siteOwner = process.env.SITE_OWNER;

  const allYamlDocs = await loadAllYamlDocs();
  const currentPath = overrides.docPath || null;
  console.debug(`overrides: ${JSON.stringify(overrides)}`);
  console.debug(`current Path: ${currentPath}`);
  const currentModule = overrides.docModule || null;
  const docsMenu = generateDocsMenuModel(
    allYamlDocs,
    currentPath,
    currentModule
  );

  const context = {
    title: getSiteTitle(siteOwner),
    siteOwner,
    originCountry: process.env.COUNTRY,
    navLinks: qualifiedNavLinks,
    baseUrl,
    paths: docsMenu,
    isAuthenticated,
    showFooter: true,
    showSidebar: true,
    ...overrides,
  };

  return context;
};
