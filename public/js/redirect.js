document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector(".redirect-container");
  if (!container) return;

  const url = container.getAttribute("data-redirect-url");
  if (!url) return;

  // Redirect methods
  setTimeout(() => (window.location.href = url), 100);
  setTimeout(() => window.location.replace(url), 1000);
  setTimeout(() => (document.location = url), 2000);
});
