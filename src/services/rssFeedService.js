// src/services/rssFeedService.js
const RSS = require("rss");
const { getAllPosts } = require("../utils/postFileUtils");

async function generateRSSFeed(baseDir, siteUrl) {
  const allPosts = await getAllPosts(baseDir);

  const feed = new RSS({
    title: "My Blog",
    description: "Latest posts from my blog",
    feed_url: `${siteUrl}/rss.xml`,
    site_url: siteUrl,
    language: "en",
  });

  for (const post of allPosts) {
    feed.item({
      title: post.title,
      description: post.excerpt || "", // optional: add excerpt to post object
      url: `${siteUrl}${post.url}`,
      date: post.date,
    });
  }

  return feed.xml({ indent: true });
}

module.exports = generateRSSFeed;
