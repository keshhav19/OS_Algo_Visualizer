export function renderGanttChart(ganttChart, currentStep = null) {
  if (!ganttChart || ganttChart.length === 0) {
    return `<p class="empty-state">Gantt chart will appear after running the simulation.</p>`;
  }

  const totalTime = ganttChart[ganttChart.length - 1].end;

  const chartSegments = ganttChart.map((segment, idx) => {
    const isFuture = currentStep !== null && idx >= currentStep;
    const isActive = currentStep !== null && idx === currentStep - 1;

    const segmentType = getSegmentType(segment);
    let segmentClass = `gantt-segment ${segmentType} ${getProcessClass(segment.pid)}`;
    if (isFuture) segmentClass += " future";
    if (isActive) segmentClass += " highlight-active";

    const duration = segment.end - segment.start;
    const widthPercentage = totalTime > 0 ? (duration / totalTime) * 100 : 100;

    const label = escapeHtml(segment.pid);

    return `
      <div class="${segmentClass}" style="flex-basis: ${widthPercentage}%;" title="${label}: ${segment.start} to ${segment.end}ms">
        <span class="gantt-label">${label}</span>
        <span class="gantt-duration">${duration}ms</span>
      </div>
    `;
  }).join("");

  const timeMarkers = [0, ...ganttChart.map(s => s.end)];
  const uniqueMarkers = [...new Set(timeMarkers)];

  const axisMarkers = uniqueMarkers.map((time) => {
    const leftPercentage = (time / totalTime) * 100;
    return `
      <div class="time-marker" style="left: ${leftPercentage}%;">
        <span>${time}</span>
      </div>
    `;
  }).join("");

  return `
    <div class="gantt-scroll" aria-label="Gantt chart visualization">
      <div class="gantt-chart">
        ${chartSegments}
      </div>
      <div class="time-axis" aria-hidden="true">
        ${axisMarkers}
      </div>
    </div>
  `;
}

function getSegmentType(segment) {
  if (segment.isIdle || segment.pid === "Idle") return "idle";
  if (segment.isContextSwitch || segment.pid === "CS") return "context-switch";
  return "execution";
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getProcessClass(pid) {
  const match = String(pid).match(/\d+/);
  if (!match) return "";
  return `process-color-${(Number(match[0]) - 1) % 8}`;
}
