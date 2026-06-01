class PrimitiveError extends Error {
  constructor(context, originalError = null) {
    const validContext =
      typeof context === "string" ? context : String(context);
    let detailedMessage = validContext;
    if (originalError instanceof Error) {
      detailedMessage = `${validContext}: ${originalError.message}`;
    } else if (originalError != null) {
      detailedMessage = `${validContext}: ${String(originalError)}`;
    }

    super(
      detailedMessage,
      originalError instanceof Error ? { cause: originalError } : {},
    );
    this.name = this.constructor.name;

    if (originalError instanceof Error) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    } else if (originalError != null) {
      this.stack = `${this.stack}\nContext Data: ${String(originalError)}`;
    }
  }
  warn() {
    console.warn("PRIMITIVE_ERROR: ", this);
    return this;
  }
  error() {
    console.error("PRIMITIVE_ERROR: ", this);
    return this;
  }
  info() {
    console.log("PRIMITIVE_ERROR: ", this);
    return this;
  }
  notice() {
    console.log(`Notice: ${this}`);
    return this;
  }
  log(level = "log") {
    console["level"]("PRIMITIVE_ERROR: ", this);
    return this;
  }
}

module.exports = PrimitiveError;
