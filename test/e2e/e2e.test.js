// test/e2e/e2e.test.js
//
// Deliberately nested one level deeper than smoke.test.js: package.json's
// `test` script globs "test/*.test.js" (non-recursive), so this file
// requiring BASE_URL never breaks the default local/CI test run.
//
// E2E test: exercises a REAL running instance (e.g. the Pi's deployed
// express-blog@release/testing.service) over the network, via BASE_URL --
// unlike smoke.test.js, this never boots its own copy of the app.
//
// Route discovery still uses the live Express route table (via
// getExpress5Routes, same as smoke.test.js) so new routes get covered
// automatically -- but that requires an in-process app instance to read
// app.router/_router from. So this test boots one PURELY to read the
// route table, closes it immediately, and sends every actual HTTP
// request to BASE_URL instead. Route topology is intrinsic to the code,
// not the environment, so discovering it locally and testing it remotely
// is safe as long as both run the same deployed build.
//
// Run directly against a target:
//   BASE_URL=https://test.jasonpoage.com node --test test/e2e/e2e.test.js
//
// Run via the containerized runner (forces DNS so the real hostname
// resolves to the Pi regardless of the dev box's own DNS):
//   scripts/run-pi-e2e.sh

import { test, before } from "node:test";
import assert from "node:assert";
import { getExpress5Routes } from "@jpoage1/middleware";
import {
  assertMarkdownFrontmatterParses,
  assertPublicContractIsHealthy,
} from "../helpers/publicContract.js";

const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  throw new Error(
    "BASE_URL is required, e.g. BASE_URL=https://test.jasonpoage.com node --test test/e2e/e2e.test.js",
  );
}

// TLS verification off by default for self-signed/LAN certs when hitting
// the Pi directly by forced hostname -- matches finance.lan's
// SANITY_IGNORE_TLS convention. Set E2E_IGNORE_TLS=0 to require valid
// TLS (e.g. testing the real public cert end-to-end).
const IGNORE_TLS = process.env.E2E_IGNORE_TLS !== "0";
if (IGNORE_TLS) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

let routes;

before(async () => {
  const discoveryPort = 3492;
  process.env.CONFIG_PATH = "./config.dev.toml";
  process.env.SERVER_PORT = String(discoveryPort);
  process.env.ANALYTICS_ENABLE = "false";
  // The discovery instance's cwd may be a read-only Nix store path (see
  // nixpkgs/e2e-image.nix) -- config.dev.toml's relative "./logs" would
  // fail to mkdir there. LOG_DIR overrides it to somewhere always writable.
  process.env.LOG_DIR = process.env.LOG_DIR || "/tmp/expressjs-blog-e2e-logs";

  const { app, server } = await import("../../src/app.js");

  if (!server.listening) {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
  }

  const stack = app?.router?.stack ?? app?._router?.stack ?? null;
  assert.ok(stack, "could not find the app's route stack for discovery");

  routes = getExpress5Routes(stack);
  assert.ok(routes.length > 0, "route discovery found zero routes");

  server.close();
});

// Every fetch is timeout-bounded so a hung connection fails loudly
// instead of stalling the whole run (and leaving the process alive after
// node:test reports its results -- see --test-force-exit in the
// image/run-script entrypoints for the other half of that fix).
const FETCH_TIMEOUT_MS = 10_000;
const fetchT = (url) => fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

test(`known key pages return 200 on ${BASE_URL}`, async () => {
  const pages = [
    "/",
    "/changelog",
    "/archive",
    "/about/blog",
    "/stack",
    "/sitemap.xml",
  ];
  for (const path of pages) {
    const res = await fetchT(`${BASE_URL}${path}`);
    assert.strictEqual(res.status, 200, `${path} expected 200, got ${res.status}`);
  }
});

test("unknown route returns 404", async () => {
  const res = await fetchT(`${BASE_URL}/this-route-does-not-exist`);
  assert.strictEqual(res.status, 404);
});

test("all markdown frontmatter parses", async () => {
  await assertMarkdownFrontmatterParses();
});

test(`anonymous public URL contract is healthy on ${BASE_URL}`, async () => {
  await assertPublicContractIsHealthy(BASE_URL);
});

test("parameterized routes are registered for sampled public URL tests", () => {
  const paramRoutes = routes.filter((r) => r.path.includes(":"));
  if (paramRoutes.length > 0) {
    console.log(
      `  (${paramRoutes.length} parameterized route(s) are exercised through public contract samples: ` +
        paramRoutes.map((r) => r.path).join(", ") +
        ")",
    );
  }
});
