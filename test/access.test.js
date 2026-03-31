const fc = require("fast-check");
const { expect, test, vi } = require("vitest");
const accessService = require("../services/AccessService");

test("AccessService handles malformed token strings via fuzzing", async () => {
  await fc.assert(
    fc.asyncProperty(fc.string(), async (token) => {
      // Mock global fetch
      global.fetch = vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
        json: async () => ({ detail: "Forbidden" }),
      });

      try {
        await accessService.fetchCredentials(token);
      } catch (err) {
        // Assert that malformed inputs never cause unhandled exceptions (500)
        // and are caught by the 403/502 logic.
        expect([403, 502]).toContain(err.statusCode);
      }
    }),
  );
});

test("AccessService successfully processes valid credentials", async () => {
  const mockData = {
    message: "Success",
    username: "recruiter_21001",
    password: "Test-Pass-1234#",
  };

  global.fetch = vi.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => mockData,
  });

  const result = await accessService.fetchCredentials("valid-uuid");
  expect(result.username).toBe("recruiter_21001");
});
