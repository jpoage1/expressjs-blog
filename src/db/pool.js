// src/db/pool.js
//
// Exports a getPool() function rather than a pool instance.
// Each call checks whether the current pool is still usable and recreates
// it if not — so callers always get a valid pool regardless of prior state
// (nodemon restarts, SIGINT in dev, etc.)
const { Pool } = require("pg");
const { DatabaseError } = require("#utils/errors.js");
const { logger } = require("#logging");
const config = require("#db/config.js");

let _pool = null;

function getPool() {
  // _pool._ending is set by pg when pool.end() has been called.
  // Recreating here means callers never receive an ended pool.
  if (!_pool || _pool._ending) {
    _pool = new Pool(config);

    _pool.on("error", (err) => {
      // Surface pool-level errors without crashing. The next getPool()
      // call will recreate if the pool has been ended as a result.
      const dbError = new ContextualError("pg pool error", err);
      logger.error(dbError);
    });
  }

  return _pool;
}

// Production-only graceful shutdown. In development nodemon sends SIGINT
// on every file save — letting that end the pool causes the stale pool error
// on the next restart's blocklist refresh.
if (process.env.NODE_ENV === "production") {
  const shutdown = () => {
    if (_pool) _pool.end();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

module.exports = { getPool };
