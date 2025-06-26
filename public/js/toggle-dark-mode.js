// Dark Mode Toggle
(function darkModeToggle() {
  const toggle = document.createElement("button");
  toggle.textContent = "Toggle Dark Mode";
  toggle.id = "dark-mode-toggle";
  document.body.prepend(toggle);

  function applyMode(dark) {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light"
    );
    localStorage.setItem("darkMode", dark);
  }

  toggle.addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    applyMode(!dark);
  });

  // Initialize from saved preference or system
  const saved = localStorage.getItem("darkMode");
  if (saved !== null) applyMode(saved === "true");
  else applyMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
})();
