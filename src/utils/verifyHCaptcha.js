const fetch = require("node-fetch");

async function verifyHCaptcha(token) {
  const secret = process.env.HCAPTCHA_SECRET; // Your hCaptcha secret key
  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await response.json();
  return data.success === true;
}
module.exports = verifyHCaptcha;
