export function renderPageReplacementStats(statistics) {
  if (!statistics) {
    return "";
  }

  const items = [
    ["Total Page References", statistics.totalReferences],
    ["Page Hits", statistics.pageHits],
    ["Page Faults", statistics.pageFaults],
    ["Hit Ratio", `${(statistics.hitRatio * 100).toFixed(0)}%`],
    ["Page Fault Ratio", `${(statistics.faultRatio * 100).toFixed(0)}%`]
  ];

  return `
    <div class="summary-grid page-stats-grid">
      ${items.map(([label, value]) => `
        <div>
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `).join("")}
    </div>
  `;
}
