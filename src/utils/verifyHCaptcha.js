const fetch = require("node-fetch");
const { hcaptcha } = require("../config/loader");

async function verifyHCaptcha(token) {
  const secret = hcaptcha.secret; // Your hCaptcha secret key
  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await response.json();
  return data.success === true;
}
module.exports = verifyHCaptcha;
