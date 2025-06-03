// Syntax Highlighting with Prism.js (include Prism CSS/JS separately)
// Automatically highlight all <pre><code> blocks
document.querySelectorAll("pre code").forEach((block) => {
  Prism.highlightElement(block);
});

// Copy-to-Clipboard Buttons for Code Blocks
document.querySelectorAll("pre").forEach((pre) => {
  const btn = document.createElement("button");
  btn.textContent = "Copy";
  btn.type = "button";
  btn.className = "copy-btn";
  btn.style.position = "absolute";
  btn.style.top = "0.5rem";
  btn.style.right = "0.5rem";

  btn.addEventListener("click", () => {
    const code = pre.querySelector("code");
    if (!code) return;
    navigator.clipboard.writeText(code.innerText).then(() => {
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy"), 2000);
    });
  });

  pre.style.position = "relative";
  pre.appendChild(btn);
});

// Table of Contents Generation from h2, h3 in .post-content
(function generateTOC() {
  const content = document.querySelector(".post-content");
  if (!content) return;
  const tocContainer = document.createElement("nav");
  tocContainer.className = "toc";
  const tocList = document.createElement("ul");

  content.querySelectorAll("h2, h3").forEach((heading) => {
    if (!heading.id)
      heading.id = heading.textContent
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

    const li = document.createElement("li");
    li.className = heading.tagName.toLowerCase();

    const a = document.createElement("a");
    a.href = `#${heading.id}`;
    a.textContent = heading.textContent;

    li.appendChild(a);
    tocList.appendChild(li);
  });

  tocContainer.appendChild(tocList);

  // Insert TOC before post content or in sidebar if exists
  const sidebar = document.querySelector(".sidebar nav");
  if (sidebar) sidebar.appendChild(tocContainer);
  else content.parentNode.insertBefore(tocContainer, content);
})();

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  });
});

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

// External Link Detection and Attributes
document.querySelectorAll('.post-content a[href^="http"]').forEach((link) => {
  if (new URL(link.href).origin !== location.origin) {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    // Optionally append icon for external link:
    const extIcon = document.createElement("span");
    extIcon.textContent = " ↗";
    extIcon.setAttribute("aria-hidden", "true");
    link.appendChild(extIcon);
  }
});

// Accessibility: Focus outlines on keyboard navigation
(function manageFocusOutline() {
  function handleFirstTab(e) {
    if (e.key === "Tab") {
      document.body.classList.add("user-is-tabbing");
      window.removeEventListener("keydown", handleFirstTab);
    }
  }
  window.addEventListener("keydown", handleFirstTab);
})();
