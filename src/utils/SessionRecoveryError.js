/**
 * Custom error for scenarios requiring session-based recovery.
 * Provides a callback to inject session data into an alternative logic path.
 */
class SessionRecoveryError extends Error {
  constructor(message, recoveryCallback) {
    if (typeof recoveryCallback !== "function") {
      throw new TypeError("recoveryCallback must be a function");
    }
    super(message);
    this.name = "SessionRecoveryError";
    this.recoveryCallback = recoveryCallback;
    this.isContinuable = true;
  }

  /**
   * Executes the recovery logic using provided session data.
   * @param {Object} session - The current session object.
   * @returns {*} Result of the callback execution.
   */
  recover(session) {
    return this.recoveryCallback(session);
  }
}

module.exports = SessionRecoveryError;
