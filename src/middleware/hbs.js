// src/middleware/hbs.js
const path = require("path");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");

const { registerHelpers } = require("../utils/hbsHelpers");
const {
  VIEW_ENGINE,
  LAYOUTS_DIR,
  PARTIALS_DIR,
  DEFAULT_LAYOUT,
  EXTENSION,
  RUNTIME_OPTIONS,
} = require("../constants/hbsConstants");
// const renderObject = (obj) => {
//   if (typeof obj !== "object" || obj === null) {
//     return new Handlebars.SafeString(`<span>${String(obj)}</span>`);
//   }

//   if (Array.isArray(obj)) {
//     const items = obj
//       .map((item) => `<li>${Handlebars.escapeExpression(String(item))}</li>`)
//       .join("");
//     return new Handlebars.SafeString(`<ul>${items}</ul>`);
//   }

//   const entries = Object.entries(obj)
//     .map(([key, value]) => {
//       const renderedValue = renderObject(value);
//       return `<div class="doc-entry"><strong>${Handlebars.escapeExpression(key)}:</strong> ${renderedValue}</div>`;
//     })
//     .join("");
//   return new Handlebars.SafeString(`<div class="doc-object">${entries}</div>`);
// };

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
        json(context) {
          return JSON.stringify(context, null, 2);
        },
        // helperMissing(context, options) {
        //   var options = arguments[arguments.length - 1];
        //   var args = Array.prototype.slice.call(
        //     arguments,
        //     0,
        //     arguments.length - 1
        //   );
        //   return new Handlebars.SafeString(
        //     "Missing: " + options.name + "(" + args + ")"
        //   );
        // },
        // blockHelperMissing(context, options) {
        //   return (
        //     "Helper '" +
        //     options.name +
        //     "' not found. Printing block: " +
        //     options.fn(context)
        //   );
        // },
        // renderObject,
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
