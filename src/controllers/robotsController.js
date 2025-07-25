module.exports = (req, res) => {
  const robotsTxt = `
User-agent: *
Disallow:

Sitemap: ${req.protocol}://${req.get("host")}/sitemap.xml
`.trim();

  res.type("text/plain");
  res.send(robotsTxt);
};
