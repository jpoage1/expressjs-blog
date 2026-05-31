const express = require("express");
const router = express.Router();

function getRoutes() {
  const { getBaseUrl } = require("./../../src/utils/baseUrl.js");
  try {
    // const hexascriptDocs = require(`${meta.content}/docs/hexascript/src/script.js`);
    // logger.info("hexascriptDocs", { hexascriptDocs });
    // router.use("/hexa-docs", hexascriptDocs);
    const stack = require("#controllers/techStackController.js").bind(this);
    const presentation = require("#controllers/presentationController.js");

    router.get("/stack", stack);
    router.use("/projects/website-presentation", presentation);
  } catch (e) {
    console.error(`Missing module: ${e.message}`, e.stack);
  }
  const { node_env, content: contentPath } = this.meta;

  const baseUrl = getBaseUrl(this.public);
  return {
    constructionRoutes: [
      { path: "/changelog", title: "Changelog" },
      { path: "/archive", title: "Archive" },
      { path: "/", title: "Home" },
    ],
    markdownRoutes: [{ path: "/about/blog", file: "projects/about-blog" }],
    htmlRoutes: [],
    router,
    redirects: {
      "/": `${baseUrl}/projects`,
      // Add more redirects as needed
      // '/old-path': '/new-path',
    },
  };
}
module.exports = getRoutes;
