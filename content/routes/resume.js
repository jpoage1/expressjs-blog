const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const HttpError = require("../../src/utils/HttpError");

function filterByProfile(data, profile) {
  const inProfile = (item) => !item.profiles || item.profiles.includes(profile);

  const flattenText = (item) => (typeof item === "string" ? item : item.text);

  const projects = data.technical_projects
    .filter(inProfile)
    .sort((a, b) => {
      const aFeatured = a.featured?.includes(profile) ? 0 : 1;
      const bFeatured = b.featured?.includes(profile) ? 0 : 1;
      return aFeatured - bFeatured;
    })
    .map((p) => ({
      ...p,
      features: p.features.filter(inProfile).map(flattenText),
    }));

  const work_history = data.work_history.filter(inProfile).map((job) => ({
    ...job,
    responsibilities: job.responsibilities.filter(inProfile).map(flattenText),
  }));

  return { ...data, technical_projects: projects, work_history };
}

router.get("/", async (req, res, next) => {
  try {
    const dataPath = path.resolve(meta.content, "/resume.json");
    const fileContent = await fs.readFile(dataPath, "utf8");
    const resumeData = JSON.parse(fileContent);

    const activeProfile =
      req.query.profile || resumeData.meta?.active_profile || "swe";

    const filtered = filterByProfile(resumeData, activeProfile);
    const isPaper = req.query.view === "paper";

    // Build profile switcher data with URLs pre-computed
    const profileLinks = Object.entries(resumeData.meta?.profiles || {}).map(
      ([key, value]) => {
        const params = new URLSearchParams({ ...req.query, profile: key });
        return {
          key,
          label: value.label,
          url: `/resume?${params.toString()}`,
          active: key === activeProfile,
        };
      },
    );

    res.renderWithBaseContext(
      "pages/resume",
      {
        ...filtered,
        title: `Resume - ${filtered.name}`,
        activeProfile,
        profileLinks,
        profiles: resumeData.meta?.profiles,
        currentQuery: req.query,
        viewType: isPaper ? "paper" : "web",
        showSidebar: !isPaper,
        showFooter: !isPaper,
        showHeader: !isPaper,
      },
      isPaper
        ? {
            classes: {
              body: "resume-pdf-layout resume-body",
              layout: "resume-container",
              container: "resume-paper",
            },
          }
        : {},
    );
  } catch (err) {
    req.log.error(err.stack);
    next(new HttpError("Could not load resume data", 500));
  }
});

module.exports = router;
