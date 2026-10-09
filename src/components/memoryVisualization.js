export function renderMemoryVisualization(result, currentStep) {
  if (!result) {
    return `<p class="empty-state">Memory block visualization will appear after a simulation.</p>`;
  }

  // Determine current block states by replaying up to currentStep
  const blocksAtStep = result.blocks.map(b => ({ ...b, allocations: [], remainingSize: b.originalSize }));
  const unallocatedAtStep = [];

  for (let i = 0; i < currentStep; i++) {
    const alloc = result.allocations[i];
    if (alloc.status === "Allocated") {
      const block = blocksAtStep.find(b => b.id === alloc.allocatedBlockId);
      if (block) {
        block.allocations.push(alloc);
        block.remainingSize -= alloc.requestSize;
      }
    } else {
      unallocatedAtStep.push(alloc);
    }
  }

  const blocks = blocksAtStep.map((block) => {
    // Check if this block was modified in the active step
    const activeAlloc = currentStep > 0 ? result.allocations[currentStep - 1] : null;
    const isActiveBlock = activeAlloc && activeAlloc.status === "Allocated" && activeAlloc.allocatedBlockId === block.id;

    const allocatedSegments = block.allocations.map((allocation, index) => {
      const width = (allocation.requestSize / block.originalSize) * 100;
      const isNewest = isActiveBlock && allocation.requestId === activeAlloc.requestId;
      const highlightClass = isNewest ? "highlight-active" : "";
      return `
        <div
          class="memory-segment allocated segment-${index % 4} ${highlightClass}"
          style="flex-basis: ${width}%;"
          title="${allocation.requestId}: ${allocation.requestSize} KB"
        >
          <strong>${allocation.requestId}</strong>
          <span>${allocation.requestSize} KB</span>
        </div>
      `;
    }).join("");
    const freeWidth = (block.remainingSize / block.originalSize) * 100;
    const freeSegment = block.remainingSize > 0 ? `
      <div class="memory-segment free" style="flex-basis: ${freeWidth}%;" title="Free: ${block.remainingSize} KB">
        <strong>Free</strong>
        <span>${block.remainingSize} KB</span>
      </div>
    ` : "";

    return `
      <div class="memory-block-row ${isActiveBlock ? 'highlight-active' : ''}" style="${isActiveBlock ? 'padding: 4px; border-radius: 4px;' : ''}">
        <div class="memory-block-label">
          <strong>${block.id}</strong>
          <span>${block.originalSize} KB</span>
        </div>
        <div class="memory-block-bar" aria-label="${block.id} memory layout">
          ${allocatedSegments}${freeSegment}
        </div>
      </div>
    `;
  }).join("");

  const unallocated = unallocatedAtStep.length > 0 ? `
    <div class="unallocated-list">
      <strong>Unallocated Requests</strong>
      <span>${unallocatedAtStep.map((request) => `${request.requestId} (${request.requestSize} KB)`).join(", ")}</span>
    </div>
  ` : "";

  return `
    <div class="memory-visualization">
      ${blocks}
      ${unallocated}
    </div>
  `;
}
