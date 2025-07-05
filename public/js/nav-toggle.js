function setupNavToggle() {
  const nav = document.getElementById("siteNav");
  const toggleBtn = document.getElementById("menuToggle");

  nav.classList.add("hide");

  if (window.innerWidth <= 768) {
    toggleBtn.onclick = toggleMenu;

    document.addEventListener("click", (e) => {
      const clickedInside =
        nav.contains(e.target) || toggleBtn.contains(e.target);
      if (!clickedInside && !nav.classList.contains("hide")) {
        nav.classList.add("hide");
      }
    });
  }
}

window.addEventListener("DOMContentLoaded", setupNavToggle);
window.addEventListener("resize", setupNavToggle);

function toggleMenu() {
  document.getElementById("siteNav").classList.toggle("hide");
}
