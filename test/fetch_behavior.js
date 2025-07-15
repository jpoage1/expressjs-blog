// test-sitemap.js
const fetch = require("node-fetch");

async function test() {
  const res = await fetch("http://127.0.0.1:3400/sitemap.json");
  const data = await res.json();

  console.log("Status:", res.status);
  console.log("Data:", JSON.stringify(data, null, 2));
  console.log("Routes:", data);
}

test().catch(console.error);
