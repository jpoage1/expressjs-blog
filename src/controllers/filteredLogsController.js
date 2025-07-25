const fs = require("fs");
const { getExcludeRoutes, shouldExclude } = require("../lib/routeFilter");
const { parseLogLine } = require("../lib/logParser");

function getFilteredLogs(req, res) {
  const excludeRoutes = getExcludeRoutes(req.app._router);
  const logPath = "/var/log/nginx/access.log";

  try {
    const raw = fs.readFileSync(logPath, "utf8");
    const lines = raw.split("\n");

    const filtered = lines.filter((line) => {
      if (!line.trim()) return false;
      const parsed = parseLogLine(line);
      if (!parsed) return false;
      return !shouldExclude(parsed.ip, parsed.url, excludeRoutes);
    });

    res.type("text/plain").status(200).send(filtered.join("\n"));
  } catch {
    res.sendStatus(500);
  }
}

module.exports = { getFilteredLogs };
