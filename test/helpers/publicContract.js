import assert from "node:assert";
import path from "node:path";
import { promises as fs } from "node:fs";

import { createProcessMenuLinks } from "@jpoage1/base-context";
import matter from "gray-matter";
import yaml from "js-yaml";
import { glob } from "glob";

const FETCH_TIMEOUT_MS = 10_000;
const CONTENT_PATH = "content";
const ANONYMOUS_SESSION = {
  nonce: "smoke-test",
  isAuthenticated: false,
  user: "anonymous",
  groups: [],
};

const hasInternalPath = (value) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("/#");

const normalizePath = (value) => {
  const url = new URL(value, "https://jasonpoage.com");
  return url.pathname;
};

const flattenTree = (items = []) =>
  items.flatMap((item) => [
    item,
    ...flattenTree(Array.isArray(item.children) ? item.children : item.submenu),
  ]);

const readJson = async (filePath) =>
  JSON.parse(await fs.readFile(filePath, "utf8"));

const collectNavPaths = async () => {
  const navLinks = await readJson(path.join(CONTENT_PATH, "navLinks.json"));
  const processMenuLinks = createProcessMenuLinks();
  const visibleLinks = processMenuLinks(navLinks, ANONYMOUS_SESSION, "/");

  return flattenTree(visibleLinks)
    .filter((item) => !item.disabled)
    .map((item) => item.href)
    .filter(hasInternalPath)
    .map(normalizePath);
};

const collectSitemapSeedPaths = async () =>
  flattenTree(await readJson(path.join(CONTENT_PATH, "sitemap.json")))
    .map((item) => item.loc)
    .filter(hasInternalPath)
    .map(normalizePath);

const getPublishedMarkdownData = async () => {
  const files = await glob(`${CONTENT_PATH}/**/*.md`);
  const parsed = await Promise.all(
    files.map(async (file) => {
      try {
        return {
          file,
          parsed: matter(await fs.readFile(file, "utf8")),
        };
      } catch {
        return null;
      }
    }),
  );

  return parsed
    .filter(Boolean)
    .map(({ file, parsed }) => ({ file, data: parsed.data }))
    .filter(({ data }) => data.published === true);
};

const collectBlogPostPaths = (publishedMarkdown) =>
  publishedMarkdown
    .filter(({ file }) => file.startsWith(`${CONTENT_PATH}/posts/`))
    .map(({ file }) => {
      const parsedPath = path.parse(file);
      const [year, month] = parsedPath.dir
        .replace(`${CONTENT_PATH}/posts/`, "")
        .split("/");
      return `/blog/${year}/${month}/${parsedPath.name}`;
    });

const slugifyTag = (tag) => tag.toLowerCase().replace(/\s+/g, "-");

const collectTagPaths = (publishedMarkdown) => [
  "/tags",
  ...new Set(
    publishedMarkdown
      .flatMap(({ data }) => (Array.isArray(data.tags) ? data.tags : []))
      .filter((tag) => typeof tag === "string")
      .map((tag) => `/tags/${slugifyTag(tag.trim())}`),
  ),
];

const collectDocsPaths = async () => {
  const docsFiles = await glob(`${CONTENT_PATH}/docs/*.yaml`);
  const docsModules = await Promise.all(
    docsFiles.map(async (file) => {
      const moduleType = path.basename(file, ".yaml");
      const parsed = yaml.load(await fs.readFile(file, "utf8")) || {};
      return Object.keys(parsed)
        .filter((moduleName) => moduleName !== "Cross Cutting Summary")
        .map((moduleName) => `/docs/${moduleType}/${moduleName}`);
    }),
  );

  return ["/docs", "/docs/summary", ...docsModules.flat()];
};

export const assertMarkdownFrontmatterParses = async () => {
  const files = await glob(`${CONTENT_PATH}/**/*.md`);
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        matter(await fs.readFile(file, "utf8"));
        return null;
      } catch (err) {
        return `${file}: ${err.message.split("\n")[0]}`;
      }
    }),
  );
  const failures = results.filter(Boolean);

  assert.deepStrictEqual(
    failures,
    [],
    `markdown frontmatter parse failures:\n${failures.join("\n")}`,
  );
};

export const collectPublicContractPaths = async () => {
  const publishedMarkdown = await getPublishedMarkdownData();
  const pathGroups = await Promise.all([
    collectNavPaths(),
    collectSitemapSeedPaths(),
    collectDocsPaths(),
  ]);
  const allPaths = [
    ...pathGroups.flat(),
    ...collectBlogPostPaths(publishedMarkdown),
    ...collectTagPaths(publishedMarkdown),
  ];

  return [...new Set(allPaths)].sort();
};

export const fetchPathStatus = async (baseUrl, requestPath) => {
  const res = await fetch(`${baseUrl}${requestPath}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  return {
    path: requestPath,
    status: res.status,
    finalUrl: res.url,
  };
};

export const assertPublicContractIsHealthy = async (baseUrl) => {
  const paths = await collectPublicContractPaths();
  const results = await Promise.all(
    paths.map(async (requestPath) => {
      try {
        return await fetchPathStatus(baseUrl, requestPath);
      } catch (err) {
        return {
          path: requestPath,
          error: `${err.name}: ${err.message}`,
        };
      }
    }),
  );
  const failures = results
    .filter((result) => result.error || result.status >= 400)
    .map((result) =>
      result.error
        ? `${result.path} -> ${result.error}`
        : `${result.path} -> HTTP ${result.status}`,
    );

  assert.deepStrictEqual(
    failures,
    [],
    `public contract routes failed:\n${failures.join("\n")}`,
  );
};
