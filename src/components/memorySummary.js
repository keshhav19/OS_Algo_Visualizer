export function renderMemorySummary(summary) {
  if (!summary) {
    return "";
  }

  const items = [
    ["Total Memory", `${summary.totalMemory} KB`],
    ["Total Requested Memory", `${summary.totalRequestedMemory} KB`],
    ["Total Allocated Memory", `${summary.totalAllocatedMemory} KB`],
    ["Allocated Requests", summary.allocatedRequests],
    ["Unallocated Requests", summary.unallocatedRequests],
    ["Remaining Memory", `${summary.remainingMemory} KB`]
  ];

  return `
    <div class="summary-grid">
      ${items.map(([label, value]) => `
        <div>
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `).join("")}
    </div>
  `;
}
