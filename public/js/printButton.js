document.addEventListener("DOMContentLoaded", () => {
  const htmlEl = document.documentElement;

  const originalView = htmlEl.getAttribute("data-view-type");
  const currentView = () => htmlEl.getAttribute("data-view-type");

  const printPreviewButton = document.getElementById("print-preview-button");
  const printButton = document.getElementById("print-button");

  if (printPreviewButton) {
    printPreviewButton.addEventListener("click", () => {
      const view = currentView() == "paper" ? originalView : "paper";
      console.log("Original view:  ", originalView);
      console.log("Setting view to ", view);

      // 1. Switch to paper view instantly without a reload
      htmlEl.setAttribute("data-view-type", view);
    });
  }
  if (printButton) {
    printButton.addEventListener("click", () => {
      // 1. Switch to paper view instantly without a reload
      htmlEl.setAttribute("data-view-type", "paper");

      // 2. Trigger the system print dialog
      window.print();

      // 3. Revert to original view once the dialog closes
      htmlEl.setAttribute("data-view-type", originalView);
    });
  }
});
