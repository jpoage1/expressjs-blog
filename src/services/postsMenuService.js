// src/services/postsMenuService.js
const { getAllPosts } = require("../utils/postFileUtils");
const { qualifyLink } = require("../utils/qualifyLinks");

async function getPostsMenu(baseDir) {
  const allPosts = await getAllPosts(baseDir);

  // Group posts by year and month
  const menu = [];
  const yearMap = new Map();

  for (const post of allPosts) {
    if (!yearMap.has(post.year)) {
      yearMap.set(post.year, new Map());
    }

    const monthMap = yearMap.get(post.year);
    if (!monthMap.has(post.month)) {
      monthMap.set(post.month, []);
    }

    monthMap.get(post.month).push({
      url: qualifyLink(post.url),
      slug: post.slug,
      title: post.title,
      date: post.date,
      year: post.year,
      month: post.month,
    });
  }

  // Convert maps to arrays
  for (const [year, monthMap] of yearMap) {
    const monthsData = [];
    for (const [month, posts] of monthMap) {
      monthsData.push({ month, posts });
    }
    menu.push({ year, months: monthsData });
  }

  return menu;
}

module.exports = getPostsMenu;
