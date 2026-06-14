const path = require("path");
const navLinks = require(path.resolve(__dirname, "../config.json"));
const { promises: fs } = require("node:fs");
const express = require("express");
const router = express.Router();
const processMenuLinks = require(
  path.join(__dirname, "../../../../src/utils/processMenuLinks"),
);

const { logger } = require("../../../../src/utils/logging");

async function getContext(type, pathPrefix, navLink) {
  let filePath = null;
  let fileName = null;
  let controller;
  let route;
  switch (type) {
    case "html":
      /**
       * Injects html directly into the content area
       * <div class="html_content"></div>
       */
      fileName = navLink.html;
      filePath = path.join(__dirname, "..", "html", fileName + ".html");
      route = `/${fileName}`;
      break;
    case "mermaid":
      /**
       * Injects a mermaid file directly into the content area
       * <pre class="mermaid"></pre>
       */
      fileName = navLink.mermaid;
      filePath = path.join(__dirname, "..", fileName + ".mmd");
      route = `/${fileName}`;
    case "frame":
      /**
       * Injects an iframe into the content area
       * <iframe src="${route}"></iframe>
       */
      fileName = navLink.frame;
      route = navLink.frame;
      route = `/${navLink.mermaid}`;
      break;

    case "submenu":
      route = null;
      break;
    default:
      throw new Error(`Invalid option: ${type}`);
  }
  let fileContent;
  try {
    fileContent = filePath
      ? Promise.resolve(fs.readFile(filePath, "utf8"))
      : null;
  } catch (e) {
    logger.error(e.stack);
  }
  return {
    type,
    path: filePath,
    route,
    content: fileContent,
  };
}
const templatePath = path.resolve(__dirname, "../design_docs.hbs");
const rootPath = path.join("..", "..");
const layoutPath = path.join(rootPath, "src/views/layouts/main.handlebars");
const hbs = require("hbs");
function controller(context) {
  return (req, res) => {
    hbs.registerPartials(__dirname);
    const links = processMenuLinks(navLinks, res.locals.session, req.path);
    const ctx = {
      ...res.locals.baseContext,
      ...context,
      navLinks: links,
      layout: "main.handlebars",
      showSidebar: false,
    };
    res.render("design_docs.handlebars", ctx);
  };
}
function generateRouter(links, pathPrefix = "./") {
  for (const navLink of links) {
    let context = {};
    try {
      // -- Html Injection
      if (navLink.html) {
        context = getContext("html", pathPrefix, navLink);
      }
      // -- Mermaid Diagram Injection
      else if (navLink.mermaid) {
        context = getContext("mermaid", pathPrefix, navLink);
      }
      // -- Frame Injection
      else if (navLink.frame) {
        context = getContext("frame", pathPrefix, navLink);
        // logger.info(context);
      }
      // -- Submenu
      else if (navLink.submenu) {
        // Loop again
        generateRouter(navLink.submenu, pathPrefix);
        // logger.info(context);
      } else {
        throw new Error("No options found", navLink);
      }
      // let route;
      // logger.info("Route: ", {
      //   debug: [context, context["route"], context.route],
      // });
      if (context.route) {
        route = path.join(pathPrefix, context.route);

        router.get(route, controller(context));
        logger.info(`Registered Route: ${route}`);
      }
    } catch (e) {
      logger.error("Context: ", e);
    }
  }
  router.get("/", controller({}));
  return router;
}

module.exports = generateRouter(navLinks);
