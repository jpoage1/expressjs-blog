const path = require("path");
const fs = require("fs").promises;

async function getPostsMenu(baseDir) {
  const years = (await fs.readdir(baseDir, { withFileTypes: true })).filter(
    (dirent) => dirent.isDirectory() && /^\d{4}$/.test(dirent.name)
  );

  const menu = [];

  for (const yearDir of years) {
    const yearPath = path.join(baseDir, yearDir.name);
    const months = await fs.readdir(yearPath, { withFileTypes: true });
    const monthsData = [];

    for (const monthDir of months.filter((d) => d.isDirectory())) {
      const monthPath = path.join(yearPath, monthDir.name);
      const files = await fs.readdir(monthPath);

      const posts = files
        .filter((f) => f.endsWith(".md"))
        .map((f) => {
          const slug = f.replace(/\.md$/, "");
          return {
            slug,
            title: slug.replace(/-/g, " "),
            year: yearDir.name,
            month: monthDir.name,
          };
        });

      monthsData.push({ month: monthDir.name, posts });
    }

    menu.push({ year: yearDir.name, months: monthsData });
  }

  return menu;
}

module.exports = getPostsMenu;
