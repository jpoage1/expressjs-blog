function buildConfig() {
  const config = require("#config");
  // config.dbUrl takes priority; falls back to individual connection fields.

  const { db } = config;
  const max = db.max || 6;

  const dbUrl = config.dbUrl || db.url;

  return dbUrl
    ? {
        connectionString: dbUrl,
      }
    : {
        host: db.host,
        port: db.port,
        user: db.user,
        password: db.password,
        database: db.database,
        max,
      };
}
module.exports = buildConfig();
