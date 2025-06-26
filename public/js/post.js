// static/js/post.js

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

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  });
});

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
