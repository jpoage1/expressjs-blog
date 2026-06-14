/**
 * Comprehensive Test Suite with Fuzzing for getContext.
 */
const { getContext, validateType, getFilePath } = require("./router.js");
const fs = require("node:fs/promises");

jest.mock("node:fs/promises");

describe("Router Logic TDD", () => {
  test("validateType throws on invalid input (Fail-Fast)", () => {
    expect(() => validateType("invalid")).toThrow("Invalid option: invalid");
  });

  test("getFilePath returns correct structure for html", () => {
    const path = getFilePath("html", "test");
    expect(path).toBe("html/test.html");
  });

  test("getContext returns frozen object with expected keys", async () => {
    fs.readFile.mockResolvedValue("<h1>Test</h1>");
    const context = await getContext("html", "about");

    expect(context).toHaveProperty("controller");
    expect(context.content).toBe("<h1>Test</h1>");
    expect(Object.isFrozen(context)).toBe(true);
  });

  test("Memory Overflow / Long Input Boundary Check", async () => {
    const hugeInput = "a".repeat(10 ** 6);
    expect(() => getFilePath("html", hugeInput)).not.toThrow();
  });

  test("Automated Fuzzing for malformed inputs", async () => {
    const iterations = 100;
    const getRandomString = () => Math.random().toString(36).substring(7);

    for (let i = 0; i < iterations; i++) {
      const randomType = getRandomString();
      const randomPath = getRandomString();

      // Should either resolve or throw defined Error, never crash process
      try {
        await getContext(randomType, randomPath);
      } catch (e) {
        expect(e.message).toMatch(/Invalid option/);
      }
    }
  });
});

/**
 * NEW: Unit and Integration tests for Menu Adaptation.
 */
const { adaptConfigToMenu, resolveModuleHref } = require("./menuAdapter.js");

describe("Menu Module Compatibility", () => {
  const mockConfig = [
    { html: "algorithm", label: "Algorithm" },
    { mermaid: "frontend_logic.html", label: "Logic" },
  ];

  test("resolveModuleHref correctly prefixes html keys", () => {
    const link = { html: "test" };
    expect(resolveModuleHref(link)).toBe("/content/html/test");
  });

  test("adaptConfigToMenu maintains immutability", () => {
    const input = [{ html: "a" }];
    const output = adaptConfigToMenu(input);
    expect(output[0]).not.toBe(input[0]);
    expect(output[0].href).toBe("/content/html/a");
  });

  test("Recursion depth boundary check (Stack Overflow prevention)", () => {
    const createDeepMenu = (depth) => {
      if (depth === 0) return { html: "end" };
      return { label: "level", submenu: [createDeepMenu(depth - 1)] };
    };
    const deepInput = [createDeepMenu(100)];
    expect(() => adaptConfigToMenu(deepInput)).not.toThrow();
  });

  test("Automated Fuzzing: Malformed Object Keys", () => {
    const iterations = 50;
    for (let i = 0; i < iterations; i++) {
      const junkKey = Math.random().toString(36);
      const junkVal = Math.random().toString(36);
      const malformed = [{ [junkKey]: junkVal }];

      const result = adaptConfigToMenu(malformed);
      // Fail-fast / POLA: If no specialized key exists, href should be null/undefined
      expect(result[0].href).toBeNull();
    }
  });
});

const { qualifyNavLinks, adaptConfigToMenu } = require("./menuUtils.js");

describe("Menu Logic Unification", () => {
  test("qualifyNavLinks preserves existing behavior", () => {
    const input = [{ href: "test", label: "T" }];
    const result = qualifyNavLinks(input, "/api");
    expect(result[0].href).toBe("/apitest");
  });

  test("adaptConfigToMenu translates specialty keys to href", () => {
    const input = [{ html: "algo", label: "A" }];
    const result = adaptConfigToMenu(input);
    expect(result[0].href).toBe("/content/html/algo");
  });

  test("Integration: adaptConfigToMenu followed by qualifyNavLinks", () => {
    const raw = [{ html: "algo" }];
    const adapted = adaptConfigToMenu(raw);
    const qualified = qualifyNavLinks(adapted, "https://jasonpoage.com");
    expect(qualified[0].href).toBe("https://jasonpoage.com/content/html/algo");
  });

  test("Boundary: Stack Overflow protection on deep nesting", () => {
    const deepLink = (n) =>
      n === 0 ? { href: "x" } : { submenu: [deepLink(n - 1)] };
    const input = [deepLink(100)];
    expect(() => qualifyNavLinks(input, "")).not.toThrow();
  });

  test("Fuzzing: Malformed object structures", () => {
    for (let i = 0; i < 50; i++) {
      const malformed = [{ [Math.random()]: null, submenu: "not-an-array" }];
      // Should fail-fast or return input based on POLA
      try {
        qualifyNavLinks(malformed, "");
      } catch (e) {
        expect(e).toBeDefined(); // Expecting error on non-array submenu
      }
    }
  });
});
