// src/modules/contentRouter.js
//
// Custom routes that don't fit the generic markdown/construction/html
// route builders: the tech stack page and the project presentation deck.

import express from "express";
import path from "path";
import fs from "fs/promises";
import yaml from "js-yaml";
import { HttpError } from "@jpoage1/errors";
import techStack from "../../content/config/techStack.json" with { type: "json" };

const presentationYamlPath = path.resolve("content/config/presentation.yaml");

function resolveReturnUrl(domain) {
  return (req, res, next) => {
    const fallbackUrl = res.locals.baseUrl;
    const referrer = req.body?.referrer;

    req.returnUrl = fallbackUrl;

    if (typeof referrer !== "string") return next();

    try {
      const url = new URL(referrer);
      const isSameDomain = url.hostname.endsWith(domain);
      const isNotPresentation = !url.pathname.includes(
        "/projects/website-presentation",
      );

      if (isSameDomain && isNotPresentation) {
        req.returnUrl = referrer;
      }
    } catch {
      // noop
    }

    next();
  };
}

export function createContentRouter({ cspDirectives, securityPolicy, domain }) {
  const router = express.Router();

  router.get("/stack", (req, res, next) => {
    try {
      const techWithBase = techStack.map((item) => ({
        ...item,
        png: res.locals.baseUrl + item.png,
        svg: res.locals.baseUrl + item.svg,
      }));
      res.locals.renderWithBaseContext("pages/stack", { tech: techWithBase });
    } catch (err) {
      next(new HttpError("Failed to load tech stack", 500, { originalError: err }));
    }
  });

  router.get(
    "/projects/website-presentation",
    resolveReturnUrl(domain),
    securityPolicy({
      scriptSrc: [...cspDirectives.scriptSrc, "'unsafe-eval'"],
      styleSrc: [...cspDirectives.styleSrc, "'unsafe-inline'"],
    }),
    async (req, res, next) => {
      try {
        const fileContent = await fs.readFile(presentationYamlPath, "utf8");
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
        next(new HttpError("Failed to load presentation data", 500, { originalError: err }));
      }
    },
  );

  router.get("/guest-access", (req, res) => {
    res.locals.renderWithBaseContext("pages/credentials.handlebars", {
      title: "Guest Access",
      token: "",
    });
  });

  return router;
}
