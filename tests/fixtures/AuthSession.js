const fetch = require("node-fetch").default;
const config = require("#config");

class TestSession {
  constructor() {
    this.cookies = new Map();
    const { schema, domain, port } = config.public;
    this.appBase = `${schema}://${domain}${port === 80 || port === 443 ? "" : `:${port}`}`;
  }

  /**
   * Builds the cookie header string for fetch requests.
   */
  _getCookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  /**
   * Parses Set-Cookie headers and updates the internal jar.
   */
  _parseCookies(response) {
    const setCookie = response.headers.raw()["set-cookie"];
    if (!setCookie) return;

    setCookie.forEach((cookieStr) => {
      const [pair] = cookieStr.split(";");
      const [name, value] = pair.split("=");
      this.cookies.set(name.trim(), value.trim());
    });
  }

  /**
   * Authenticates against Authelia and triggers the OIDC callback.
   */
  async authenticate() {
    const { endpoints, testing } = config;

    // 1. POST to Authelia API (External Endpoint)
    const authResponse = await fetch(endpoints.authEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testing.username,
        password: testing.password,
        keepMeLoggedIn: true,
      }),
    });

    if (!authResponse.ok) {
      throw new Error(`Authelia Auth Failed: ${authResponse.status}`);
    }
    this._parseCookies(authResponse);

    // 2. Trigger OIDC Login (Internal Path)
    // Carrying the Authelia cookie allows the OIDC provider to recognize the session
    const loginResponse = await fetch(`${this.appBase}${endpoints.loginPath}`, {
      headers: { cookie: this._getCookieHeader() },
      redirect: "follow",
    });

    this._parseCookies(loginResponse);
    return this._getCookieHeader();
  }

  /**
   * Wrapped fetch that automatically includes the session cookies.
   */
  async authenticatedFetch(url, options = {}) {
    const headers = {
      ...options.headers,
      cookie: this._getCookieHeader(),
    };
    return fetch(url, { ...options, headers });
  }
}

module.exports = TestSession;
