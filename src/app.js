// src/app.js
const express = require("express");
const exphbs = require("express-handlebars");
const setupMiddleware = require("./middleware");
const { registerHelpers } = require("./utils/hbsHelpers");
const app = express();
const path = require("path");

const hbs = exphbs.create({
  layoutsDir: "src/views/layouts",
  partialsDir: "src/views/partials",
  defaultLayout: "main",
});
registerHelpers(hbs);

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", "./src/views");

setupMiddleware(app);

app.listen(3400, () => {
  console.log("Server listening on http://localhost:3400");
});
