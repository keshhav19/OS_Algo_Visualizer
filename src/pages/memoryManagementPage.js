import { memoryAlgorithms } from "../algorithms/memory/index.js";
import { renderMemoryAllocationTable } from "../components/memoryAllocationTable.js";
import { renderMemorySummary } from "../components/memorySummary.js";
import { renderMemoryVisualization } from "../components/memoryVisualization.js";
import { parsePositiveIntegerList } from "../utils/validation.js";
import { renderPlaybackControls, renderReadyPlaceholder } from "../components/playbackControls.js";
import { renderExplanationCard } from "../components/explanationCard.js";
import { playbackEngine } from "../utils/playbackEngine.js";
import { renderComparisonChart, renderComparisonInsight } from "../components/comparisonView.js";

const defaultState = {
  mode: "visualize",
  comparisonAlgorithms: ["firstFit", "bestFit", "worstFit"],
  comparisonResult: null,
  selectedAlgorithmId: "firstFit",
  blockInput: "100, 500, 200, 300, 600",
  requestInput: "212, 417, 112, 426",
  result: null,
  comparisonResults: [],
  errors: [],
  playback: {
    currentStep: 0,
    totalSteps: 0,
    isPlaying: false,
    speedMs: 1000
  }
};

let state = createInitialState();

function generateMemoryNarrative(result, stepIndex) {
  if (!result || stepIndex === 0) return "Click Play to begin the simulation or Step Forward to advance manually.";
  
  const alloc = result.allocations[stepIndex - 1];
  
  if (alloc.status === "Allocated") {
    let reason = "it was the first block found that was large enough";
    if (result.algorithmId === "bestFit") reason = "it was the smallest block that could satisfy the request";
    if (result.algorithmId === "worstFit") reason = "it was the largest available block";
    
    return `<strong>Step ${stepIndex}: Request ${alloc.requestId} (${alloc.requestSize} KB)</strong>. Allocated to <strong>${alloc.allocatedBlockId}</strong> because ${reason}. Remaining free space in ${alloc.allocatedBlockId}: ${alloc.remainingBlockSize} KB.`;
  } else {
    return `<strong>Step ${stepIndex}: Request ${alloc.requestId} (${alloc.requestSize} KB)</strong>. <span style="color:var(--danger)">Unallocated.</span> No single contiguous block was large enough to satisfy this request.`;
  }
}


export function renderMemoryManagementPage() {
  const selectedAlgorithm = memoryAlgorithms[state.selectedAlgorithmId];
  const showMetrics = state.playback.currentStep >= state.playback.totalSteps && state.result;

  return `
    <section class="page-grid memory-page">
      <div class="panel input-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Functional Module</p>
            <h2>Memory Management</h2>
          </div>
          <button class="secondary-button" type="button" data-action="memory-reset">Reset</button>
        </div>

        <div class="mode-tabs">
          <button class="mode-tab ${state.mode === 'visualize' ? 'active' : ''}" type="button" data-action="memory-switch-mode" data-mode="visualize">Visualize</button>
          <button class="mode-tab ${state.mode === 'compare' ? 'active' : ''}" type="button" data-action="memory-switch-mode" data-mode="compare">Compare</button>
        </div>

        ${state.mode === 'visualize' ? `
          <div class="field-group">
            <label class="field-label" for="memoryAlgorithm">Memory Allocation Algorithm</label>
            <select id="memoryAlgorithm" class="select-control" data-action="memory-select-algorithm">
              ${Object.values(memoryAlgorithms).map((algorithm) => `
                <option value="${algorithm.id}" ${algorithm.id === selectedAlgorithm.id ? "selected" : ""}>
                  ${algorithm.name}
                </option>
              `).join("")}
            </select>
          </div>
          ${renderExplanationCard(selectedAlgorithm.id, "memory")}
        ` : `
          <div class="field-group">
            <label class="field-label">Algorithms to Compare</label>
            <div class="comparison-algo-list">
              ${Object.values(memoryAlgorithms).map(alg => `
                <label class="comparison-algo-checkbox">
                  <input type="checkbox" data-action="memory-toggle-algo" value="${alg.id}" ${state.comparisonAlgorithms.includes(alg.id) ? 'checked' : ''}>
                  ${alg.name}
                </label>
              `).join("")}
            </div>
            <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">Comparison uses the exact same memory blocks and requests for all selected algorithms.</p>
          </div>
        `}

        <div class="field-group" style="margin-top: 16px;">
          <label class="field-label" for="memoryBlocks">Memory Blocks (KB)</label>
          <p class="field-description">Enter block sizes separated by commas.</p>
          <textarea id="memoryBlocks" class="text-control" data-action="memory-input-blocks" rows="2" placeholder="e.g., 100, 500, 200, 300, 600">${escapeHtml(state.blockInput)}</textarea>
        </div>

        <div class="field-group">
          <label class="field-label" for="memoryRequests">Process Requests (KB)</label>
          <p class="field-description">Enter process sizes separated by commas.</p>
          <textarea id="memoryRequests" class="text-control" data-action="memory-input-requests" rows="2" placeholder="e.g., 212, 417, 112, 426">${escapeHtml(state.requestInput)}</textarea>
        </div>

        ${state.errors.length > 0 ? `
          <div class="error-box" role="alert">
            <strong>Check the input</strong>
            <ul>${state.errors.map(e => `<li>${e}</li>`).join("")}</ul>
          </div>
        ` : ""}

        <div class="action-row">
          ${state.mode === 'visualize' ? `
            <button class="primary-button" type="button" data-action="memory-run">Run Simulation</button>
          ` : `
            <button class="primary-button" type="button" data-action="memory-run-comparison" ${state.comparisonAlgorithms.length < 2 ? 'disabled' : ''}>Run Comparison</button>
          `}
        </div>
      </div>

      <div class="output-stack">
        ${state.mode === 'visualize' ? renderVisualizeOutput(showMetrics) : renderCompareOutput()}
      </div>
    </section>
  `;
}

