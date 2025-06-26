// src/utils/ConstructionRoutes.js
const BaseRoute = require("./BaseRoute");
const getBaseContext = require("./baseContext");

class ConstructionRoutes extends BaseRoute {
  constructor() {
    super();
  }

  register(path, title) {
    this.router.get(path, async (req, res) => {
      const context = await getBaseContext({ title });
      res.render("pages/construction.handlebars", context);
    });
  }
}

module.exports = ConstructionRoutes;
