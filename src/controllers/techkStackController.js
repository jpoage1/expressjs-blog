// controllers/techStackController.js

const HttpError = require("../utils/HttpError"); // Adjust path as needed
const { meta } = require("../config/loader.js");
const techStack = require(`${meta.content}/techStack.json`); // JSON file from previous message
module.exports = (req, res, next) => {
  try {
    const techWithBase = techStack.map((item) => ({
      ...item,
      png: req.locals.baseUrl + item.png,
      svg: req.locals.baseUrl + item.svg,
    }));
    res.renderWithBaseContext("pages/stack", {
      tech: techWithBase,
    });
  } catch (err) {
    next(
      new HttpError("Failed to load tech stack", 500, { originalError: err }),
    );
  }
};