function renderVisualizeOutput(showMetrics) {
  return `
    ${state.result ? `
      <section class="panel">
        <div class="panel-header" style="margin-bottom: 0">
          <div>
            <p class="eyebrow">Visualization Arena</p>
            <h2>Memory Allocation</h2>
          </div>
        </div>
        ${renderMemoryVisualization(state.result, state.playback.currentStep)}
        <div class="narrative-box" style="margin-top: 24px">
          ${generateMemoryNarrative(state.result, state.playback.currentStep)}
        </div>
        ${renderPlaybackControls(state.playback)}
      </section>
    ` : `
      ${renderReadyPlaceholder("Memory Management", "memory")}
    `}

    ${showMetrics ? `
      <section class="panel" style="animation: fadeIn 0.5s;">
        <div class="panel-header">
          <div><p class="eyebrow">Calculated Output</p><h2>Allocation Metrics</h2></div>
        </div>
        ${renderMemorySummary(state.result.summary)}
        ${renderMemoryAllocationTable(state.result)}
      </section>
    ` : ""}
  `;
}

function renderCompareOutput() {
  if (!state.comparisonResult) {
    return renderReadyPlaceholder("Comparison", "comparison");
  }

  const results = state.comparisonResult;
  
  // Find best (most allocated requests, then most remaining memory)
  let bestValue = -1;
  results.forEach(r => {
    if (r.summary.allocatedRequests > bestValue) bestValue = r.summary.allocatedRequests;
  });
  
  const bestAlgs = results.filter(r => r.summary.allocatedRequests === bestValue).map(r => r.algorithmName);
  const isTie = bestAlgs.length > 1;

  const chartData = results.map(r => ({
    algorithmName: r.algorithmName,
    allocated: r.summary.allocatedRequests
  }));

  const tableRows = results.map(r => `
    <tr>
      <td><strong>${r.algorithmName}</strong></td>
      <td>${r.summary.allocatedRequests}</td>
      <td>${r.summary.unallocatedRequests}</td>
      <td>${r.summary.remainingMemory} KB</td>
    </tr>
  `).join("");

  return `
    <section class="panel" style="animation: fadeIn 0.5s;">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Comparison Results</p>
          <h2>Algorithm Performance</h2>
        </div>
      </div>
      
      <table class="metrics-table">
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Allocated Requests</th>
            <th>Unallocated Requests</th>
            <th>Remaining Memory</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      ${renderComparisonChart("Allocated Requests", chartData, "allocated", "reqs", "success")}
      ${renderComparisonInsight(bestAlgs, "allocated requests", bestValue, isTie, "requests")}
    </section>
  `;
}

