module.exports.withBasePath = (req, res, next) => {
  const basePath = req.headers["x-base-path"] || "";

  if (basePath && req.url.startsWith(basePath)) {
    const stripped = req.url.slice(basePath.length);
    const normalized = "/" + stripped.replace(/^\/+/, "");
    req.url = normalized; // mutation last
  }

  next();
};
