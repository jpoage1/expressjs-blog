// src/controllers/analyticsControllers.js
// Receives the client-side POST to /track with JS-enriched data:
// viewport, loadTime, js_enabled: true, and the actual page URL.
// This is distinct from what structuredLogger records — that captures
// the POST to /track itself; this captures the page view it describes.

const { upsertVisitor, recordRequest } = require("#services/visitorService.js");

module.exports = (context) => (req, res) => {
  const {
    url = "",
    referrer = "",
    userAgent = "",
    viewport = "",
    loadTime = 0,
    event = "",
  } = req.body;

  const forwardedIp = req.ip;
  const directIp = req.connection?.remoteAddress;

  // File log preserved for dev debugging — same as before
  req.log.analytics({
    context,
    timestamp: Date.now(),
    url,
    referrer,
    userAgent,
    viewport,
    loadTime,
    event,
    forwardedIp,
    directIp,
    js_enabled: true,
  });

  // Respond immediately — never hold the client waiting on DB writes
  res.sendStatus(204);

  // Fire-and-forget: record in Postgres with client-side enrichment
  (async () => {
    try {
      const visitorId = await upsertVisitor(forwardedIp, userAgent);
      await recordRequest(visitorId, "GET", url, 200, referrer, {
        directIp,
        viewport,
        loadTime,
        event,
        context,
        jsEnabled: true,
      });
    } catch (err) {
      console.error("analyticsController insert failed:", err.message);
    }
  })();
};
