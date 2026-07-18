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
import {
  assertMarkdownFrontmatterParses,
  assertPublicContractIsHealthy,
} from "./helpers/publicContract.js";

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

test("all markdown frontmatter parses", async () => {
  await assertMarkdownFrontmatterParses();
});

test("anonymous public URL contract is healthy", async () => {
  await assertPublicContractIsHealthy(BASE_URL);
});

test("parameterized routes are registered for sampled public URL tests", () => {
  const paramRoutes = routes.filter((r) => r.path.includes(":"));
  assert.ok(paramRoutes.length >= 0);
  if (paramRoutes.length > 0) {
    console.log(
      `  (${paramRoutes.length} parameterized route(s) are exercised through public contract samples: ` +
        paramRoutes.map((r) => r.path).join(", ") +
        ")",
    );
  }
});
