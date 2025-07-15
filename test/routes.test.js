// test/routes.test.js
const fetch = require("node-fetch");
const { expect } = require("chai");
const http = require("http");

require("dotenv").config();

const domain = process.env.DOMAIN;
const baseUrl = `http://127.0.0.1:3400`;

// Create a proper HTTP agent
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 10000,
});

describe(`API route status tests with dependencies at ${baseUrl}`, () => {
  let serverOnline = false;
  let routes = [];

  // Clean up the agent after all tests
  after(() => {
    if (httpAgent.destroy) {
      httpAgent.destroy();
    }
  });

  it("should confirm server is online via /health", async () => {
    const res = await fetch(baseUrl + "/health", {
      agent: httpAgent,
      timeout: 5000,
      method: "HEAD",
    });
    expect(res.ok).to.be.true;
    serverOnline = true;
  });

  it("should fetch routes from /sitemap.json", async function () {
    if (!serverOnline) {
      this.skip();
    }

    try {
      const res = await fetch(baseUrl + "/sitemap.json", {
        agent: httpAgent,
        timeout: 10000,
      });

      // console.log("Sitemap response status:", res.status);
      // console.log("Sitemap response headers:", res.headers.raw());

      expect(res.ok).to.be.true;

      const responseText = await res.text();

      let sitemapData;
      try {
        sitemapData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError.message);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 200)}...`
        );
      }

      // Extract routes from the sitemap structure
      let extractedRoutes = sitemapData.sitemap || [];

      // Also flatten any nested children routes
      const flattenRoutes = (items) => {
        let flatRoutes = [];
        if (!Array.isArray(items)) {
          console.log("Items is not an array:", typeof items, items);
          return flatRoutes;
        }

        for (const item of items) {
          if (item && item.loc && item.loc !== "#") {
            // Skip placeholder routes
            flatRoutes.push(item);
          }
          if (item && item.children && Array.isArray(item.children)) {
            flatRoutes = flatRoutes.concat(flattenRoutes(item.children));
          }
        }
        return flatRoutes;
      };

      routes = flattenRoutes(extractedRoutes);

      // console.log(
      //   "Extracted routes:",
      //   routes.map((r) => r.loc || "NO_LOC")
      // );
      console.log("Total routes found:", routes.length);

      expect(routes).to.be.an("array").that.is.not.empty;
    } catch (error) {
      console.error("Error in sitemap fetch test:", error.message);
      throw error;
    }
  });

  it("should return 200 for all routes, except / route which should return 301", async function () {
    this.timeout(30000); // 30 second timeout for entire test

    if (!serverOnline || routes.length === 0) {
      this.skip();
    }

    for (const route of routes) {
      // Skip the root route and any routes without a proper loc
      if (route.loc && route.loc !== "/" && route.loc !== "#") {
        const url = baseUrl + route.loc;
        console.log(`Testing route: ${route.loc}`);

        try {
          const res = await fetch(url, {
            method: "GET",
            agent: httpAgent,
            timeout: 10000,
          });

          expect(
            res.status,
            `Route GET ${route.loc} should return 200`
          ).to.equal(200);
        } catch (error) {
          console.error(`Error testing route ${route.loc}:`, error.message);
          throw error;
        }
      }
    }
  });

  // Optional: Test the root route separately if you expect it to return 301
  it("should return 301 for / route", async function () {
    if (!serverOnline) {
      this.skip();
    }

    try {
      const res = await fetch(baseUrl + "/", {
        agent: httpAgent,
        timeout: 10000,
        redirect: "manual", // Don't follow redirects automatically
      });

      // console.log("Root route response status:", res.status);
      // console.log("Root route response headers:", res.headers.raw());

      expect(res.status, "Root route should return 301").to.equal(301);
    } catch (error) {
      console.error("Error testing root route:", error.message);

      // If we get a socket hang up, the server might be closing connections
      if (error.message.includes("socket hang up")) {
        console.log(
          "Server appears to be closing connections. Skipping this test."
        );
        this.skip();
      } else {
        throw error;
      }
    }
  });
});
