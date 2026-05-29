const express = require("express");
const router = express.Router();

function getRoutes() {
  const { getBaseUrl } = require("./../../src/utils/baseUrl.js");
  try {
    // const hexascriptDocs = require(`${meta.content}/docs/hexascript/src/script.js`);
    // logger.info("hexascriptDocs", { hexascriptDocs });
    // router.use("/hexa-docs", hexascriptDocs);
    const resume = require("./resume");
    const stack = require("@controllers/techkStackController.js").bind(this);
    const presentation = require("@controllers/presentation.js");

    router.get("/stack", stack);
    router.use("/projects/website-presentation", presentation);
    router.use("/resume", resume);
  } catch (e) {
    console.error(`Missing module: ${e.message}`, e.stack);
  }
  const { node_env, content: contentPath } = this.meta;

  console.log(this);
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
