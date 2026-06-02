const express = require("express");
const router = express.Router();

const { presentation } = require("../../src/api.js");

const stack = require("#controllers/techStackController.js").bind(this);

function getRoutes() {
  try {
    router.get("/stack", stack);
    router.use("/projects/website-presentation", presentation);
  } catch (e) {
    console.error(`Missing module: ${e.message}`, e.stack);
  }
  const { node_env, content: contentPath } = this.meta;

  const baseUrl = this.public.baseUrl;
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
