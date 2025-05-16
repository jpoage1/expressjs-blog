// src/utils/baseContext.js
function getBaseContext(overrides = {}) {
  return Object.assign(
    {
      siteOwner: "Jason Poage",
      navLinks: [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
      ],
    },
    overrides
  );
}
module.exports = getBaseContext;
