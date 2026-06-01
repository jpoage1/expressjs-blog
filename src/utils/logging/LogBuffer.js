// src/#logging/LogBuffer.js
const { winstonLogger } = require("./winston");

class LogBuffer {
  #buffer = [];
  #logger;
  #level;

  constructor(logger = winstonLogger, level = "info") {
    this.#logger = logger;
    this.#level = level;
  }

  /**
   * Appends a text string or data element to the local queue.
   */
  push(line) {
    this.#buffer.push(line);
  }

  /**
   * Commits and flushes the entire buffered payload down a single stream line.
   */
  flush() {
    if (this.#buffer.length > 0) {
      this.#logger[this.#level](`\n${this.#buffer.join("\n")}`);
      this.#buffer = [];
    }
  }

  /**
   * Executes a callback function atomically. Flushes buffer on completion or failure.
   */
  execute(fn) {
    try {
      const result = fn();
      this.flush();
      return result;
    } catch (error) {
      this.flush();
      throw error;
    }
  }
}

module.exports = LogBuffer;
