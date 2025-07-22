// src/routes/docs/index.js
const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const yaml = require("js-yaml");

const router = express.Router();
const docsContext = require("../utils/docsContext");
const HttpError = require("../utils/HttpError");

const docsDir = path.join(__dirname, "../../content/docs");
let docsCache = {}; // { [path]: { modules: {}, crossCuttingSummary: {} } }

async function loadDocFile(filePath) {
  if (docsCache[filePath]) return docsCache[filePath];
  try {
    const fullPath = path.join(docsDir, filePath + ".yaml");
    const fileContent = await fs.readFile(fullPath, "utf-8");
    const parsed = yaml.load(fileContent);
    const crossCuttingSummary = parsed.crossCuttingSummary || null;
    delete parsed.crossCuttingSummary;
    docsCache[filePath] = {
      modules: parsed,
      crossCuttingSummary,
    };
    return docsCache[filePath];
  } catch (e) {
    console.error(e.stack);
    return null;
  }
}

// /docs/summary - aggregate crossCuttingSummary from all cached docs
router.get("/summary", async (req, res) => {
  const summaries = [];
  const files = await fs.readdir(docsDir);
  const yamlFiles = files
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.slice(0, -5));
  for (const file of yamlFiles) {
    const doc = await loadDocFile(file);
    if (doc?.crossCuttingSummary) {
      summaries.push({ path: file, summary: doc.crossCuttingSummary });
    }
  }

  const context = await docsContext(req.isAuthenticated, {
    layout: "docs",
    docPath: "/docs/summary",
    docModule: null,
  });

  res.render("docs/summary", {
    ...context,
    summaries,
  });
});

// /docs/:path - show all modules in a YAML file
router.get("/:path", async (req, res) => {
  const { path: docPath } = req.params;
  const doc = await loadDocFile(docPath);

  const context = await docsContext(req.isAuthenticated, {
    layout: "docs",
    docPath: "/docs" + docPath,
    docModule: null,
  });

  // Precompute links
  const modulesWithLinks = Object.entries(doc.modules).map(([key, value]) => ({
    name: key,
    url: `${baseUrl}/docs/${docPath}/${key}`,
  }));

  res.render("docs/path", {
    ...context,

    path: docPath,
    crossCuttingSummary: doc.crossCuttingSummary,
    modules: modulesWithLinks,
  });
});

// /docs/:path/:module - show single module from YAML file
router.get("/:path/:module", async (req, res, next) => {
  const { path: docPath, module } = req.params;
  const doc = await loadDocFile(docPath);
  if (!doc) return next(new HttpError("Documentation not found", 404));
  const moduleDoc = doc.modules[module];
  if (!moduleDoc)
    return next(new HttpError("Module documentation not found", 404));

  const context = await docsContext(req.isAuthenticated, {
    layout: "docs",
    docPath,
    docModule: module,
  });

  res.render("docs/module", {
    ...context,
    moduleDoc,
  });
});

// /docs - list all doc files
router.get("/", async (req, res) => {
  try {
    const files = await fs.readdir(docsDir);
    const yamlFiles = files
      .filter((f) => f.endsWith(".yaml"))
      .map((f) => f.slice(0, -5));

    const context = await docsContext(req.isAuthenticated, {
      layout: "docs",
      docPath: null,
      docModule: null,
    });

    res.render("docs/index", {
      ...context,
      docsPaths: yamlFiles,
    });
  } catch (err) {
    req.log.error(err.stack);
    next(new HttpError("Failed to read docs directory", 500));
  }
});

module.exports = router;
