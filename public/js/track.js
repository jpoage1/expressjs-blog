const navEntry = performance.getEntriesByType("navigation")[0];

fetch("/track", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: window.location.pathname,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    loadTime: navEntry
      ? navEntry.domContentLoadedEventEnd - navEntry.startTime
      : performance.now(),
    event: "pageview",
  }),
});
