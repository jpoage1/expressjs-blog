// routes/rss.js
const generateRSSFeed = require("../services/rssFeedService");

module.exports = async (req, res) => {
  const domain = process.env.DOMAIN;
  const xml = await generateRSSFeed("content/posts", `https://${domain}`);
  res.set("Content-Type", "application/rss+xml");
  res.send(xml);
};
