// src/utils/gitDates.js
const { execSync } = require("child_process");
const path = require("path");

/**
 * Polls the local git history of a project folder.
 * @param {string} projectPath - Path to the project submodule/folder
 */
const getProjectDates = (projectPath) => {
  try {
    // Get ISO date of the first commit (Created)
    const created = execSync(
      `git -C ${projectPath} log --reverse --format=%ad --date=short | head -1`,
      { encoding: "utf8" },
    ).trim();

    // Get ISO date of the last commit (Updated)
    const updated = execSync(
      `git -C ${projectPath} log -1 --format=%ad --date=short`,
      { encoding: "utf8" },
    ).trim();

    return { created, updated };
  } catch (err) {
    console.error(`Git poll failed for ${projectPath}:`, err.message);
    return { created: null, updated: null };
  }
};

module.exports = { getProjectDates };
