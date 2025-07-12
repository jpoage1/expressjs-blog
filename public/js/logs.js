const form = document.getElementById("filterForm");
const theadRow = document.getElementById("logsTableHeaderRow");
const tbody = document.querySelector("#logsTable tbody");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  theadRow.innerHTML = "";
  tbody.innerHTML = "";
  const params = new URLSearchParams(new FormData(form));

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
    const logs = await res.json();

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="1">No logs found</td></tr>';
      return;
    }

    const columnSet = new Set();
    for (const log of logs) {
      Object.keys(log).forEach((key) => columnSet.add(key));
    }
    const columns = Array.from(columnSet);

    for (const col of columns) {
      const th = document.createElement("th");
      th.textContent = col;
      theadRow.appendChild(th);
    }

    for (const log of logs) {
      const tr = document.createElement("tr");
      for (const col of columns) {
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
      tbody.appendChild(tr);
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="1">Error loading logs: ${error.message}</td></tr>`;
  }
});
