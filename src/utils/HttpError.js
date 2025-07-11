class HttpError extends Error {
  constructor(message, statusCode = 500, metadata = {}) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    Object.assign(this, metadata);
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = HttpError;
