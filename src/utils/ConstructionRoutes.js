// src/utils/ConstructionRoutes.js
const BaseRoute = require("./BaseRoute.js");

class ConstructionRoutes extends BaseRoute {
  constructor() {
    super();
  }

  register(path, title) {
    this.router.get(path, async (req, res) => {
      const context = { title };
      res.locals.renderWithBaseContext("pages/construction.handlebars", context);
    });
  }
}

module.exports = ConstructionRoutes;
