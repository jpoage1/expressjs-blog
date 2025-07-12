// src/middleware/hbs.js
const path = require("path");
const exphbs = require("express-handlebars");
const { registerHelpers } = require("../utils/hbsHelpers");

const hbsMiddleware = (req, res, next) => {
  if (!req.app.get("view engine")) {
    const hbs = exphbs.create({
      layoutsDir: path.join(__dirname, "../views/layouts"),
      partialsDir: path.join(__dirname, "../views/partials"),
      defaultLayout: "main",
      helpers: {
        section(name, options) {
          this._sections ??= {};
          this._sections[name] ??= "";
          this._sections[name] += options.fn(this);
          req.log.debug(name, this._sections);
          return null;
        },
      },
      extname: ".handlebars",
      runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
      },
    });

    registerHelpers(hbs);
    req.app.engine("handlebars", hbs.engine);
    req.app.set("view engine", "handlebars");
    req.app.set("views", path.join(__dirname, "../views"));
  }

  next();
};

module.exports = hbsMiddleware;
