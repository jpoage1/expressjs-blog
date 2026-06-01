const { logger } = require("#logging");
const PrimitiveError = require("#errors/PrimitiveError.js");

class ApiError extends PrimitiveError {
  log() {
    logger.error(this);
    return this;
  }
}

module.exports = ApiError;
