// routes/rss.js
const generateRSSFeed = require("../services/rssFeedService");
const { public } = require("../config/loader");

module.exports = async (req, res) => {
  const xml = await generateRSSFeed(
    "content/posts",
    `https://${public.domain}`,
  );
  res.set("Content-Type", "application/rss+xml");
  res.send(xml);
};
