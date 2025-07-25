// controllers/techStackController.js

const HttpError = require("../utils/HttpError"); // Adjust path as needed
const techStack = require("../../content/techStack.json"); // JSON file from previous message
const { baseUrl } = require("../utils/baseUrl");
module.exports = (req, res, next) => {
  try {
    const techWithBase = techStack.map((item) => ({
      ...item,
      png: baseUrl + item.png,
      svg: baseUrl + item.svg,
    }));
    res.renderWithBaseContext("pages/stack", {
      tech: techWithBase,
    });
  } catch (err) {
    next(
      new HttpError("Failed to load tech stack", 500, { originalError: err })
    );
  }
};
