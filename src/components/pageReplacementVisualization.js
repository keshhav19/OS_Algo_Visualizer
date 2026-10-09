export function renderPageReplacementVisualization(result, currentStep) {
  if (!result) {
    return `<p class="empty-state">Frame visualization will appear after a simulation.</p>`;
  }

  const columns = result.steps.map((step, idx) => {
    // Determine visibility based on currentStep
    const isFuture = idx >= currentStep;
    const isActive = idx === currentStep - 1;
    
    let stepClass = step.result === "Hit" ? "hit" : "fault";
    if (isFuture) stepClass += " future";
    if (isActive) stepClass += " highlight-active";

    return `
      <div class="page-step-card ${stepClass}">
        <div class="page-step-header">
          <span>Step ${step.step}</span>
          <strong>${step.page}</strong>
        </div>
        <div class="page-frame-stack">
          ${step.frames.map((page, index) => renderFrameCell(page, index, step, isFuture, isActive)).join("")}
        </div>
        <div class="page-step-result">
          <span>${step.result}</span>
          ${step.replacedPage === null ? "" : `<small>Replaced ${step.replacedPage}</small>`}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="page-legend" aria-label="Visualization legend">
      <span><i class="legend-hit"></i>Hit</span>
      <span><i class="legend-fault"></i>Fault</span>
      <span><i class="legend-loaded"></i>Newly loaded</span>
    </div>
    <div class="page-visual-scroll" aria-label="Frame state after every reference">
      <div class="page-visualization">${columns}</div>
    </div>
  `;
}

function renderFrameCell(page, index, step, isFuture, isActive) {
  const isChangedFrame = step.changedFrameIndex === index;
  const classes = [
    "page-frame-cell",
    page === null ? "empty" : "",
    isChangedFrame ? "newly-loaded" : "",
    step.result === "Hit" && page === step.page ? "hit-page" : ""
  ].filter(Boolean).join(" ");

  return `
    <div class="${classes}">
      <span>F${index + 1}</span>
      <strong>${page === null ? "-" : page}</strong>
    </div>
  `;
}
