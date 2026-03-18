const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

// Use your existing HttpError utility
const HttpError = require("../utils/HttpError");

/**
 * Controller to render the Resume page
 */
router.get("/", async (req, res, next) => {
  try {
    // Path to your JSON data
    const dataPath = path.resolve(__dirname, "../../content/resume.json");
    const fileContent = await fs.readFile(dataPath, "utf8");
    const resumeData = JSON.parse(fileContent);

    const isPaper = req.query.view === "paper";

    const cssOverrrides = {
      css: res.cssOverride({
        classes: {
          body: "resume-pdf-layout",
          layout: "resume-container",
          container: "resume-paper",
        },
      }),
    };

    // Render using your existing Handlebars engine logic
    // This follows the pattern in src/routes/post.js [cite: 25]
    res.renderWithBaseContext("pages/resume", {
      ...resumeData,
      title: `Resume - ${resumeData.name}`,
      showSidebar: !isPaper,
      showFooter: !isPaper,
      showHeader: !isPaper,
      ...((isPaper && cssOverrrides) || {}),
      // css: res.cssOverride({
      //   classes: {
      //     body: "resume-pdf-layout",
      //     layout: "resume-container",
      //     container: "resume-paper",
      //   },
      // }),
    });
  } catch (err) {
    req.log.error(err.stack);
    next(new HttpError("Could not load resume data", 500));
  }
});

module.exports = router;
