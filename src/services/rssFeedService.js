// src/services/rssFeedService.js
const RSS = require("rss");
const { getAllPosts } = require("../utils/postFileUtils");
const {
  FEED_TITLE,
  FEED_DESCRIPTION,
  FEED_LANGUAGE,
} = require("../constants/rssConstants");

async function generateRSSFeed(baseDir, siteUrl) {
  const allPosts = await getAllPosts(baseDir);

  const feed = new RSS({
    title: FEED_TITLE,
    description: FEED_DESCRIPTION,
    feed_url: `${siteUrl}/rss.xml`,
    site_url: siteUrl,
    language: FEED_LANGUAGE,
  });

  for (const post of allPosts) {
    feed.item({
      title: post.title,
      description: post.excerpt || "",
      url: `${siteUrl}${post.url}`,
      date: post.date,
    });
  }

  return feed.xml({ indent: true });
}

module.exports = generateRSSFeed;
