const express = require("express");
const router = express.Router();

router.get("/robots.txt", (req, res) => {
  const robotsTxt = `
User-agent: *
Disallow:

Sitemap: ${req.protocol}://${req.get("host")}/sitemap.xml
`.trim();

  res.type("text/plain");
  res.send(robotsTxt);
});

module.exports = router;
