// routes/rss.js
const express = require("express");
const router = express.Router();
const generateRSSFeed = require("../services/rssFeedService");

router.get("/rss-feed.xml", async (req, res) => {
  const domain = process.env.DOMAIN;
  const xml = await generateRSSFeed("content/posts", `https://${domain}`);
  res.set("Content-Type", "application/rss+xml");
  res.send(xml);
});

module.exports = router;
