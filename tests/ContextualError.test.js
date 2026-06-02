const { ApiError } = require("../src/utils/errors/ApiError");
const { winstonLogger } = require("#logging/winston");

describe("ApiError Unit Tests", () => {
  test("should format message and chain stack traces given a valid Error instance", () => {
    const originalError = new Error("Connection timeout");
    const contextErr = new ApiError("pg pool error", originalError);

    expect(contextErr.message).toBe("pg pool error: Connection timeout");
    expect(contextErr.stack).toContain("pg pool error: Connection timeout");
    expect(contextErr.stack).toContain("Caused by: Error: Connection timeout");
    expect(contextErr.originalError).toBe(originalError);
  });

  test("should handle context correctly without an original error parameter", () => {
    const contextErr = new ApiError("simple context error");
    expect(contextErr.message).toBe("simple context error");
    expect(contextErr.originalError).toBeUndefined();
  });

  test("boundary condition: handle malformed string input instead of Error object", () => {
    const contextErr = new ApiError(
      "pg pool error",
      "raw string error transmission",
    );
    expect(contextErr.message).toBe(
      "pg pool error: raw string error transmission",
    );
    expect(contextErr.stack).toContain(
      "Context Data: raw string error transmission",
    );
  });

  test("boundary condition: handle non-string context parameters gracefully", () => {
    const contextErr = new ApiError(
      { clusterId: 42 },
      new Error("Node failure"),
    );
    expect(contextErr.message).toBe("[object Object]: Node failure");
  });

  test("boundary condition: handle massive payload allocations to check memory threshold degradation", () => {
    const massiveString = "X".repeat(10 * 1024 * 1024); // 10MB allocation
    const originalError = new Error(massiveString);
    const contextErr = new ApiError("overflow target", originalError);

    expect(contextErr.message).toBe(`overflow target: ${massiveString}`);
    expect(contextErr.stack).toContain("Caused by:");
  });
});

describe("ApiError Integration with Winston Logger", () => {
  let writeSpy;

  beforeEach(() => {
    writeSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => {});
  });

  afterEach(() => {
    writeSpy.mockRestore();
  });

  test("should output combined format and stack payload matching the Winston formatter pipeline", () => {
    const originalError = new Error("Query execution aborted");
    const contextErr = new ApiError("pg pool error", originalError);

    winstonLogger.error(contextErr);

    expect(writeSpy).toHaveBeenCalled();
    const logOutput = writeSpy.mock.calls[0][0];

    expect(logOutput).toContain("pg pool error: Query execution aborted");
    expect(logOutput).toContain("Caused by: Error: Query execution aborted");
  });
});
