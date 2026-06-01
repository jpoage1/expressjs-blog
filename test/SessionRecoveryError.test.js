const assert = require("node:assert");
const { test, describe } = require("node:test");
const SessionRecoveryError = require("../src/utils/SessionRecoveryError");

describe("SessionRecoveryError Unit Tests", () => {
  test("Initialization with valid inputs", () => {
    const message = "Session timed out during document fetch";
    const callback = (session) => `Recovered for ${session.user}`;
    const error = new SessionRecoveryError(message, callback);

    assert.strictEqual(error.message, message);
    assert.strictEqual(typeof error.recoveryCallback, "function");
    assert.strictEqual(error.isContinuable, true);
  });

  test("Boundary Condition: Missing or invalid callback throws TypeError", () => {
    const malformedInputs = [null, undefined, {}, "not a function", 123];

    malformedInputs.forEach((input) => {
      assert.throws(() => new SessionRecoveryError("Error", input), {
        name: "TypeError",
        message: "recoveryCallback must be a function",
      });
    });
  });

  test("Execution: recover() correctly passes session to callback", () => {
    const mockSession = { user: "jpoage", groups: ["admin"] };
    const callback = (session) => session.user;
    const error = new SessionRecoveryError("Test", callback);

    const result = error.recover(mockSession);
    assert.strictEqual(result, "jpoage");
  });

  test("Stability: Handling empty session objects", () => {
    const callback = (session) => session?.id || "anonymous";
    const error = new SessionRecoveryError("Empty Session", callback);

    assert.strictEqual(error.recover({}), "anonymous");
    assert.strictEqual(error.recover(null), "anonymous");
  });
});
