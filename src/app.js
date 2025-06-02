// src/app.js
const express = require("express");
const exphbs = require("express-handlebars");
require("dotenv").config();
const setupMiddleware = require("./middleware");
const { registerHelpers } = require("./utils/hbsHelpers");
const app = express();
const path = require("path");

const hbs = exphbs.create({
  layoutsDir: "src/views/layouts",
  partialsDir: "src/views/partials",
  defaultLayout: "main",
  helpers: {
    section: function (name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    },
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
});

registerHelpers(hbs);

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", "./src/views");

setupMiddleware(app);

port = process.env.PORT || 3400;

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

// Global error handlers for uncaught exceptions and rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
