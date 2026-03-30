// middleware/safeipCheck.js
const use_ip_bypass = false;

// const SAFE_IPS = ["192.168.1.200", "192.168.1.50"];
const SAFE_IPS = [];

module.exports = bypassSafeIp(req, res, next) => {
  // Determine the client IP address.
  // req.ip is often provided by Express and correctly handles X-Forwarded-For if Express is configured for it.
  // If not, you might need to manually check req.headers['x-forwarded-for']
  const clientIp = req.ip; // Or req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
  // --- Bypass Logic ---
  // Check if the client IP is in the list of safe IPs
  if (use_ip_bypass && SAFE_IPS.includes(clientIp)) {
    // -- fixme; harden for production by disabling this block
    res.locals.session = {
      isAuthenticated: true,
      user: "local-admin",
      groups: ["admin", "guests", "people"], // Assign groups needed for menu visibility
    };
    if (req.log) {
      req.log.security(`Bypassing authentication for safe IP: ${clientIp}`);
    } else {
      console.security(`Bypassing authentication for safe IP: ${clientIp}`);
    }
    res.locals.isSafeIp = true;
  } else {
    res.locals.isSafeIp = false;
  }
  return next(); // Proceed to the next middleware/route handler
}

