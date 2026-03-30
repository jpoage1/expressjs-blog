/**
 * Manages the lifecycle of recruiter credentials.
 * Ensures credentials are only generated on explicit user intent.
 */
class CredentialManager {
  constructor() {
    this.container = document.getElementById("manager-container");
    this.token = this.container?.dataset.token || null;

    this.isAuthenticated = this.container?.dataset.authenticated === "true";
    this.username = this.container?.dataset.username || null;
    this.groups = this.container?.dataset.groups || [];

    // Capture redirect target from URL or default to root
    const urlParams = new URLSearchParams(window.location.search);
    this.hasRedirect = urlParams.has("rd");
    this.redirectUri = urlParams.get("rd") || "/guest-access";
    this.action = urlParams.get("action");
  }

  /**
   * Initializes event listeners for the reveal action.
   */
  async init() {
    // 1. Determine Identity State before binding listeners
    if (this.action === "logout") {
      await this.handleLogout();
      window.location.href = window.location.pathname;
      console.log(window.location.pathname);
      return;
    }
    await this.checkSession();

    const showTokenBtn = document.getElementById("show-token-entry-btn");
    const backBtns = document.querySelectorAll(".back-link-btn");
    const submitTokenBtn = document.getElementById("submit-token-btn");
    const saveCheck = document.getElementById("save-check");
    const returnLoginBtn = document.getElementById("return-to-login-btn");
    const authForm = document.getElementById("auth-form");
    const logoutBtn = document.getElementById("logout-btn");
    const reLoginBtn = document.getElementById("re-login-btn");

    if (showTokenBtn) {
      showTokenBtn.addEventListener("click", () =>
        this._switchState("login-section", "token-entry-section"),
      );
    }

    backBtns.forEach((btn) => {
      btn.addEventListener("click", () =>
        this._switchState("token-entry-section", "login-section"),
      );
    });

    if (submitTokenBtn) {
      submitTokenBtn.addEventListener("click", () => {
        const input = document.getElementById("token-input-field");
        this.token = input?.value.trim();
        if (this.token) this.handleReveal();
      });
    }

    if (this.token && this.token !== "") {
      this._switchState("login-section", "token-entry-section");
      this.handleReveal();
    }

    if (saveCheck) {
      saveCheck.addEventListener("change", (e) => {
        if (returnLoginBtn) {
          returnLoginBtn.disabled = !e.target.checked;
          returnLoginBtn.classList.toggle("btn-disabled", !e.target.checked);
        }
      });
    }

    if (returnLoginBtn) {
      returnLoginBtn.addEventListener("click", () => {
        this._switchState("credential-section", "login-section");
      });
    }

    if (authForm) {
      authForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.handleLogout());
    }
    if (reLoginBtn) {
      reLoginBtn.addEventListener("click", () => {
        this._switchState("logout-success-section", "login-section");
      });
    }
  }

  _switchState(fromId, toId) {
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);
    if (fromEl) fromEl.classList.add("hidden");
    if (toEl) toEl.classList.remove("hidden");
  }

  submitToken() {
    const submitBtn = document.getElementById("submit-token-btn");
    const tokenInput = document.getElementById("token-input");

    if (manualBtn) {
      manualBtn.addEventListener("click", () => {
        const tokenValue = tokenInput.value.trim();
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
    const btn = document.getElementById("submit-token-btn");
    this._toggleLoading(btn, true);

    try {
      const response = await fetch(
        `https://access.jasonpoage.com/access/${this.token}`,
      );
      const data = await this._processResponse(response);
      this._displayCredentials(data);
    } catch (err) {
      this._handleRevealError(err.message);
    } finally {
      this._toggleLoading(btn, false);
    }
  }

  /**
   * Validates response status and parses JSON payload.
   */
  async _processResponse(response) {
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
    document.getElementById("token-entry-section").classList.add("hidden");
    document.getElementById("credential-section").classList.remove("hidden");

    document.getElementById("username").innerText = data.username;
    document.getElementById("password").innerText = data.password;

    this._initCopyButtons();
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
  async handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById("login-submit-btn");
    const errorEl = document.getElementById("login-error");

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const keepMeLoggedIn =
      document.getElementById("login-remember")?.checked || false;

    btn.disabled = true;
    btn.innerText = "AUTHENTICATING...";

    try {
      // STEP 1: Satisfy Authelia's Identity Check via AJAX
      // This puts the 'authelia_session' cookie in your browser.
      const response = await fetch(
        "https://auth.jasonpoage.com/api/firstfactor",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, keepMeLoggedIn }),
          credentials: "include", // CRITICAL: This allows the browser to save the cookie
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Invalid credentials.");
      }

      // STEP 2: Trigger the OIDC Handshake
      // Now that Authelia has your session cookie, this redirect will
      // "blip" through Authelia and back to your app instantly.
      const loginUrl = "/auth/login";
      const target = this.hasRedirect
        ? `?returnTo=${encodeURIComponent(this.redirectUri)}`
        : "";
      const loginUri = `${loginUrl}${target}`;

      console.log(loginUri);
      window.location.href = loginUri;
    } catch (err) {
      if (errorEl) {
        errorEl.innerText = err.message;
        errorEl.classList.remove("hidden");
      }
      btn.disabled = false;
      btn.innerText = "SIGN IN";
    }
  }
  /**
   * Checks if a session cookie is already active via Authelia.
   */
  async checkSession() {
    try {
      // Query the Express App, not the Authelia Portal
      const response = await fetch("/api/auth/status");

      if (response.ok) {
        const session = await response.json();

        if (session.isAuthenticated) {
          if (this.hasRedirect && this.redirectUri !== "/") {
            window.location.href = this.redirectUri;
          } else {
            // Use the verified session username and groups
            this._displayLogoutState(this.username);
          }
        }
      }
    } catch (err) {
      console.log("No active application session detected.");
    }
  }

  _displayLogoutState(username) {
    document.getElementById("session-username").innerText = username;
    this._switchState("login-section", "logout-section");

    // Provide a way back if they ended up here by mistake
    const continueBtn = document.getElementById("continue-btn");
    if (this.hasRedirect && continueBtn) {
      continueBtn.classList.remove("hidden");
      continueBtn.onclick = () => (window.location.href = this.redirectUri);
    }
  }

  async handleLogout() {
    const btn = document.getElementById("logout-btn");
    if (btn) {
      btn.disabled = true;
      btn.innerText = "SIGNING OUT...";
    }

    try {
      // 1. Terminate the Express App session
      const appLogout = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (appLogout.ok) {
        this.isAuthenticated = false;
        this.container.dataset.authenticated = "false";
        this._switchState("logout-section", "logout-success-section");
      } else {
        throw new Error("Logout failed");
      }
    } catch (err) {
      console.error("Logout process failed:", err);
      if (btn) {
        btn.disabled = false;
        btn.innerText = "SIGN OUT";
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CredentialManager().init();
});
