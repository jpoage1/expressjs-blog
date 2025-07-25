// src/utils/transporter.js
const nodemailer = require("nodemailer");
require("dotenv").config();

let auth = null;
if (process.env.MAIL_AUTH != "null") {
  auth = {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  };
}
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT, 10),
  secure: process.env.MAIL_SECURE === "true",
  auth,
});

module.exports = transporter;
