// src/routes/presentation.js
const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const yaml = require("js-yaml");

const router = express.Router();
const HttpError = require("../utils/HttpError");
const { qualifyLink } = require("../utils/qualifyLinks");
const { baseUrl } = require("../utils/baseUrl");
const { CSP_DIRECTIVES } = require("../constants/securityConstants");
const { securityPolicy } = require("../middleware/applyProductionSecurity");

const yamlPath = path.resolve("content/presentation.yaml");
function resolveReturnUrl(req, res, next) {
  const myDomain = "jasonpoage.com";
  const fallbackUrl = baseUrl;
  const referrer = req.body?.referrer;

  req.returnUrl = fallbackUrl;

  if (typeof referrer !== "string") return next();

  try {
    const url = new URL(referrer);

    const isSameDomain = url.hostname.endsWith(myDomain);
    const isNotPresentation = !url.pathname.includes(
      "/projects/website-presentation"
    );

    if (isSameDomain && isNotPresentation) {
      req.returnUrl = referrer;
    }
  } catch {
    // Invalid referrer, keep fallback
  }

  next();
}

router.get(
  "/",
  resolveReturnUrl,
  securityPolicy({
    scriptSrc: [...CSP_DIRECTIVES.scriptSrc, "'unsafe-eval'"],
    styleSrc: [...CSP_DIRECTIVES.styleSrc, "'unsafe-inline'"],
  }),
  async (req, res, next) => {
    try {
      const fileContent = await fs.readFile(yamlPath, "utf8");
      const data = yaml.load(fileContent);

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
        returnUrl: req.returnUrl,
        nonce: res.locals.nonce,
      });
    } catch (err) {
      req.log.error(err.stack);
      next(new HttpError("Failed to load presentation data", 500));
    }
  }
);

module.exports = router;
