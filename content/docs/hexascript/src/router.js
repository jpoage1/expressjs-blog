const navLinks = require("./navLinks.json");
const fs = require('node:fs');
const express = require("express")
const router = express.Router()

export function htmlController(req, res) {}
export function mermaidController(req, res) {}
export function frameController(req, res) {}

export function getContext(type, path) {
  let filePath = null;
  let controllor;
  let route;
  switch (type) {
    case "html":
      /**
       * Injects html directly into the content area
       * <div class="html_content"></div>
       */
      filePath = path.join("html", path + ".html");
      controllor = htmlController;
      route = `${path}`
      break;
    case: "mermaid":
      /**
       * Injects a mermaid file directly into the content area
       * <pre class="mermaid"></pre>
       */
      filePath= path.join("diagrams", path + ".mmd");
      controllor = mermaidController;
    case "frame":
      /**
       * Injects an iframe into the content area
       * <iframe src="${route}"></iframe>
       */
      controllor = frameController;
      break;
    default:
      throw new Error(`Invalid option: ${type}`)
  }
  if ( filePath != null) {
   fileContent = await fs.readFile(filePath, 'utf8');
  }
  return {
    path, controller
    ,route: `diagram/${path}`,
    content: fileContent

  }
}
function router() {
navLinks.forEach((navLink) => {
  const keys = Object.keys(navLink);
  keys.forEach( key => {

  // -- Html Injection
  if (keys.indexOf("html") != -1) {
    context = getContext("html", path)
  }
  // -- Mermaid Diagram Injection
  if (keys.indexOf("mermaid") != -1) {
    context = getContext("mermaid", path)
    const fileContent
  }
  // -- Frame Injection
  if (keys.indexOf("frame") != -1) {
    context = getContext("frame", path)
  }
    router.get(context.path, context.controller)

  })
});

  return router
}
module.exports = router()
