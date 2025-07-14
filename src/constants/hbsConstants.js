// constants/hbsConstants.js
const VIEW_ENGINE = "handlebars";
const LAYOUTS_DIR = "../views/layouts";
const PARTIALS_DIR = "../views/partials";
const DEFAULT_LAYOUT = "main";
const EXTENSION = ".handlebars";

const RUNTIME_OPTIONS = {
  allowProtoPropertiesByDefault: true,
  allowProtoMethodsByDefault: true,
};

module.exports = {
  VIEW_ENGINE,
  LAYOUTS_DIR,
  PARTIALS_DIR,
  DEFAULT_LAYOUT,
  EXTENSION,
  RUNTIME_OPTIONS,
};
