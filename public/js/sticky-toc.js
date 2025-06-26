(function generateTOC() {
  const content = document.querySelector(".markdown-content");
  if (!content) return;
  const headings = content.querySelectorAll("h2, h3");
  if (headings.length <= 1) return;

  const tocContainer = document.createElement("nav");
  tocContainer.className = "toc";

  const tocHeader = document.createElement("h2");
  tocHeader.className = "toc-header";
  tocHeader.textContent = "Table of Contents";
  tocContainer.appendChild(tocHeader);

  const tocList = document.createElement("ul");
  headings.forEach((heading) => {
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

  const sidebar = document.querySelector(".sidebar nav");
  if (sidebar) sidebar.appendChild(tocContainer);
  else content.parentNode.insertBefore(tocContainer, content);

  // Enhanced sticky behavior with footer boundary
  const tocParent = tocContainer.parentElement;
  const footer = document.querySelector("footer");

  // Get initial measurements
  let stickyOffset = tocContainer.offsetTop;
  let tocHeight = tocContainer.offsetHeight;

  function updateStickyBehavior() {
    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const footerTop = footer.offsetTop;

    // Recalculate measurements on scroll (handles dynamic content)
    tocHeight = tocContainer.offsetHeight;

    // Calculate the maximum scroll position where TOC should stop being sticky
    // This ensures the TOC doesn't overlap with the footer
    const maxStickyPosition = footerTop - tocHeight - 20; // 20px buffer

    if (scrollTop >= stickyOffset && scrollTop <= maxStickyPosition) {
      // Normal sticky behavior
      tocContainer.classList.add("sticky");
      tocContainer.classList.remove("bottom-boundary");
      tocContainer.style.width = `${tocParent.offsetWidth}px`;
      const parentRect = tocParent.getBoundingClientRect();
      tocContainer.style.left = `${parentRect.left}px`;
      tocContainer.style.top = "20px"; // Small top margin when sticky
      tocContainer.style.bottom = "auto";
    } else if (scrollTop > maxStickyPosition) {
      // Hit the footer boundary - absolute position relative to footer
      tocContainer.classList.add("sticky");
      tocContainer.classList.add("bottom-boundary");
      tocContainer.style.width = `${tocParent.offsetWidth}px`;
      const parentRect = tocParent.getBoundingClientRect();
      tocContainer.style.left = `${parentRect.left}px`;
      tocContainer.style.top = "auto";
      tocContainer.style.bottom = `${
        document.body.offsetHeight - footerTop + 20
      }px`;
    } else {
      // Not sticky - normal position
      tocContainer.classList.remove("sticky");
      tocContainer.classList.remove("bottom-boundary");
      tocContainer.style.width = "";
      tocContainer.style.left = "";
      tocContainer.style.top = "";
      tocContainer.style.bottom = "";
    }
  }

  // Throttle scroll event for better performance
  let ticking = false;
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateStickyBehavior);
      ticking = true;
      setTimeout(() => {
        ticking = false;
      }, 16); // ~60fps
    }
  }

  window.addEventListener("scroll", requestTick);
  window.addEventListener("resize", () => {
    // Recalculate offset on resize
    if (!tocContainer.classList.contains("sticky")) {
      stickyOffset = tocContainer.offsetTop;
    }
    requestTick();
  });

  // Smooth scroll for TOC links
  tocContainer.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      e.preventDefault();
      const targetId = e.target.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80; // Account for sticky header
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    }
  });
})();
