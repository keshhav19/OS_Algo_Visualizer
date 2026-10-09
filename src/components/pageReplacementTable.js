export function renderPageReplacementTable(result) {
  if (!result) {
    return `<p class="empty-state">Run a simulation to view the step-by-step table.</p>`;
  }

  const frameHeaders = Array.from({ length: result.frameCount }, (_, index) => (
    `<th scope="col">Frame ${index + 1}</th>`
  )).join("");

  const rows = result.steps.map((step) => `
    <tr>
      <th scope="row">${step.step}</th>
      <td>${step.page}</td>
      ${step.frames.map((page) => `<td>${formatFrame(page)}</td>`).join("")}
      <td>
        <span class="status-badge ${step.result === "Hit" ? "allocated" : "unallocated"}">
          ${step.result}
        </span>
      </td>
      <td>${step.replacedPage ?? "-"}</td>
    </tr>
  `).join("");

  return `
    <div class="table-wrapper">
      <table class="metrics-table page-table">
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col">Page</th>
            ${frameHeaders}
            <th scope="col">Result</th>
            <th scope="col">Replaced Page</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function formatFrame(page) {
  return page === null ? "-" : page;
}
