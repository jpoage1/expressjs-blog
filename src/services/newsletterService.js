// src/services/newsletterService.js
const fs = require("fs").promises;
const path = require("path");
const { FILE_PATH, ERRORS } = require("../constants/newsletterConstants");
const { validateAndSanitizeEmail } = require("../utils/emailValidator");

let writeLock = Promise.resolve();

async function saveEmail(rawEmail) {
  const { valid, email, message } = validateAndSanitizeEmail(rawEmail);
  if (!valid) throw new Error(message || ERRORS.INVALID_EMAIL);

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

    if (!data.includes(email)) {
      data.push(email);
      try {
        await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2));
      } catch (err) {
        console.error(ERRORS.WRITE_FAILURE, err);
        throw err;
      }
    }
  });

  return await writeLock;
}

async function unsubscribeEmail(rawEmail) {
  const { valid, email, message } = validateAndSanitizeEmail(rawEmail);
  if (!valid) throw new Error(message || ERRORS.INVALID_EMAIL);

  writeLock = writeLock.then(async () => {
    let data = [];
    try {
      const file = await fs.readFile(FILE_PATH, "utf8");
      data = JSON.parse(file);
    } catch (e) {
      if (e.code === "ENOENT") return;
      if (!(e instanceof SyntaxError)) {
        console.error(ERRORS.PARSE_FAILURE, e);
        throw e;
      }
    }

    const index = data.indexOf(email);
    if (index !== -1) {
      data.splice(index, 1);
      try {
        await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2));
      } catch (err) {
        console.error(ERRORS.WRITE_FAILURE, err);
        throw err;
      }
    }
  });

  return await writeLock;
}

module.exports = { saveEmail, unsubscribeEmail };
