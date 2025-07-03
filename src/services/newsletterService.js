// src/services/newsletterService.js
let writeLock = Promise.resolve();

const fs = require("fs").promises;
const path = require("path");

const filePath = path.join(__dirname, "../../data/newsletter-emails.json");

// Basic email regex validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function saveEmail(email) {
  try {
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    // Sanitize input: trim whitespace and lowercase
    const sanitizedEmail = email.trim().toLowerCase();

    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    writeLock = writeLock.then(async () => {
      let data = [];
      try {
        const file = await fs.readFile(filePath, "utf8");
        // Attempt to parse the file content
        data = JSON.parse(file);
      } catch (e) {
        // If file doesn't exist (ENOENT) or contains invalid JSON (SyntaxError),
        // we treat it as an empty array and proceed.
        // Other errors should still be re-thrown.
        if (e.code !== "ENOENT" && !(e instanceof SyntaxError)) {
          console.error("Failed to parse newsletter-emails.json:", e);
          throw e;
        }
        // If ENOENT or SyntaxError, 'data' remains an empty array, which is desired.
      }

      if (!data.includes(sanitizedEmail)) {
        data.push(sanitizedEmail);
        try {
          await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (err) {
          console.error("writeFile failed:", err);
          throw err;
        }
      }
    });
  } catch (err) {
    console.error("Failed to save email:", err);
    throw err;
  }
  console.log("test2");
  return await writeLock;
}

module.exports = { saveEmail };
