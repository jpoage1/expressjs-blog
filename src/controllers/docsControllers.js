const fs = require("fs/promises");
const { qualifyLink } = require("../utils/qualifyLinks");
const { baseUrl } = require("../utils/baseUrl");
const HttpError = require("../utils/HttpError");
const docsContext = require("../utils/docsContext");
const {
  loadDocFile,
  filterModuleSecurityKeys,
  getYamlFileNames,
  docsDir,
} = require("../services/docsService");

exports.renderDocsIndex = async (req, res, next) => {
  try {
    const yamlFiles = await getYamlFileNames();
    const context = await docsContext(req.isAuthenticated, {
      layout: "docs",
      docPath: "/docs",
      docModule: null,
    });

    res.render("docs/index", {
      ...context,
      docsPaths: yamlFiles.map((name) => `${req.baseUrl || ""}/${name}`),
    });
  } catch (err) {
    req.log.error(err.stack);
    next(new HttpError("Failed to read docs directory", 500));
  }
};

exports.renderDocsSummary = async (req, res, next) => {
  try {
    const summaries = [];
    const yamlFiles = await getYamlFileNames();

    for (const file of yamlFiles) {
      const doc = await loadDocFile(file);
      if (doc?.crossCuttingSummary) {
        summaries.push({ path: file, summary: doc.crossCuttingSummary });
      }
    }

    const context = await docsContext(req.isAuthenticated, {
      layout: "docs",
      docPath: baseUrl + "/docs/summary",
      docModule: null,
    });

    res.render("docs/summary", {
      ...context,
      summaries,
    });
  } catch (err) {
    next(err);
  }
};

exports.renderDocsByType = async (req, res, next) => {
  const { moduleType: docPath } = req.params;
  const doc = await loadDocFile(docPath);

  const context = await docsContext(req.isAuthenticated, {
    layout: "docs",
    docPath: baseUrl + "/docs" + docPath,
    docModule: null,
  });

  const modulesWithLinks = Object.entries(doc.modules).map(([key]) => ({
    name: key,
    url: `${baseUrl}/docs/${docPath}/${key}`,
  }));

  res.render("docs/path", {
    ...context,
    docsHome: qualifyLink("/docs"),
    pathName: docPath,
    crossCuttingSummary: doc.crossCuttingSummary,
    modules: modulesWithLinks,
  });
};

exports.renderDocsModule = async (req, res, next) => {
  const { moduleType: docPath, module } = req.params;
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
    docsHome: qualifyLink("/docs"),
    pathUrl: qualifyLink("/docs/" + docPath),
    pathName: docPath,
    module,
    moduleDoc: filterModuleSecurityKeys(moduleDoc),
  });
};
