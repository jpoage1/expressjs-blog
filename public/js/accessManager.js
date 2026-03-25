import { bindCopyAction } from "./copyUtils.js";

/**
 * Handles communication with the admin access endpoint.
 * Credentials included to satisfy Nginx auth_request proxy.
 */
async function fetchAccessLink() {
  const endpoint = "https://access.jasonpoage.com/admin/generate-link";
  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
  });

  return await processResponse(response);
}

/**
 * Validates and parses the response from the generator endpoint.
 * Logic extracted to maintain flat nesting.
 */
async function processResponse(response) {
  if (!response.ok) {
    throw new Error(`Execution Failed: ${response.status}`);
  }
  return response.json();
}


/**
 * Updates the DOM with the generated URI and initializes copy logic.
 */
function updateUI(data) {
  const token = document.getElementById("token-output");
  const output = document.getElementById("link-output");
  const container = document.getElementById("result-container");
  const copyBtn = document.getElementById("copy-link-btn");
  const copyTokenBtn = document.getElementById("copy-token-btn");

  // Dynamically construct URL based on environment
  const fullUrl = `${window.location.origin}/guest-access/${data.access_token}`;

  output.innerText = fullUrl;
  token.innerText = data.access_token;

  container.classList.remove("hidden");

  bindCopyAction(copyBtn, output);
  bindCopyAction(copyTokenBtn, token);
}

/**
 * Orchestrates the generation workflow.
 */
function handleGeneration() {
  const btn = document.getElementById("generate-btn");
  btn.disabled = true;

  fetchAccessLink()
    .then(updateUI)
    .catch((err) => {
      document.getElementById("link-output").innerText =
        `Error: ${err.message}`;
      document.getElementById("result-container").classList.remove("hidden");
    })
    .finally(() => {
      btn.disabled = false;
    });
}

document
  .getElementById("generate-btn")
  .addEventListener("click", handleGeneration);
