export function renderMetricsTable(result, showPriority) {
  if (!result) {
    return `<p class="empty-state">Calculated process metrics will appear here.</p>`;
  }

  const priorityHeader = showPriority ? `<th scope="col">Priority</th>` : "";
  const priorityCells = (process) => showPriority ? `<td>${process.priority}</td>` : "";

  const showQueue = result.metrics.some(p => p.queueId !== undefined || p.queueHistory !== undefined);
  const queueHeader = showQueue ? `<th scope="col">Queue</th>` : "";
  const queueCells = (process) => {
    if (!showQueue) return "";
    const text = process.queueHistory ? process.queueHistory : (process.queueId !== undefined ? `Q${process.queueId}` : "-");
    return `<td><span class="queue-badge">${text}</span></td>`;
  };

  const rows = result.metrics.map((process) => `
    <tr>
      <th scope="row">${escapeHtml(process.pid)}</th>
      <td>${process.arrivalTime}</td>
      <td>${process.burstTime}</td>
      ${priorityCells(process)}
      ${queueCells(process)}
      <td>${process.completionTime}</td>
      <td>${process.turnaroundTime}</td>
      <td>${process.waitingTime}</td>
      <td>${process.responseTime}</td>
    </tr>
  `).join("");

  return `
    <div class="average-grid">
      <div>
        <span>Avg Turnaround Time</span>
        <strong>${result.averages.turnaroundTime} ms</strong>
      </div>
      <div>
        <span>Avg Waiting Time</span>
        <strong>${result.averages.waitingTime} ms</strong>
      </div>
      <div>
        <span>Avg Response Time</span>
        <strong>${result.averages.responseTime} ms</strong>
      </div>
    </div>
    <div class="table-wrapper">
      <table class="metrics-table">
        <thead>
          <tr>
            <th scope="col">PID</th>
            <th scope="col">AT (ms)</th>
            <th scope="col">BT (ms)</th>
            ${priorityHeader}
            ${queueHeader}
            <th scope="col">CT (ms)</th>
            <th scope="col">TAT (ms)</th>
            <th scope="col">WT (ms)</th>
            <th scope="col">RT (ms)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
