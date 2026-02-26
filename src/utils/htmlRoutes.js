// src/utils/HtmlRoutes.js
const express = require("express");
const BaseRoute = require("./BaseRoute");
const fs = require("fs/promises");
const path = require("path");
const yaml = require("js-yaml");
const { baseUrl } = require("./baseUrl.js");

class HtmlRoutes extends BaseRoute {
  constructor() {
    super();
  }

  /**
   * @param {string} routePath - The URL path (e.g., '/about')
   * @param {string} htmlFile - Filename in content/pages/ (e.g., 'resume' for resume.html)
   * @param {string} handlebarsFile - The template to wrap the HTML in
   */
  async register(routePath, contentFolder) {
    // Use the 'contentFolder' argument to find the directory
    const folderPath = path.join(
      __dirname,
      `../../content/html/${contentFolder}`,
    );
    const configPath = path.join(folderPath, `config.yaml`);

    const configRaw = await fs.readFile(configPath, "utf8");
    const pageConfig = yaml.load(configRaw);

    // Fetch the actual HTML file name from the YAML config
    const filePath = path.join(folderPath, pageConfig.file);
    const htmlContent = await fs.readFile(filePath, "utf8");

    const assetsDir = path.join(
      __dirname,
      `../../content/html/${pageConfig.slug}`,
    );

    // The router's endpoint
    const assetsRouterPath = path.join(routePath, "assets");

    // -- The uri
    const assetsUri = baseUrl + assetsRouterPath;

    const extraStyles = pageConfig.styles.map(
      (stylePath) => assetsUri + "/" + stylePath,
    );
    const extraScripts = pageConfig.scripts.map(
      (scriptsPath) => assetsUri + "/" + scriptsPath,
    );

    const context = {
      title: pageConfig.title || "Default Title",
      slug: routePath,
      content: htmlContent,
      extraStyles: extraStyles || [],
      extraScripts: extraScripts || [],
      meta: pageConfig.meta || {},
    };

    /*
    console.log("Assets Router Path", assetsRouterPath);
    console.log("Assets URI", assetsUri);
    console.log("Assets Dir", assetsDir);
    console.log("extraScripts", extraScripts);
    console.log("extraStyles", extraStyles);
    */

    this.router.use(assetsRouterPath, express.static(assetsDir));
    this.router.get(routePath, async (req, res, next) => {
      // Renders the web page on each request
      // Moving the logic outside of the function would read contents ahead of time
      // Keeping the logic intact would allow editing files without reloading the server
      try {
        res.renderWithBaseContext(`pages/${pageConfig.page}`, context);
      } catch (err) {
        err.statusCode = 500;
        next(err);
      }
    });
  }
}

module.exports = HtmlRoutes;
