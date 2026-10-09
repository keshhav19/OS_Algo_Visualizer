import { diskSchedulingAlgorithms } from "../algorithms/diskScheduling/index.js";
import { isPositiveInteger, isNonNegativeInteger, parseNonNegativeIntegerSequence } from "../utils/validation.js";
import { renderPlaybackControls, renderReadyPlaceholder } from "../components/playbackControls.js";
import { renderExplanationCard } from "../components/explanationCard.js";
import { playbackEngine } from "../utils/playbackEngine.js";
import { renderComparisonChart, renderComparisonInsight } from "../components/comparisonView.js";

const defaultState = {
  mode: "visualize",
  comparisonAlgorithms: ["fcfs", "sstf", "scan", "cscan", "look", "clook"],
  comparisonResult: null,
  selectedAlgorithmId: "fcfs",
  diskSize: 200,
  headPosition: 53,
  direction: "right",
  requestInput: "98, 183, 37, 122, 14, 124, 65, 67",
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

function generateDiskNarrative(result, stepIndex) {
  if (!result || stepIndex === 0) return "Click Play to begin the simulation or Step Forward to advance manually.";
  
  const step = result.steps[stepIndex - 1];
  
  if (step.event === "Circular Jump") {
    return `<strong>Step ${stepIndex}:</strong> Head jumps circularly from cylinder ${step.from} to cylinder ${step.to} (${step.movement} cylinders).`;
  }
  
  if (step.event === "Boundary") {
    return `<strong>Step ${stepIndex}:</strong> Head reached the physical boundary at cylinder ${step.to}. Reversing direction.`;
  }

  let reason = "";
  const algoId = result.algorithmId;
  if (algoId === "fcfs") reason = "it was the next request in the queue";
  else if (algoId === "sstf") reason = `it is closest to the current head position at cylinder ${step.from}`;
  else if (algoId === "scan" || algoId === "cscan") reason = `it is the next request in the current scan direction`;
  else if (algoId === "look" || algoId === "clook") reason = `it is the next request in the current direction`;

  return `<strong>Step ${stepIndex}:</strong> Request ${step.to} is selected because ${reason}. Head moved from ${step.from} to ${step.to} (${step.movement} cylinders).`;
}
  
export function renderDiskSchedulingPage() {
  const selectedAlgorithm = diskSchedulingAlgorithms[state.selectedAlgorithmId];
  const showMetrics = state.playback.currentStep >= state.playback.totalSteps && state.result;

  return `
    <section class="page-grid disk-page">
      <div class="panel input-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Functional Module</p>
            <h2>Disk Scheduling</h2>
          </div>
          <button class="secondary-button" type="button" data-action="disk-reset">Reset</button>
        </div>

        <div class="mode-tabs">
          <button class="mode-tab ${state.mode === 'visualize' ? 'active' : ''}" type="button" data-action="disk-switch-mode" data-mode="visualize">Visualize</button>
          <button class="mode-tab ${state.mode === 'compare' ? 'active' : ''}" type="button" data-action="disk-switch-mode" data-mode="compare">Compare</button>
        </div>

        ${state.mode === 'visualize' ? `
          <div class="field-group">
            <label class="field-label" for="diskAlgorithm">Algorithm</label>
            <select id="diskAlgorithm" class="select-control" data-action="disk-select-algorithm">
              ${Object.values(diskSchedulingAlgorithms).map((algorithm) => `
                <option value="${algorithm.id}" ${algorithm.id === selectedAlgorithm.id ? "selected" : ""}>
                  ${algorithm.name}
                </option>
              `).join("")}
            </select>
          </div>
          ${renderExplanationCard(selectedAlgorithm.id, "disk")}
        ` : `
          <div class="field-group">
            <label class="field-label">Algorithms to Compare</label>
            <div class="comparison-algo-list">
              ${Object.values(diskSchedulingAlgorithms).map(alg => `
                <label class="comparison-algo-checkbox">
                  <input type="checkbox" data-action="disk-toggle-algo" value="${alg.id}" ${state.comparisonAlgorithms.includes(alg.id) ? 'checked' : ''}>
                  ${alg.name}
                </label>
              `).join("")}
            </div>
            <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">Comparison uses the exact same disk configuration and request queue for all selected algorithms.</p>
          </div>
        `}

        <div class="dimensions-row" style="margin-top: 16px">
          <div class="field-group">
            <label class="field-label" for="diskSize">Disk Size (Cylinders)</label>
            <input id="diskSize" class="number-control" data-action="disk-input-size" type="number" min="1" step="1" value="${state.diskSize}">
          </div>
          <div class="field-group">
            <label class="field-label" for="initialHead">Initial Head Position</label>
            <input id="initialHead" class="number-control" data-action="disk-input-head" type="number" min="0" step="1" value="${state.headPosition}">
          </div>
        </div>

        <div class="field-group">
          <label class="field-label" for="diskDirection">Initial Direction</label>
          <select id="diskDirection" class="select-control" data-action="disk-input-direction">
            <option value="right" ${state.direction === "right" ? "selected" : ""}>Right (Towards Higher Cylinders)</option>
            <option value="left" ${state.direction === "left" ? "selected" : ""}>Left (Towards Lower Cylinders)</option>
          </select>
          <p class="field-description" style="margin-top:4px;">Direction is only relevant for SCAN, C-SCAN, LOOK, and C-LOOK.</p>
        </div>

        <div class="field-group">
          <label class="field-label" for="diskRequests">Request Queue</label>
          <p class="field-description">Enter cylinder requests separated by commas.</p>
          <textarea id="diskRequests" class="text-control" data-action="disk-input-requests" rows="3" placeholder="e.g., 98, 183, 37, 122, 14, 124, 65, 67">${escapeHtml(state.requestInput)}</textarea>
        </div>

        ${state.errors.length > 0 ? `
          <div class="error-box" role="alert">
            <strong>Check the input</strong>
            <ul>${state.errors.map(e => `<li>${e}</li>`).join("")}</ul>
          </div>
        ` : ""}

        <div class="action-row">
          ${state.mode === 'visualize' ? `
            <button class="primary-button" type="button" data-action="disk-run">Run Simulation</button>
          ` : `
            <button class="primary-button" type="button" data-action="disk-run-comparison" ${state.comparisonAlgorithms.length < 2 ? 'disabled' : ''}>Run Comparison</button>
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
            <h2>Disk Scheduling</h2>
          </div>
        </div>
        ${renderVisualizationSection(state.result, state.playback.currentStep)}
        <div class="narrative-box" style="margin-top: 24px">
          ${generateDiskNarrative(state.result, state.playback.currentStep)}
        </div>
        ${renderPlaybackControls(state.playback)}
      </section>
    ` : `
      ${renderReadyPlaceholder("Disk Scheduling", "disk")}
    `}

    ${showMetrics ? `
      <section class="panel" style="animation: fadeIn 0.5s;">
        <div class="panel-header">
          <div><p class="eyebrow">Metrics</p><h2>Performance Output</h2></div>
        </div>
        ${renderMetricsSection(state.result)}
      </section>
    ` : ""}
  `;
}

function renderCompareOutput() {
  if (!state.comparisonResult) {
    return renderReadyPlaceholder("Comparison", "comparison");
  }

  const results = state.comparisonResult;
  
  // Find best (lowest total head movement)
  let bestValue = Infinity;
  results.forEach(r => {
    if (r.totalMovement < bestValue) bestValue = r.totalMovement;
  });
  
  const bestAlgs = results.filter(r => r.totalMovement === bestValue).map(r => r.algorithmName);
  const isTie = bestAlgs.length > 1;

  const chartData = results.map(r => ({
    algorithmName: r.algorithmName,
    movement: r.totalMovement
  }));

  const tableRows = results.map(r => `
    <tr>
      <td><strong>${r.algorithmName}</strong></td>
      <td>${r.totalMovement}</td>
      <td>${r.averageMovement}</td>
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
            <th>Total Head Movement</th>
            <th>Average Head Movement</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      ${renderComparisonChart("Total Head Movement", chartData, "movement", "cylinders", "danger")}
      ${renderComparisonInsight(bestAlgs, "total head movement", bestValue, isTie, "cylinders")}
    </section>
  `;
}

function renderVisualizationSection(result, currentStep) {
  const visibleSteps = result.steps.slice(0, currentStep);
  const visibleSequence = result.sequence.slice(0, Math.max(1, currentStep + 1));
  const diskMax = Number(state.diskSize) - 1;
  const width = 1000;
  const height = 320;
  const topPadding = 32;
  const rowSpacing = visibleSequence.length > 1 ? (height - 84) / Math.max(1, visibleSequence.length - 1) : 0;

  const points = visibleSequence.map((position, index) => {
    const x = diskMax > 0 ? (Number(position) / diskMax) * width : 0;
    const y = topPadding + index * rowSpacing;
    return { x, y, position };
  });

  const pathData = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const gridMarks = buildDiskGridMarks(diskMax);
  const activePosition = points.at(-1)?.position ?? state.headPosition;
  const activeStep = visibleSteps.at(-1);

  const rows = result.steps.map((step, index) => {
    const rowClass = index === currentStep - 1 ? "highlight-row" : index >= currentStep ? "future" : "";
    const eventClass = step.event.toLowerCase().replaceAll(" ", "-").replaceAll("(", "").replaceAll(")", "");
    return `
      <tr class="${rowClass}">
        <td>${step.step}</td>
        <td>${step.from}</td>
        <td>${step.to}</td>
        <td>${step.movement}</td>
        <td><span class="event-badge ${eventClass}">${step.event}</span></td>
      </tr>
    `;
  }).join("");

  return `
    <div class="disk-viz-container">
      <div class="disk-viz-header">
        <div>
          <span>Track Visualization</span>
          <strong>0 to ${diskMax}</strong>
        </div>
        <div class="disk-viz-legend" aria-label="Disk visualization legend">
          <span><i class="head-path"></i>Head Path</span>
          <span><i class="request-point"></i>Request</span>
        </div>
      </div>
      <div class="disk-graph-scroll">
        <svg class="disk-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="Disk head movement path ending at cylinder ${activePosition}">
          <g class="disk-grid">
            ${gridMarks.map(mark => {
              const x = diskMax > 0 ? (mark / diskMax) * width : 0;
              return `<line x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="0" y2="${height - 34}"></line>`;
            }).join("")}
          </g>
          <g class="disk-labels">
            ${gridMarks.map(mark => {
              const x = diskMax > 0 ? (mark / diskMax) * width : 0;
              return `<text x="${x.toFixed(2)}" y="${height - 8}">${mark}</text>`;
            }).join("")}
          </g>
          ${points.length > 1 ? `<path class="disk-graph-line" d="${pathData}"></path>` : ""}
          <g>
            ${points.map((point, index) => `
              <circle class="${index === points.length - 1 ? "active-head-point" : "disk-point"}" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="${index === points.length - 1 ? 7 : 5}"></circle>
              <text class="disk-point-label" x="${point.x.toFixed(2)}" y="${Math.max(12, point.y - 10).toFixed(2)}">${point.position}</text>
            `).join("")}
          </g>
        </svg>
      </div>
      <div class="disk-step-status">
        ${activeStep ? `
          <strong>${activeStep.event}</strong>
          <span>Head moved from ${activeStep.from} to ${activeStep.to}, covering ${activeStep.movement} cylinders.</span>
        ` : `
          <strong>Ready</strong>
          <span>The head starts at cylinder ${state.headPosition}. Step forward to reveal the path.</span>
        `}
      </div>
      <div class="table-wrapper compact-table">
        <table class="metrics-table">
          <thead>
            <tr>
              <th>Step</th>
              <th>From</th>
              <th>To</th>
              <th>Movement</th>
              <th>Event</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderMetricsSection(result) {
  return `
    <div class="summary-grid disk-summary-grid">
      <div>
        <span>Total Head Movement</span>
        <strong>${result.totalMovement} cylinders</strong>
      </div>
      <div>
        <span>Average Seek Length</span>
        <strong>${result.averageMovement} cylinders/request</strong>
      </div>
      <div>
        <span>Requests Serviced</span>
        <strong>${result.steps.filter((step) => step.event.startsWith("Request") || (result.algorithmId === "clook" && step.event === "Circular Jump")).length}</strong>
      </div>
    </div>
  `;
}

export function handleDiskSchedulingAction(event, rerender) {
  const action = event.target.dataset.action;
  if (!action) return;

  if (action === "disk-switch-mode") {
    playbackEngine.cleanup();
    state.mode = event.target.dataset.mode;
    state.result = null;
    state.comparisonResult = null;
    state.comparisonResults = [];
    resetPlayback();
    rerender();
    return;
  }

  if (action === "disk-toggle-algo") {
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

  if (action === "disk-run-comparison") {
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

  if (action === "disk-select-algorithm") {
    playbackEngine.cleanup();
    state.selectedAlgorithmId = event.target.value;
    state.errors = [];
    state.result = null; state.comparisonResult = null;
    rerender();
    return;
  }

  if (action === "disk-input-size") {
    playbackEngine.cleanup();
    state.diskSize = event.target.value;
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    resetPlayback();
    rerender();
    return;
  }

  if (action === "disk-input-head") {
    playbackEngine.cleanup();
    state.headPosition = event.target.value;
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    resetPlayback();
    rerender();
    return;
  }

  if (action === "disk-input-direction") {
    playbackEngine.cleanup();
    state.direction = event.target.value;
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    resetPlayback();
    rerender();
    return;
  }

  if (action === "disk-input-requests") {
    playbackEngine.cleanup();
    state.requestInput = event.target.value;
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    resetPlayback();
    rerender();
    return;
  }

  if (action === "disk-run") {
    playbackEngine.cleanup();
    runSelectedAlgorithm();
    rerender();
    return;
  }

  if (action === "disk-compare") {
    playbackEngine.cleanup();
    runComparison();
    rerender();
    return;
  }

  if (action === "disk-reset") {
    playbackEngine.cleanup();
    state = createInitialState();
    rerender();
    return;
  }
}

function validateDiskInputs() {
  syncCurrentInputValues();
  const errors = [];
  const diskSize = Number(state.diskSize);
  const headPosition = Number(state.headPosition);

  if (!isPositiveInteger(state.diskSize) || diskSize > 100000) {
    errors.push("Disk Size must be a positive integer no greater than 100000.");
  }

  if (!isNonNegativeInteger(state.headPosition)) {
    errors.push("Initial Head Position must be a non-negative integer.");
  } else if (isPositiveInteger(state.diskSize) && headPosition >= diskSize) {
    errors.push(`Initial Head Position must be less than Disk Size (0 to ${diskSize - 1}).`);
  }

  const parsedRequests = parseNonNegativeIntegerSequence(state.requestInput, "Request Queue");
  const rawItems = parsedRequests.values.map(String);
  const requests = [];
  errors.push(...parsedRequests.errors);
  if (rawItems.length > 200) errors.push("Request Queue must contain no more than 200 requests.");

  if (rawItems.length > 0 && rawItems.length <= 200) {
    rawItems.forEach((item, index) => {
      const num = Number(item);
      if (!isNonNegativeInteger(item)) {
        errors.push(`Request Queue item ${index + 1} must be a non-negative integer.`);
      } else if (isPositiveInteger(state.diskSize) && num >= diskSize) {
        errors.push(`Request Queue item ${index + 1} (${num}) must be less than Disk Size (${diskSize}).`);
      } else {
        requests.push(num);
      }
    });
  }

  return { errors, diskSize, headPosition, requests };
}

function runSelectedAlgorithm() {
  const validated = validateDiskInputs();
  state.errors = validated.errors;
  state.comparisonResults = [];

  if (state.errors.length > 0) {
    state.result = null; state.comparisonResult = null;
    return;
  }

  const algorithm = diskSchedulingAlgorithms[state.selectedAlgorithmId];
  state.result = { algorithmName: algorithm.name, algorithmId: algorithm.id, ...algorithm.run(validated.headPosition, validated.requests, validated.diskSize, state.direction) };
  
  state.playback.totalSteps = state.result.steps.length;
  state.playback.currentStep = 0;
  state.playback.isPlaying = false;
}

function runComparison() {
  const validated = validateDiskInputs();
  state.errors = validated.errors;

  if (state.errors.length > 0) {
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    return;
  }

  state.comparisonResult = state.comparisonAlgorithms.map((algorithmId) => {
    const algorithm = diskSchedulingAlgorithms[algorithmId];
    return {
      algorithmId: algorithm.id,
      algorithmName: algorithm.name,
      ...algorithm.run(validated.headPosition, [...validated.requests], validated.diskSize, state.direction)
    };
  });
  state.comparisonResults = [...state.comparisonResult];
  state.result = null;
  resetPlayback();
}

function syncCurrentInputValues() {
  if (typeof document === "undefined") return;
  const diskSizeEl = document.querySelector("#diskSize");
  const headEl = document.querySelector("#initialHead");
  const requestsEl = document.querySelector("#diskRequests");

  if (diskSizeEl) state.diskSize = diskSizeEl.value;
  if (headEl) state.headPosition = headEl.value;
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

function buildDiskGridMarks(diskMax) {
  const max = Math.max(1, Number(diskMax));
  const marks = new Set([0, max]);
  const interval = max <= 100 ? 25 : max <= 250 ? 50 : 100;

  for (let mark = interval; mark < max; mark += interval) {
    marks.add(mark);
  }

  return [...marks].sort((a, b) => a - b);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
