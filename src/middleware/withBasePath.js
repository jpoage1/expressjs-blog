module.exports.withBasePath = (req, res, next) => {
  // Extract injected value from NGINX header
  const dynamicPath = req.headers["x-base-path"] || "/";

  if (req.url.startsWith(dynamicPath)) {
    // Strip the dynamic path so the router routes match correctly
    req.url = req.url.replace(dynamicPath, "") || "/";
  }

  next();
};
