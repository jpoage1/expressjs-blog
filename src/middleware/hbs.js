// src/middleware/hbs.js
const path = require("path");
const exphbs = require("express-handlebars");
const { registerHelpers } = require("../utils/hbsHelpers");
const {
  VIEW_ENGINE,
  LAYOUTS_DIR,
  PARTIALS_DIR,
  DEFAULT_LAYOUT,
  EXTENSION,
  RUNTIME_OPTIONS,
} = require("../constants/hbsConstants");

const hbsMiddleware = (req, res, next) => {
  if (!req.app.get("view engine")) {
    const hbs = exphbs.create({
      layoutsDir: path.join(__dirname, LAYOUTS_DIR),
      partialsDir: path.join(__dirname, PARTIALS_DIR),
      defaultLayout: DEFAULT_LAYOUT,
      helpers: {
        section(name, options) {
          this._sections ??= {};
          this._sections[name] ??= "";
          this._sections[name] += options.fn(this);
          return null;
        },
      },
      extname: EXTENSION,
      runtimeOptions: RUNTIME_OPTIONS,
    });

    registerHelpers(hbs);
    req.app.engine(VIEW_ENGINE, hbs.engine);
    req.app.set("view engine", VIEW_ENGINE);
    req.app.set("views", path.join(__dirname, "../views"));
  }

  next();
};

module.exports = hbsMiddleware;
