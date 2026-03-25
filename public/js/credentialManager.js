/**
 * Manages the lifecycle of recruiter credentials.
 * Ensures credentials are only generated on explicit user intent.
 */
class CredentialManager {
  constructor() {
    this.container = document.getElementById("manager-container");
    this.token = this.container ? this.container.dataset.token : null;
  }

  /**
   * Initializes event listeners for the reveal action.
   */
  init() {
    const self = this;
    const revealBtn = document.getElementById("reveal-btn");

    if (revealBtn) {
      revealBtn.addEventListener("click", () => self.handleReveal());
    }
  }

  submitToken() {
    const submitBtn = document.getElementById("submit-token-btn");
    const manualInput = document.getElementById("token-input");

    if (manualBtn) {
      manualBtn.addEventListener("click", () => {
        const tokenValue = manualInput.value.trim();
        if (tokenValue) {
          // Update container attribute for use by existing logic
          container.setAttribute("data-token", tokenValue);

          // Trigger the reveal logic defined in your reveal-btn listener
          revealCredentials();
        }
      });
    }
  }

  /**
   * Orchestrates the reveal process via POST request.
   */
  async handleReveal() {
    const self = this;
    const btn = document.getElementById("reveal-btn");

    self._toggleLoading(btn, true);

    try {
      const response = await fetch(
        `https://access.jasonpoage.com/access/${self.token}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await self._processResponse(response);
      self._displayCredentials(data);
    } catch (err) {
      self._handleRevealError(err.message);
    } finally {
      self._toggleLoading(btn, false);
    }
  }

  /**
   * Validates response status and parses JSON payload.
   */
  async _processResponse(response) {
    const self = this;
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Updates DOM elements with credential data and transitions visibility.
   */
  _displayCredentials(data) {
    const self = this;
    const revealSection = document.getElementById("reveal-section");
    const credSection = document.getElementById("credential-section");

    document.getElementById("reveal-message").innerText = data.message;
    document.getElementById("username").innerText = data.username;
    document.getElementById("password").innerText = data.password;

    revealSection.classList.add("hidden");
    credSection.classList.remove("hidden");

    self._initCopyButtons();
  }

  /**
   * Binds clipboard actions using dynamic import in-place.
   */
  async _initCopyButtons() {
    const self = this;
    const userTrigger = document.getElementById("copy-user-btn");
    const userSource = document.getElementById("username");
    const passTrigger = document.getElementById("copy-pass-btn");
    const passSource = document.getElementById("password");

    const copyUtils = await import("./copyUtils.js");
    copyUtils.bindCopyAction(userTrigger, userSource);
    copyUtils.bindCopyAction(passTrigger, passSource);
  }

  /**
   * UI state helper for the reveal button.
   */
  _toggleLoading(element, isLoading) {
    const self = this;
    element.disabled = isLoading;
    element.innerText = isLoading ? "GENERATING..." : "GET CREDENTIALS";
  }

  /**
   * Renders error state in the reveal section.
   */
  _handleRevealError(msg) {
    const self = this;
    const messageEl = document.getElementById("reveal-section");
    messageEl.innerHTML = `<h1 style="color: #ef4444">Access Denied</h1><p>${msg}</p>`;
  }
}

const manager = new CredentialManager();
manager.init();
