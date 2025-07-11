// middleware/authCheck.js
const fetch = require("node-fetch");
const VERIFY_URL = "https://auth.jasonpoage.com/api/verify";

module.exports = async (req, res, next) => {
  const cookie = req.headers["cookie"] || "";
  const authHeader = req.headers["authorization"] || "";

  try {
    const resVerify = await fetch(VERIFY_URL, {
      headers: {
        cookie,
        authorization: authHeader,
      },
      credentials: "include",
    });

    // const body = await resVerify.text();

    req.isAuthenticated = resVerify.status === 200;

    // req.log.debug("[AuthCheck] Response status:", resVerify.status);
    // req.log.debug("[AuthCheck] Response headers:", Object.fromEntries(resVerify.headers.entries()));
    // req.log.debug("[AuthCheck] Response body:", body);

    req.log.info("Authenticated Result", req.isAuthenticated);
  } catch (err) {
    req.isAuthenticated = false;
    req.log.error("[AuthCheck] Fetch error:", err);
  }

  next();
};
