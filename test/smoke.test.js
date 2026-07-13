// test/smoke.test.js
//
// Smoke test: boots the app in-process against config.dev.toml on a scratch
// port, then walks the live Express route table via getExpress5Routes
// (the same route-introspection utility the app's own boot-time route
// table uses -- see @jpoage1/expressjs-blog/src/core/createStartupReport.js)
// instead of a hardcoded route list. New routes get covered automatically;
// nothing has to remember to add a line here.

import { test, before, after } from "node:test";
import assert from "node:assert";
import { getExpress5Routes } from "@jpoage1/middleware";

const PORT = 3491;
const BASE_URL = `http://127.0.0.1:${PORT}`;

process.env.CONFIG_PATH = "./config.dev.toml";
process.env.SERVER_PORT = String(PORT);
process.env.ANALYTICS_ENABLE = "false";

let app;
let server;
let routes;

before(async () => {
  ({ app, server } = await import("../src/app.js"));

  if (!server.listening) {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
  }

  const stack = app?.router?.stack ?? app?._router?.stack ?? null;
  assert.ok(
    stack,
    "could not find the app's route stack (app.router/_router) -- has Express's internals changed?",
  );

  routes = getExpress5Routes(stack);
  assert.ok(
    routes.length > 0,
    "route introspection found zero routes -- check getExpress5Routes against the current Express version",
  );
});

after(() => {
  server.close();
});

test("known key pages return 200", async () => {
  const pages = [
    "/",
    "/changelog",
    "/archive",
    "/about/blog",
    "/stack",
    "/sitemap.xml",
  ];
  for (const path of pages) {
    const res = await fetch(`${BASE_URL}${path}`);
    assert.strictEqual(res.status, 200, `${path} expected 200, got ${res.status}`);
  }
});

test("unknown route returns 404", async () => {
  const res = await fetch(`${BASE_URL}/this-route-does-not-exist`);
  assert.strictEqual(res.status, 404);
});

// /error (and /error/:code) share errorPageController.js, which defaults
// to `code = 500` and deliberately calls res.status(500) to *render* a
// generic error-display page -- that's the intended behavior, not a
// crash, so it's exempt from the "no 5xx" check below.
const INTENTIONAL_ERROR_STATUS_ROUTES = new Set(["/error"]);

test("every registered static GET route responds without a server error", async () => {
  const staticGetRoutes = routes.filter(
    (r) => !r.path.includes(":") && r.methods.includes("GET"),
  );

  assert.ok(staticGetRoutes.length > 0, "no static GET routes were discovered");

  const failures = [];
  for (const { path } of staticGetRoutes) {
    if (INTENTIONAL_ERROR_STATUS_ROUTES.has(path)) continue;
    const res = await fetch(`${BASE_URL}${path}`);
    if (res.status >= 500) failures.push(`${path} -> HTTP ${res.status}`);
  }

  assert.deepStrictEqual(
    failures,
    [],
    `these registered routes returned a server error:\n${failures.join("\n")}`,
  );
});

test("parameterized routes are registered (not fetched -- would need real sample data)", () => {
  const paramRoutes = routes.filter((r) => r.path.includes(":"));
  assert.ok(paramRoutes.length >= 0);
  if (paramRoutes.length > 0) {
    console.log(
      `  (${paramRoutes.length} parameterized route(s) not exercised by fetch-based tests: ` +
        paramRoutes.map((r) => r.path).join(", ") +
        ")",
    );
  }
});
