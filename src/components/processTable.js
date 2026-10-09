export function renderProcessTable(processes, options = {}) {
  const priorityColumn = options.showPriority ? `
    <th scope="col">Priority</th>
  ` : "";

  const queueColumn = options.showQueueAssignment ? `
    <th scope="col">Queue</th>
  ` : "";

  const rows = processes.map((process, index) => {
    let queueOptions = "";
    if (options.showQueueAssignment && options.queueConfigs) {
      queueOptions = options.queueConfigs.map(q => 
        `<option value="${q.id}" ${process.queueId == q.id ? "selected" : ""}>Queue ${q.id}</option>`
      ).join("");
    }

    return `
    <tr>
      <td>
        <input class="table-input" data-action="update-process" data-field="pid" data-index="${index}" value="${escapeHtml(process.pid)}" aria-label="Process ID for row ${index + 1}">
      </td>
      <td>
        <input class="table-input" data-action="update-process" data-field="arrivalTime" data-index="${index}" type="number" min="0" step="1" value="${process.arrivalTime}" aria-label="Arrival time for ${escapeHtml(process.pid)}">
      </td>
      <td>
        <input class="table-input" data-action="update-process" data-field="burstTime" data-index="${index}" type="number" min="1" step="1" value="${process.burstTime}" aria-label="Burst time for ${escapeHtml(process.pid)}">
      </td>
      ${options.showPriority ? `
        <td>
          <input class="table-input" data-action="update-process" data-field="priority" data-index="${index}" type="number" step="1" value="${process.priority}" aria-label="Priority for ${escapeHtml(process.pid)}">
        </td>
      ` : ""}
      ${options.showQueueAssignment ? `
        <td>
          <select class="table-input" data-action="update-process" data-field="queueId" data-index="${index}" aria-label="Queue for ${escapeHtml(process.pid)}">
            ${queueOptions}
          </select>
        </td>
      ` : ""}
      <td class="row-actions">
        <button class="icon-button danger" type="button" data-action="remove-process" data-index="${index}" aria-label="Remove ${escapeHtml(process.pid)}">x</button>
      </td>
    </tr>
  `}).join("");

  return `
    <div class="table-wrapper">
      <table class="process-table">
        <thead>
          <tr>
            <th scope="col">Process ID</th>
            <th scope="col">Arrival Time (ms)</th>
            <th scope="col">Burst Time (ms)</th>
            ${priorityColumn}
            ${queueColumn}
            <th scope="col">Remove</th>
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
