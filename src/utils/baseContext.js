// src/utils/baseContext.js
const path = require("path");
const getPostsMenu = require("../services/postsMenuService");
const { formatMonth } = require("../utils/formatMonth");

async function getBaseContext(overrides = {}) {
  const menu = await getPostsMenu(path.join(__dirname, "../../content/posts"));
  console.log(process.env.HCAPTCHA_KEY);
  return Object.assign(
    {
      siteOwner: process.env.SITE_OWNER,
      originCountry: process.env.COUNTRY,
      hCaptchaKey: process.env.HCAPTCHA_KEY,
      navLinks: [
        { href: "/", label: "Home" },
        {
          // href: "/about",
          label: "About",
          submenu: [
            { href: "/about/me", label: "About Me" },
            { href: "/about/blog", label: "About This Blog" },
          ],
        },
        { href: "/newsletter", label: "Newsletter" },
        { href: "/tools", label: "Tools I use" },
        { href: "/projects", label: "Projects" },
        { href: "/contact", label: "Contact" },
      ],
      years: menu,
      formatMonth,
    },
    overrides
  );
}

module.exports = getBaseContext;
