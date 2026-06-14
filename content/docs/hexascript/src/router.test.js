/**
 * UNIT TESTS (TDD)
 */
const runTests = () => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(`Test Failed: ${message}`);
  };

  const mockRouter = {
    routes: [],
    get(path, handler) {
      this.routes.push({ path, handler });
    },
  };

  const mockLogger = {
    info: () => {},
    error: (msg, data) => {
      console.error(msg, data);
    },
  };

  const mockPath = {
    join: (...args) => args.filter(Boolean).join("/").replace(/\/+/g, "/"),
  };

  const mockContextProvider = (type, value, prefix) => ({
    route: value,
    controller: type === "submenu" ? null : () => `handler for ${value}`,
  });

  const factory = new RouterFactory(
    mockRouter,
    mockLogger,
    mockContextProvider,
    mockPath,
  );

  // Test Case 1: Standard Route Registration
  factory.generateRouter([{ html: "test", label: "Test" }]);
  assert(
    mockRouter.routes.some((r) => r.path === "test"),
    "Standard route registration failed",
  );

  // Test Case 2: Recursion (Submenus)
  const nestedData = [
    {
      label: "Parent",
      submenu: [{ html: "child", label: "Child" }],
    },
  ];
  factory.generateRouter(nestedData, "/api");
  assert(
    mockRouter.routes.some((r) => r.path === "/api/child"),
    "Recursive submenu registration failed",
  );

  // Test Case 3: Boundary - Empty Links
  factory.generateRouter([]);
  assert(true, "Empty links should not throw");

  // Test Case 4: Malformed Input - Missing Controller (Fail-Fast)
  const brokenProvider = () => ({ route: "error" }); // No controller
  const brokenFactory = new RouterFactory(
    mockRouter,
    mockLogger,
    brokenProvider,
    mockPath,
  );
  brokenFactory.generateRouter([{ html: "broken" }]);
  // Should catch error internally and log via mockLogger.error

  console.log("All tests passed.");
};
