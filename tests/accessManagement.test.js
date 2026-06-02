import { expect, test, vi, beforeEach } from "vitest";

beforeEach(() => {
  document.body.innerHTML = `
    <button id="generate-btn">Generate</button>
    <div id="result-container" class="hidden">
        <div id="link-output"></div>
        <button id="copy-link-btn">Copy</button>
    </div>
  `;

  // Mock Global Fetch
  global.fetch = vi.fn();
});

test("UI updates correctly on successful fetch", async () => {
  const mockData = { access_uri: "/access/uuid-123" };
  fetch.mockResolvedValue({
    ok: true,
    json: async () => mockData,
  });

  // Trigger Logic
  const { handleGeneration } = await import("../static/js/adminPortal.js");
  document.getElementById("generate-btn").click();

  // Await microtasks for fetch resolution
  await new Promise((resolve) => setTimeout(resolve, 0));

  const output = document.getElementById("link-output");
  const container = document.getElementById("result-container");

  expect(output.innerText).toContain("/access/uuid-123");
  expect(container.classList.contains("hidden")).toBe(false);
});

test("Handles network failure and displays error", async () => {
  fetch.mockResolvedValue({
    ok: false,
    status: 500,
  });

  document.getElementById("generate-btn").click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const output = document.getElementById("link-output");
  expect(output.innerText).toContain("Error: Execution Failed: 500");
});

test("Generate button is disabled during fetch and re-enabled after", async () => {
  let resolveFetch;
  const fetchPromise = new Promise((resolve) => {
    resolveFetch = resolve;
  });

  fetch.mockReturnValue(
    fetchPromise.then(() => ({
      ok: true,
      json: async () => ({ access_uri: "/test" }),
    })),
  );

  const btn = document.getElementById("generate-btn");
  btn.click();

  expect(btn.disabled).toBe(true);

  resolveFetch();
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(btn.disabled).toBe(false);
});