export function handleMemoryManagementAction(event, rerender) {
  const action = event.target.dataset.action;
  if (!action) return;

  if (action === "memory-switch-mode") {
    playbackEngine.cleanup();
    state.mode = event.target.dataset.mode;
    state.result = null;
    state.comparisonResult = null;
    state.comparisonResults = [];
    resetPlayback();
    rerender();
    return;
  }

  if (action === "memory-toggle-algo") {
    const val = event.target.value;
    if (event.target.checked) {
      if (!state.comparisonAlgorithms.includes(val)) state.comparisonAlgorithms.push(val);
    } else {
      state.comparisonAlgorithms = state.comparisonAlgorithms.filter(a => a !== val);
    }
    state.comparisonResult = null;
    rerender();
    return;
  }

  if (action === "memory-run-comparison") {
    playbackEngine.cleanup();
    runComparison();
    rerender();
    return;
  }

  if (action.startsWith("playback-")) {
    if (action === "playback-play" || action === "playback-toggle") playbackEngine.toggle(state, rerender);
    if (action === "playback-pause") playbackEngine.pause(state, rerender);
    if (action === "playback-next") playbackEngine.next(state, rerender);
    if (action === "playback-prev") playbackEngine.prev(state, rerender);
    if (action === "playback-reset") playbackEngine.reset(state, rerender);
    if (action === "playback-skip") playbackEngine.skipToEnd(state, rerender);
    if (action === "playback-speed") playbackEngine.setSpeed(state, Number(event.target.value), rerender);
    return;
  }

  if (action === "memory-select-algorithm") {
    playbackEngine.cleanup();
    state.selectedAlgorithmId = event.target.value;
    state.result = null;
    resetPlayback();
    state.errors = [];
    rerender();
    return;
  }

  if (action === "memory-input-blocks") {
    playbackEngine.cleanup();
    state.blockInput = event.target.value;
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    resetPlayback();
    rerender();
    return;
  }

  if (action === "memory-input-requests") {
    playbackEngine.cleanup();
    state.requestInput = event.target.value;
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    resetPlayback();
    rerender();
    return;
  }

  if (action === "memory-run") {
    playbackEngine.cleanup();
    runSelectedAlgorithm();
    rerender();
    return;
  }

  if (action === "memory-compare") {
    playbackEngine.cleanup();
    runComparison();
    rerender();
    return;
  }

  if (action === "memory-reset") {
    playbackEngine.cleanup();
    state = createInitialState();
    rerender();
  }
}

function runSelectedAlgorithm() {
  const parsedInput = parseMemoryInputs();
  state.errors = parsedInput.errors;
  state.comparisonResults = [];

  if (state.errors.length > 0) {
    state.result = null; state.comparisonResult = null;
    return;
  }

  const algorithm = memoryAlgorithms[state.selectedAlgorithmId];
  state.result = algorithm.run(parsedInput.blocks, parsedInput.requests);
  state.playback.totalSteps = state.result.allocations.length;
  state.playback.currentStep = 0;
  state.playback.isPlaying = false;
}

function runComparison() {
  const parsedInput = parseMemoryInputs();
  state.errors = parsedInput.errors;

  if (state.errors.length > 0) {
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    return;
  }

  state.comparisonResult = state.comparisonAlgorithms.map((algorithmId) => {
    const algorithm = memoryAlgorithms[algorithmId];
    const result = algorithm.run([...parsedInput.blocks], [...parsedInput.requests]);
    return { algorithmId: algorithm.id, algorithmName: algorithm.name, ...result };
  });
  state.comparisonResults = [...state.comparisonResult];
  state.result = null;
  resetPlayback();
}

function parseMemoryInputs() {
  syncCurrentInputValues();
  const blocksResult = parsePositiveIntegerList(state.blockInput, "Memory Blocks");
  const requestsResult = parsePositiveIntegerList(state.requestInput, "Memory Requests");

  return {
    blocks: blocksResult.values,
    requests: requestsResult.values,
    errors: [...blocksResult.errors, ...requestsResult.errors]
  };
}

function syncCurrentInputValues() {
  if (typeof document === "undefined") return;
  const blocksEl = document.querySelector("#memoryBlocks");
  const requestsEl = document.querySelector("#memoryRequests");
  if (blocksEl) state.blockInput = blocksEl.value;
  if (requestsEl) state.requestInput = requestsEl.value;
}

function createInitialState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function resetPlayback() {
  state.playback.currentStep = 0;
  state.playback.totalSteps = 0;
  state.playback.isPlaying = false;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
