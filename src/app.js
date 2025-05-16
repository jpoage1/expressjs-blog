const express = require("express");
const { engine: exphbs } = require("express-handlebars");
const setupMiddleware = require("./middleware");
const app = express();

app.engine(
  "handlebars",
  exphbs({
    layoutsDir: "src/views/layouts",
    partialsDir: "src/views/partials",
    defaultLayout: "main",
  })
);
app.set("view engine", "handlebars");
app.set("views", "./src/views");

setupMiddleware(app);

app.listen(3400, () => {
  console.log("Server listening on http://localhost:3400");
});
