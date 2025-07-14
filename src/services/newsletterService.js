// src/services/newsletterService.js
const fs = require("fs").promises;
const path = require("path");
const {
  FILE_PATH,
  EMAIL_REGEX,
  ERRORS,
} = require("../constants/newsletterConstants");

let writeLock = Promise.resolve();

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

async function saveEmail(email) {
  try {
    if (!isValidEmail(email)) {
      throw new Error(ERRORS.INVALID_EMAIL);
    }

    const sanitizedEmail = email.trim().toLowerCase();

    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });

    writeLock = writeLock.then(async () => {
      let data = [];
      try {
        const file = await fs.readFile(FILE_PATH, "utf8");
        data = JSON.parse(file);
      } catch (e) {
        if (e.code !== "ENOENT" && !(e instanceof SyntaxError)) {
          console.error(ERRORS.PARSE_FAILURE, e);
          throw e;
        }
      }

      if (!data.includes(sanitizedEmail)) {
        data.push(sanitizedEmail);
        try {
          await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2));
        } catch (err) {
          console.error(ERRORS.WRITE_FAILURE, err);
          throw err;
        }
      }
    });
  } catch (err) {
    console.error(ERRORS.SAVE_EMAIL_FAILURE, err);
    throw err;
  }
  return await writeLock;
}

module.exports = { saveEmail };
