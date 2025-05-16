// src/utils/baseContext.js
const path = require("path");
const getPostsMenu = require("../services/postsService");
const { formatMonth } = require("../utils/formatMonth");
async function getBaseContext(overrides = {}) {
  const menu = await getPostsMenu(path.join(__dirname, "../../posts"));
  return Object.assign(
    {
      siteOwner: "Jason Poage",
      navLinks: [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
      ],
      years: menu,
      formatMonth,
    },
    overrides
  );
}

module.exports = getBaseContext;
