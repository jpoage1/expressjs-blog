class LogsViewer {
  constructor() {
    this.form = document.getElementById("filterForm");
    this.theadRow = document.getElementById("logsTableHeaderRow");
    this.tbody = document.querySelector("#logsTable tbody");
    this.currentPage = 1;
    this.limit = 50;
    this.columns = [];
    this.isLoading = false;
    this.hasMore = true;
    this.totalPages = 0;
    this.currentFilters = {};
    this.abortController = null; // For canceling requests

    this.setupEventListeners();
    this.setupPaginationControls();
  }

  setupEventListeners() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.resetAndLoad();
    });

    // Debounced scroll handler to prevent excessive calls
    let scrollTimeout;
    window.addEventListener("scroll", () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (this.isNearBottom() && !this.isLoading && this.hasMore) {
          this.loadNextPage();
        }
      }, 100);
    });
  }

  setupPaginationControls() {
    // Create pagination container
    const paginationContainer = document.createElement("div");
    paginationContainer.id = "paginationContainer";
    paginationContainer.className = "pagination-container";
    paginationContainer.innerHTML = `
      <div class="pagination-info">
        <span id="pageInfo">Page 0 of 0 (0 total logs)</span>
        <div class="pagination-controls">
          <button id="firstPage" disabled>First</button>
          <button id="prevPage" disabled>Previous</button>
          <input type="number" id="pageInput" min="1" value="1" style="width: 60px;">
          <button id="nextPage" disabled>Next</button>
          <button id="lastPage" disabled>Last</button>
        </div>
      </div>
      <div class="loading-indicator" id="loadingIndicator" style="display: none;">
        Loading more logs...
      </div>
    `;

    // Insert after the form
    this.form.parentNode.insertBefore(
      paginationContainer,
      this.form.nextSibling
    );

    // Add pagination event listeners
    document
      .getElementById("firstPage")
      .addEventListener("click", () => this.goToPage(1));
    document
      .getElementById("prevPage")
      .addEventListener("click", () => this.goToPage(this.currentPage - 1));
    document
      .getElementById("nextPage")
      .addEventListener("click", () => this.goToPage(this.currentPage + 1));
    document
      .getElementById("lastPage")
      .addEventListener("click", () => this.goToPage(this.totalPages));

    document.getElementById("pageInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const page = parseInt(e.target.value);
        if (page >= 1 && page <= this.totalPages) {
          this.goToPage(page);
        }
      }
    });
  }

  isNearBottom() {
    return (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000
    );
  }

  async resetAndLoad() {
    // Cancel any pending request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.currentPage = 1;
    this.hasMore = true;
    this.columns = [];
    this.currentFilters = new URLSearchParams(new FormData(this.form));

    // Clear table efficiently
    this.theadRow.innerHTML = "";
    this.tbody.innerHTML = "";

    await this.loadLogs(false);
  }

  async loadNextPage() {
    if (this.hasMore && !this.isLoading) {
      this.currentPage++;
      await this.loadLogs(true);
    }
  }

  async goToPage(page) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      // Cancel any pending request
      if (this.abortController) {
        this.abortController.abort();
      }

      this.currentPage = page;
      this.columns = [];

      // Clear table efficiently
      this.theadRow.innerHTML = "";
      this.tbody.innerHTML = "";

      await this.loadLogs(false);
    }
  }

  async loadLogs(append = false) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

    // Create new abort controller for this request
    this.abortController = new AbortController();

    const params = new URLSearchParams(this.currentFilters);
    params.append("page", this.currentPage);
    params.append("limit", this.limit);

    try {
      const res = await fetch("/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
        signal: this.abortController.signal,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      this.hasMore = data.pagination.hasMore;
      this.totalPages = data.pagination.totalPages;

      if (data.logs.length === 0 && !append) {
        this.tbody.innerHTML = '<tr><td colspan="1">No logs found</td></tr>';
        this.updatePaginationInfo(0, 0, 0);
        return;
      }

      this.renderLogs(data.logs, append);
      this.updatePaginationInfo(
        data.pagination.page,
        data.pagination.totalPages,
        data.pagination.total
      );
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === "AbortError") {
        return;
      }

      const errorMsg = `<tr><td colspan="1">Error loading logs: ${error.message}</td></tr>`;
      if (append) {
        this.tbody.innerHTML += errorMsg;
      } else {
        this.tbody.innerHTML = errorMsg;
      }
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  renderLogs(logs, append = false) {
    if (logs.length === 0) return;

    // Build column set more efficiently
    const columnSet = new Set(this.columns);
    for (const log of logs) {
      Object.keys(log).forEach((key) => columnSet.add(key));
    }

    const newColumns = Array.from(columnSet);

    // Update headers if new columns or not appending
    if (!append || newColumns.length > this.columns.length) {
      this.columns = newColumns;
      this.updateHeaders();
    }

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    for (const log of logs) {
      const tr = document.createElement("tr");

      for (const col of this.columns) {
        const td = document.createElement("td");
        const value = log[col];

        if (col === "stack" && typeof value === "string") {
          // Create pre element for stack traces
          const pre = document.createElement("pre");
          pre.textContent = value; // textContent automatically escapes
          td.appendChild(pre);
        } else if (col === "timestamp") {
          // Format timestamp nicely
          td.textContent = value ? new Date(value).toLocaleString() : "";
        } else if (typeof value === "object" && value !== null) {
          // Handle objects/arrays
          td.textContent = JSON.stringify(value, null, 2);
          td.style.fontFamily = "monospace";
        } else {
          td.textContent = value ?? "";
        }

        tr.appendChild(td);
      }

      fragment.appendChild(tr);
    }

    // Single DOM append operation
    this.tbody.appendChild(fragment);
  }

  updateHeaders() {
    // Clear and rebuild headers efficiently
    this.theadRow.innerHTML = "";

    // Use DocumentFragment for headers too
    const fragment = document.createDocumentFragment();

    for (const col of this.columns) {
      const th = document.createElement("th");
      th.textContent = col;

      // Add some basic styling for better UX
      if (col === "timestamp") {
        th.style.minWidth = "150px";
      } else if (col === "level") {
        th.style.width = "80px";
      } else if (col === "stack") {
        th.style.width = "300px";
      }

      fragment.appendChild(th);
    }

    this.theadRow.appendChild(fragment);
  }

  updatePaginationInfo(page, totalPages, total) {
    const pageInfo = document.getElementById("pageInfo");
    const pageInput = document.getElementById("pageInput");
    const firstBtn = document.getElementById("firstPage");
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    const lastBtn = document.getElementById("lastPage");

    pageInfo.textContent = `Page ${page} of ${totalPages} (${total} total logs)`;
    pageInput.value = page;
    pageInput.max = totalPages;

    firstBtn.disabled = page <= 1;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages || totalPages === 0;
    lastBtn.disabled = page >= totalPages || totalPages === 0;
  }

  showLoading() {
    const indicator = document.getElementById("loadingIndicator");
    if (indicator) {
      indicator.style.display = "block";
    }
  }

  hideLoading() {
    const indicator = document.getElementById("loadingIndicator");
    if (indicator) {
      indicator.style.display = "none";
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new LogsViewer();
});
