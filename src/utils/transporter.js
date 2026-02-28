// src/utils/transporter.js
const nodemailer = require("nodemailer");
const { mail } = require("../config/loader");

require("dotenv").config();

let { auth } = mail;
const transporter = nodemailer.createTransport({
  host: mail.host,
  port: parseInt(mail.port, 10),
  secure: mail.secure === "true",
  auth,
});

module.exports = transporter;
