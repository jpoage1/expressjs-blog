const fetch = require("node-fetch");
const http = require("http");
const https = require("https");
const fs = require("fs");

require("dotenv").config();

// Get URL from command-line arguments
const baseUrl = process.argv[2];
if (!baseUrl) {
  console.error("Usage: node routes.test.js <url>");
  process.exit(1);
}

const useHttps = baseUrl.startsWith("https");

const agent = useHttps
  ? new https.Agent({
      keepAlive: true,
      maxSockets: 10,
      timeout: 10000,
      // Uncomment if using SSL certs
      // ca: fs.readFileSync(process.env.SSL_CA_PATH),
      // cert: fs.readFileSync(process.env.SSL_CERT_PATH),
      // key: fs.readFileSync(process.env.SSL_KEY_PATH),
      // rejectUnauthorized: true,
    })
  : new http.Agent({
      keepAlive: true,
      maxSockets: 10,
      timeout: 10000,
    });

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

fetch(baseUrl, {
  method: "GET",
  agent,
  redirect: "manual", // Do not follow redirects
  signal: controller.signal,
})
  .then(async (res) => {
    console.log(await res.headers);
    console.log(await res.status);
    // console.log(await res.text());
  })
  .catch((err) => {
    if (err.name === "AbortError") {
      console.error("Request timed out");
    } else {
      console.error("Fetch error:", err);
    }
  })
  .finally(() => {
    clearTimeout(timeout);
  });
