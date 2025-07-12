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

    this.setupEventListeners();
    this.setupPaginationControls();
  }

  setupEventListeners() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.resetAndLoad();
    });

    // Continuous scrolling
    window.addEventListener("scroll", () => {
      if (this.isNearBottom() && !this.isLoading && this.hasMore) {
        this.loadNextPage();
      }
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
    this.currentPage = 1;
    this.hasMore = true;
    this.theadRow.innerHTML = "";
    this.tbody.innerHTML = "";
    this.columns = [];
    this.currentFilters = new URLSearchParams(new FormData(this.form));
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
      this.currentPage = page;
      this.theadRow.innerHTML = "";
      this.tbody.innerHTML = "";
      this.columns = [];
      await this.loadLogs(false);
    }
  }

  async loadLogs(append = false) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

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

    // Build column set
    const columnSet = new Set(this.columns);
    for (const log of logs) {
      Object.keys(log).forEach((key) => columnSet.add(key));
    }

    const newColumns = Array.from(columnSet);

    // Update headers if new columns or not appending
    if (!append || newColumns.length > this.columns.length) {
      this.columns = newColumns;
      this.theadRow.innerHTML = "";
      for (const col of this.columns) {
        const th = document.createElement("th");
        th.textContent = col;
        this.theadRow.appendChild(th);
      }
    }

    // Add rows
    for (const log of logs) {
      const tr = document.createElement("tr");
      for (const col of this.columns) {
        const td = document.createElement("td");
        const value = log[col];
        if (col === "stack" && typeof value === "string") {
          td.innerHTML = `<pre>${value
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</pre>`;
        } else {
          td.textContent = value ?? "";
        }
        tr.appendChild(td);
      }
      this.tbody.appendChild(tr);
    }
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
    nextBtn.disabled = page >= totalPages;
    lastBtn.disabled = page >= totalPages;
  }

  showLoading() {
    document.getElementById("loadingIndicator").style.display = "block";
  }

  hideLoading() {
    document.getElementById("loadingIndicator").style.display = "none";
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new LogsViewer();
});
