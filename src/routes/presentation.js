// src/routes/presentation.js
const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const yaml = require("js-yaml");

const router = express.Router();
const HttpError = require("../utils/HttpError");
const { qualifyLink } = require("../utils/qualifyLinks");
const { baseUrl } = require("../utils/baseUrl");

const yamlPath = path.resolve("content/presentation.yaml");

router.get("/", async (req, res, next) => {
  try {
    const fileContent = await fs.readFile(yamlPath, "utf8");
    const data = yaml.load(fileContent);

    // Wrap relative URLs with qualifyLink()
    if (data.slides) {
      for (const slide of data.slides) {
        if (slide.images) {
          slide.images = slide.images.map((img) => {
            if (img.src && !img.src.match(/^https?:\/\//)) {
              img.src = qualifyLink(img.src);
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
      baseUrl,
      nonce: res.locals.nonce,
    });
  } catch (err) {
    req.log.error(err.stack);
    next(new HttpError("Failed to load presentation data", 500));
  }
});

module.exports = router;
