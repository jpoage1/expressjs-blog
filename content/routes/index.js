const express = require("express");
const router = express.Router();

function getRoutes() {
  try {
    // const hexascriptDocs = require(`${meta.content}/docs/hexascript/src/script.js`);
    // logger.info("hexascriptDocs", { hexascriptDocs });
    // router.use("/hexa-docs", hexascriptDocs);
    const stack = require("##controllers/techkStackController").bind(this);
    const presentation = require("##controllers/presentation");

    router.get("/stack", stack);
    router.use("/projects/website-presentation", presentation);
  } catch (e) {
    console.error(`Missing module: ${e.message}`, e.stack);
  }
  const { node_env, content: contentPath } = this.meta;

  return {
    constructionRoutes: [
      { path: "/changelog", title: "Changelog" },
      { path: "/archive", title: "Archive" },
      { path: "/", title: "Home" },
    ],
    markdownRoutes: [{ path: "/about/blog", file: "projects/about-blog" }],
    htmlRoutes: [],
    router,
  };
}
module.exports = getRoutes;
