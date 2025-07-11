// middleware/authCheck.js
const fetch = require("node-fetch");
const VERIFY_URL = process.env.AUTH_VERIFY;

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

    req.isAuthenticated = resVerify.status === 200;
  } catch (err) {
    req.isAuthenticated = false;
    req.log.error("[AuthCheck] Fetch error:", err);
  }

  next();
};
