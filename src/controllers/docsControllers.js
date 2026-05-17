const fs = require("fs/promises");
const path = require("path");
const { createHash } = require("crypto");
const HttpError = require("../utils/HttpError");
const docsContext = require("../utils/docsContext");
const {
  loadDocFile,
  filterModuleSecurityKeys,
  getYamlFileNames,
  docsDir,
} = require("../services/docsService");

function computeHash(input) {
  return createHash("sha1").update(input).digest("hex");
}

async function checkDocCache(req, fileNamesOrPath, namespace = "") {
  const files = Array.isArray(fileNamesOrPath)
    ? fileNamesOrPath
    : [fileNamesOrPath];

  const statPaths = await Promise.all(
    files.map(async (f) => {
      const filePath = path.join(docsDir, f + ".yaml");
      try {
        const stat = await fs.stat(filePath);
        return stat;
      } catch (err) {
        throw new Error(`${err.message}`);
      }
    }),
  );

  const lastModified = new Date(
    Math.max(...statPaths.map((s) => s.mtimeMs)),
  ).toUTCString();

  const hashBase = Array.isArray(fileNamesOrPath)
    ? fileNamesOrPath.join(",")
    : fileNamesOrPath;

  const etag = `"${computeHash(namespace + hashBase)}"`;

  const result = req.checkCacheHeaders({ etag, lastModified });

  return result;
}

exports.renderDocsIndex = async (req, res, next) => {
  try {
    const yamlFiles = await getYamlFileNames();

    // Read from cache
    const docCache = await checkDocCache(req, yamlFiles);
    if (docCache) return docCache;

    const context = await docsContext(res.locals.session, {
      layout: "docs",
      docPath: "/docs",
      docModule: null,
    });
    try {
      res.render("docs/index", {
        ...context,
        docsPaths: yamlFiles.map(
          (name) => `${res.locals.baseUrl || ""}/${name}`,
        ),
      });
    } catch (err) {
      return next(
        new HttpError(
          `Failed to render page: ${err.message ?? err}`,
          424,
          err.stack,
        ),
      );
    }
  } catch (err) {
    return next(
      new HttpError(
        `Failed to read docs directory: ${err.message ?? err}`,
        500,
        err.stack,
      ),
    );
  }
};

exports.renderDocsSummary = async (req, res, next) => {
  try {
    const summaries = [];
    const yamlFiles = await getYamlFileNames();

    // Read from cache
    if (await checkDocCache(req, yamlFiles, "summary")) return;

    for (const file of yamlFiles) {
      const doc = await loadDocFile(file);
      if (doc?.crossCuttingSummary) {
        summaries.push({ path: file, summary: doc.crossCuttingSummary });
      }
    }

    const context = await docsContext(res.locals.session, {
      layout: "docs",
      docPath: res.locals.baseUrl + "/docs/summary",
      docModule: null,
    });
    try {
      res.render("docs/summary", {
        ...context,
        summaries,
      });
    } catch (err) {
      return next("Failed to render page", 424, err.stack);
    }
  } catch (err) {
    return next(err);
  }
};

exports.renderDocsByType = async (req, res, next) => {
  if (!res.locals.session) {
    next(new Error("No session"));
  }
  const { moduleType: docPath } = req.params;

  // Read from cache
  if (await checkDocCache(req, docPath)) return;

  const doc = await loadDocFile(docPath);
  if (!doc) return next(new HttpError("Documentation not found", 404));

  const context = await docsContext(res.locals.session, {
    layout: "docs",
    docPath: res.locals.baseUrl + "/docs" + docPath,
    docModule: null,
  });

  const modulesWithLinks = Object.entries(doc.modules).map(([key]) => ({
    name: key,
    url: `${res.locals.baseUrl}/docs/${docPath}/${key}`,
  }));
  try {
    res.render("docs/path", {
      ...context,
      docsHome: res.locals.qualifyLink("/docs"),
      pathName: docPath,
      crossCuttingSummary: doc.crossCuttingSummary,
      modules: modulesWithLinks,
    });
  } catch (e) {
    return next(
      new HttpError(`Failed to render docs: ${e.message}`, 424, err.stack),
    );
  }
};

exports.renderDocsModule = async (req, res, next) => {
  const { moduleType: docPath, module } = req.params;

  // Read from cache
  if (await checkDocCache(req, docPath)) return;

  const doc = await loadDocFile(docPath);
  if (!doc) return next(new HttpError("Documentation not found", 404));

  const moduleDoc = doc.modules[module];
  if (!moduleDoc)
    return next(new HttpError("Module documentation not found", 404));

  const context = await docsContext(res.locals.session, {
    layout: "docs",
    docPath,
    docModule: module,
  });

  try {
    res.render("docs/module", {
      ...context,
      docsHome: res.locals.qualifyLink("/docs"),
      pathUrl: res.locals.qualifyLink("/docs/" + docPath),
      pathName: docPath,
      module,
      moduleDoc: filterModuleSecurityKeys(moduleDoc),
    });
  } catch (err) {
    return next(new HttpError("Failed to render page", 424, err.stack));
  }
};
