function buildConfig() {
  const config = require("#config/loader.js");
  // config.dbUrl takes priority; falls back to individual connection fields.
  return config.dbUrl
    ? {
        connectionString: config.dbUrl,
        max: config.db.max || 6,
      }
    : config.db;
}
module.exports = buildConfig();
