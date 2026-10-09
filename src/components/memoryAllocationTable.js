export function renderMemoryAllocationTable(result) {
  if (!result) {
    return `<p class="empty-state">Run an allocation to view the result table.</p>`;
  }

  const rows = result.allocations.map((allocation) => `
    <tr>
      <th scope="row">${allocation.requestId}</th>
      <td>${allocation.requestSize}</td>
      <td>${allocation.allocatedBlockId}</td>
      <td>${allocation.originalBlockSize}</td>
      <td>${allocation.remainingBlockSize}</td>
      <td>
        <span class="status-badge ${allocation.status === "Allocated" ? "allocated" : "unallocated"}">
          ${allocation.status}
        </span>
      </td>
    </tr>
  `).join("");

  return `
    <div class="table-wrapper">
      <table class="metrics-table">
        <thead>
          <tr>
            <th scope="col">Request ID</th>
            <th scope="col">Request Size (KB)</th>
            <th scope="col">Allocated Block</th>
            <th scope="col">Original Block Size (KB)</th>
            <th scope="col">Remaining Block Size (KB)</th>
            <th scope="col">Allocation Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
