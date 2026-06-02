const path = require("path");
const fs = require("fs/promises");
const yaml = require("js-yaml");

const { HttpError } = require("../../src/api");

const yamlPath = path.resolve("content/presentation.yaml");

async function renderPresentation(req, res, next) {
  try {
    const fileContent = await fs.readFile(yamlPath, "utf8");
    const data = yaml.load(fileContent);

    if (data.slides) {
      for (const slide of data.slides) {
        if (slide.images) {
          slide.images = slide.images.map((img) => {
            if (img.src && !img.src.match(/^https?:\/\//)) {
              img.src = res.locals.qualifyLink(img.src);
            }
            return img;
          });
        }
      }
    }

    res.render("pages/presentation", {
      layout: "presentation",
      slides: data.slides,
      title: data.title,
      baseUrl: res.locals.baseUrl,
      returnUrl: req.returnUrl,
    });
  } catch (err) {
    req.log.error(err.stack);
    next(new HttpError("Failed to load presentation data", 500));
  }
}

module.exports = {
  renderPresentation,
};
