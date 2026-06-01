const ApiError = require("#errors/ApiError.js");

class DatabaseError extends ApiError {
  constructor(context, originalError = null) {
    super(context, originalError);
    this.name = "DatabaseError";
  }
}

module.exports = DatabaseError;
