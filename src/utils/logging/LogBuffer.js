// src/#logging/LogBuffer.js
const { winstonLogger } = require("./winston.js");

class LogBuffer {
  #buffer = [];
  #logger;
  #level;
  #raw;

  constructor(logger = winstonLogger, level = "info", { raw = false } = {}) {
    this.#logger = logger;
    this.#level = level;
    this.#raw = raw;
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
    if (this.#buffer.length === 0) return;
    const output = this.#buffer.join("\n");
    if (this.#raw) {
      process.stdout.write(output + "\n");
    } else {
      this.#logger[this.#level](`\n${output}`);
    }
    this.#buffer = [];
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
