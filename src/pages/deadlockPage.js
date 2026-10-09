import { runBankersSafetyAlgorithm, simulateResourceRequest, runDeadlockDetection } from "../algorithms/deadlock/index.js";
import { validateBankersInput, validateDetectionInput, validateResourceRequestInput } from "../utils/validation.js";
import { renderPlaybackControls, renderReadyPlaceholder } from "../components/playbackControls.js";
import { renderExplanationCard } from "../components/explanationCard.js";
import { playbackEngine } from "../utils/playbackEngine.js";

const defaultState = {
  activeTab: "bankers",
  bankers: {
    numProcesses: 5,
    numResources: 3,
    allocation: [
      [0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]
    ],
    max: [
      [7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]
    ],
    available: [3, 3, 2],
    requestProcess: 1,
    requestVector: [1, 0, 2],
    result: null,
    requestResult: null,
    errors: [],
    playback: { currentStep: 0, totalSteps: 0, isPlaying: false, speedMs: 1000 }
  },
  detection: {
    numProcesses: 5,
    numResources: 3,
    allocation: [
      [0, 1, 0], [2, 0, 0], [3, 0, 3], [2, 1, 1], [0, 0, 2]
    ],
    request: [
      [0, 0, 0], [2, 0, 2], [0, 0, 0], [1, 0, 0], [0, 0, 2]
    ],
    available: [0, 0, 0],
    result: null,
    errors: [],
    playback: { currentStep: 0, totalSteps: 0, isPlaying: false, speedMs: 1000 }
  }
};

let state = createInitialState();

function generateBankersNarrative(result, stepIndex) {
  if (!result || stepIndex === 0) return "Click Play to begin the safety check visualization.";
  
  const step = result.steps[stepIndex - 1];
  return `<strong>Step ${stepIndex}: Process ${step.process}</strong> can safely complete because its remaining Need (${step.need.join(', ')}) does not exceed the available Work vector (${step.workBefore.join(', ')}). It releases its Allocation, making the new Work vector (${step.workAfter.join(', ')}).`;
}

function generateDetectionNarrative(result, stepIndex) {
  if (!result || stepIndex === 0) return "Click Play to begin the deadlock detection visualization.";
  
  const step = result.steps[stepIndex - 1];
  return `<strong>Step ${stepIndex}: Process ${step.process}</strong> can complete because its Request (${step.request.join(', ')}) does not exceed the available Work vector (${step.workBefore.join(', ')}). It releases its resources, making the new Work vector (${step.workAfter.join(', ')}).`;
}

export function renderDeadlockPage() {
  return `
    <section class="page-grid">
      <div class="panel input-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Functional Module</p>
            <h2>Deadlock Management</h2>
          </div>
          <button class="secondary-button" type="button" data-action="reset">Reset</button>
        </div>

        <div class="mode-tabs">
          <button class="mode-tab ${state.activeTab === 'bankers' ? 'active' : ''}" type="button" data-action="switch-tab" data-tab="bankers">Banker's Algorithm</button>
          <button class="mode-tab ${state.activeTab === 'detection' ? 'active' : ''}" type="button" data-action="switch-tab" data-tab="detection">Deadlock Detection</button>
        </div>
        
        ${renderExplanationCard(state.activeTab, "deadlock")}

        ${state.activeTab === 'bankers' ? renderBankersInput() : renderDetectionInput()}
      </div>

      <div class="output-stack">
        ${state.activeTab === 'bankers' ? renderBankersOutput() : renderDetectionOutput()}
      </div>
    </section>
  `;
}

function renderBankersInput() {
  const s = state.bankers;
  return `
    <div class="dimensions-row" style="margin-top: 24px">
      <div class="field-group">
        <label class="field-label" for="b-processes">Number of Processes</label>
        <input id="b-processes" class="number-control" data-action="update-dimensions" data-target="bankers" data-dim="processes" type="number" min="1" max="10" step="1" value="${s.numProcesses}">
      </div>
      <div class="field-group">
        <label class="field-label" for="b-resources">Number of Resources</label>
        <input id="b-resources" class="number-control" data-action="update-dimensions" data-target="bankers" data-dim="resources" type="number" min="1" max="10" step="1" value="${s.numResources}">
      </div>
    </div>

    ${renderMatrixEditor("Allocation Matrix", "bankers", "allocation", s.allocation)}
    ${renderMatrixEditor("Max Matrix", "bankers", "max", s.max)}
    ${renderVectorEditor("Available Vector", "bankers", "available", s.available)}

    ${renderErrors(s.errors)}

    <div class="action-row">
      <button class="primary-button" type="button" data-action="run-bankers">Run Safety Check</button>
    </div>

    ${s.result && s.playback.currentStep >= s.playback.totalSteps ? `
      <div class="resource-request-section" style="animation: fadeIn 0.5s;">
        <h3>Simulate Resource Request</h3>
        <div class="field-group">
          <label class="field-label">Requesting Process</label>
          <select class="select-control" data-action="update-request-process">
            ${Array.from({ length: s.numProcesses }).map((_, i) => `
              <option value="${i}" ${s.requestProcess === i ? "selected" : ""}>P${i}</option>
            `).join("")}
          </select>
        </div>
        ${renderVectorEditor("Request Vector", "bankers", "requestVector", s.requestVector)}
        <div class="action-row">
          <button class="secondary-button" type="button" data-action="run-request">Test Request</button>
        </div>
      </div>
    ` : ""}
  `;
}

function renderDetectionInput() {
  const s = state.detection;
  return `
    <div class="dimensions-row" style="margin-top: 24px">
      <div class="field-group">
        <label class="field-label" for="d-processes">Number of Processes</label>
        <input id="d-processes" class="number-control" data-action="update-dimensions" data-target="detection" data-dim="processes" type="number" min="1" max="10" step="1" value="${s.numProcesses}">
      </div>
      <div class="field-group">
        <label class="field-label" for="d-resources">Number of Resources</label>
        <input id="d-resources" class="number-control" data-action="update-dimensions" data-target="detection" data-dim="resources" type="number" min="1" max="10" step="1" value="${s.numResources}">
      </div>
    </div>

    ${renderMatrixEditor("Allocation Matrix", "detection", "allocation", s.allocation)}
    ${renderMatrixEditor("Request Matrix", "detection", "request", s.request)}
    ${renderVectorEditor("Available Vector", "detection", "available", s.available)}

    ${renderErrors(s.errors)}

    <div class="action-row">
      <button class="primary-button" type="button" data-action="run-detection">Run Detection</button>
    </div>
  `;
}

function renderBankersOutput() {
  const s = state.bankers;
  if (!s.result) {
    return `
      ${renderReadyPlaceholder("Deadlock Management", "deadlock")}
    `;
  }

  const showMetrics = s.playback.currentStep >= s.playback.totalSteps;
  
  // Build active matrix visualization based on currentStep
  let currentWork = [...s.available];
  let finished = Array(s.numProcesses).fill(false);
  let activeProcessIndex = -1;

  for (let i = 0; i < s.playback.currentStep; i++) {
    const step = s.result.steps[i];
    currentWork = [...step.workAfter];
    const pIndex = parseInt(step.process.substring(1));
    finished[pIndex] = true;
    if (i === s.playback.currentStep - 1) activeProcessIndex = pIndex;
  }

  const needMatrix = s.result.need;

  let visualRows = "";
  for (let i = 0; i < s.numProcesses; i++) {
    let rowClass = "matrix-row";
    if (finished[i]) rowClass += " finished future";
    if (i === activeProcessIndex) rowClass += " highlight-active";

    visualRows += `
      <tr class="${rowClass}">
        <td>P${i}</td>
        <td>${s.allocation[i].join(" ")}</td>
        <td>${s.max[i].join(" ")}</td>
        <td>${needMatrix[i].join(" ")}</td>
        <td>${finished[i] ? '<span class="status-badge success">Finished</span>' : '<span class="status-badge pending">Pending</span>'}</td>
      </tr>
    `;
  }

  return `
    <section class="panel">
      <div class="panel-header" style="margin-bottom: 0">
        <div>
          <p class="eyebrow">Visualization Arena</p>
          <h2>Banker's Algorithm</h2>
        </div>
      </div>
      <div class="deadlock-viz" style="margin-top: 16px;">
        <div class="work-vector-display">
          <strong>Current Work (Available): </strong> <span>${currentWork.join(", ")}</span>
        </div>
        <table class="metrics-table">
          <thead>
            <tr>
              <th>Process</th>
              <th>Allocation</th>
              <th>Max</th>
              <th>Need</th>
              <th>Finished</th>
            </tr>
          </thead>
          <tbody>${visualRows}</tbody>
        </table>
      </div>
      <div class="narrative-box" style="margin-top: 24px">
        ${generateBankersNarrative(s.result, s.playback.currentStep)}
      </div>
      ${renderPlaybackControls(s.playback)}
    </section>
    
    ${showMetrics ? `
      <section class="panel" style="animation: fadeIn 0.5s;">
        <div class="panel-header">
          <div><p class="eyebrow">Result</p><h2>Safety Status</h2></div>
        </div>
        <div class="status-banner ${s.result.isSafe ? 'safe' : 'unsafe'}">
          ${s.result.isSafe ? `
            <strong>System is in a SAFE state</strong>
            <p>Safe Sequence: ${s.result.safeSequence.join(" &rarr; ")}</p>
          ` : `
            <strong>System is in an UNSAFE state</strong>
            <p>A safe sequence could not be found for all processes.</p>
          `}
        </div>
      </section>
    ` : ""}

    ${s.requestResult && showMetrics ? `
      <section class="panel" style="animation: fadeIn 0.5s;">
        <div class="panel-header">
          <div><p class="eyebrow">Result</p><h2>Resource Request Status</h2></div>
        </div>
        <div class="status-banner ${s.requestResult.granted ? 'safe' : 'unsafe'}">
          <strong>${s.requestResult.granted ? "Request Can Be Granted Immediately" : "Request Cannot Be Granted"}</strong>
          <p>${s.requestResult.reason || (s.requestResult.granted ? `Safe sequence with requested resources: ${s.requestResult.safetyResult.safeSequence.join(" &rarr; ")}` : "")}</p>
        </div>
      </section>
    ` : ""}
  `;
}

function renderDetectionOutput() {
  const s = state.detection;
  if (!s.result) {
    return `
      ${renderReadyPlaceholder("Deadlock Detection", "deadlock")}
    `;
  }

  const showMetrics = s.playback.currentStep >= s.playback.totalSteps;
  const currentStepData = s.result.steps[s.playback.currentStep] || s.result.steps[s.result.steps.length - 1];
  const finished = currentStepData.finished;
  const currentWork = currentStepData.work;
  const activeProcessIndex = currentStepData.processIndex;

  let visualRows = "";
  for (let i = 0; i < s.numProcesses; i++) {
    let rowClass = "matrix-row";
    if (finished[i]) rowClass += " finished future";
    if (i === activeProcessIndex) rowClass += " highlight-active";
    if (showMetrics && !finished[i]) rowClass += " deadlocked-row"; // highlight deadlocked at end

    visualRows += `
      <tr class="${rowClass}">
        <td>P${i}</td>
        <td>${s.allocation[i].join(" ")}</td>
        <td>${s.request[i].join(" ")}</td>
        <td>${finished[i] ? '<span class="status-badge success">Finished</span>' : '<span class="status-badge pending">Pending</span>'}</td>
      </tr>
    `;
  }

  return `
    <section class="panel">
      <div class="panel-header" style="margin-bottom: 0">
        <div>
          <p class="eyebrow">Visualization Arena</p>
          <h2>Deadlock Detection</h2>
        </div>
      </div>
      <div class="deadlock-viz" style="margin-top: 16px;">
        <div class="work-vector-display">
          <strong>Current Work (Available): </strong> <span>${currentWork.join(", ")}</span>
        </div>
        <table class="metrics-table">
          <thead>
            <tr>
              <th>Process</th>
              <th>Allocation</th>
              <th>Request</th>
              <th>Finished</th>
            </tr>
          </thead>
          <tbody>${visualRows}</tbody>
        </table>
      </div>
      <div class="narrative-box" style="margin-top: 24px">
        ${generateDetectionNarrative(s.result, s.playback.currentStep)}
      </div>
      ${renderPlaybackControls(s.playback)}
    </section>
    
    ${showMetrics ? `
      <section class="panel" style="animation: fadeIn 0.5s;">
        <div class="panel-header">
          <div><p class="eyebrow">Result</p><h2>Detection Status</h2></div>
        </div>
        <div class="status-banner ${s.result.hasDeadlock ? 'unsafe' : 'safe'}">
          ${s.result.hasDeadlock ? `
            <strong>Deadlock Detected</strong>
            <p>Deadlocked Processes: ${s.result.deadlockedProcesses.join(", ")}</p>
          ` : `
            <strong>No Deadlock Detected</strong>
            <p>All processes can complete successfully.</p>
          `}
        </div>
      </section>
    ` : ""}
  `;
}

function renderMatrixEditor(title, target, name, matrix) {
  return `
    <div class="matrix-section">
      <h3>${title}</h3>
      <div class="matrix-grid" style="grid-template-columns: auto repeat(${matrix[0].length}, 1fr)">
        <div class="matrix-header"></div>
        ${Array.from({ length: matrix[0].length }).map((_, i) => `<div class="matrix-header">R${i}</div>`).join("")}
        ${matrix.map((row, i) => `
          <div class="matrix-row-label">P${i}</div>
          ${row.map((val, j) => `
            <input type="number" class="matrix-input" min="0" step="1" value="${val}" data-action="update-matrix" data-target="${target}" data-name="${name}" data-row="${i}" data-col="${j}">
          `).join("")}
        `).join("")}
      </div>
    </div>
  `;
}

function renderVectorEditor(title, target, name, vector) {
  return `
    <div class="matrix-section">
      <h3>${title}</h3>
      <div class="matrix-grid vector-grid" style="grid-template-columns: repeat(${vector.length}, 1fr)">
        ${Array.from({ length: vector.length }).map((_, i) => `<div class="matrix-header">R${i}</div>`).join("")}
        ${vector.map((val, i) => `
          <input type="number" class="matrix-input" min="0" step="1" value="${val}" data-action="update-vector" data-target="${target}" data-name="${name}" data-idx="${i}">
        `).join("")}
      </div>
    </div>
  `;
}

function renderErrors(errors) {
  if (!errors || errors.length === 0) return "";
  return `
    <div class="error-box" role="alert">
      <strong>Check the input</strong>
      <ul>
        ${errors.map(e => `<li>${e}</li>`).join("")}
      </ul>
    </div>
  `;
}

export function handleDeadlockAction(event, rerender) {
  const action = event.target.dataset.action;
  if (!action) return;

  if (action.startsWith("playback-")) {
    const s = state[state.activeTab];
    if (action === "playback-play" || action === "playback-toggle") playbackEngine.toggle(s, rerender);
    if (action === "playback-pause") playbackEngine.pause(s, rerender);
    if (action === "playback-next") playbackEngine.next(s, rerender);
    if (action === "playback-prev") playbackEngine.prev(s, rerender);
    if (action === "playback-reset") playbackEngine.reset(s, rerender);
    if (action === "playback-skip") playbackEngine.skipToEnd(s, rerender);
    if (action === "playback-speed") playbackEngine.setSpeed(s, Number(event.target.value), rerender);
    return;
  }

  if (action === "switch-tab") {
    playbackEngine.cleanup();
    state.activeTab = event.target.dataset.tab;
    rerender();
    return;
  }

  if (action === "reset") {
    playbackEngine.cleanup();
    state = createInitialState();
    rerender();
    return;
  }

  if (action === "update-dimensions") {
    playbackEngine.cleanup();
    const target = event.target.dataset.target;
    const dim = event.target.dataset.dim;
    let val = parseInt(event.target.value, 10);
    
    if (isNaN(val) || val < 1) val = 1;
    if (val > 10) val = 10;

    const s = state[target];
    
    if (dim === "processes") {
      const diff = val - s.numProcesses;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          s.allocation.push(Array(s.numResources).fill(0));
          if (target === 'bankers') s.max.push(Array(s.numResources).fill(0));
          if (target === 'detection') s.request.push(Array(s.numResources).fill(0));
        }
      } else if (diff < 0) {
        s.allocation.length = val;
        if (target === 'bankers') s.max.length = val;
        if (target === 'detection') s.request.length = val;
        if (target === 'bankers' && s.requestProcess >= val) s.requestProcess = 0;
      }
      s.numProcesses = val;
    } else if (dim === "resources") {
      const diff = val - s.numResources;
      if (diff > 0) {
        for (let i = 0; i < s.numProcesses; i++) {
          s.allocation[i].push(...Array(diff).fill(0));
          if (target === 'bankers') s.max[i].push(...Array(diff).fill(0));
          if (target === 'detection') s.request[i].push(...Array(diff).fill(0));
        }
        s.available.push(...Array(diff).fill(0));
        if (target === 'bankers') s.requestVector.push(...Array(diff).fill(0));
      } else if (diff < 0) {
        for (let i = 0; i < s.numProcesses; i++) {
          s.allocation[i].length = val;
          if (target === 'bankers') s.max[i].length = val;
          if (target === 'detection') s.request[i].length = val;
        }
        s.available.length = val;
        if (target === 'bankers') s.requestVector.length = val;
      }
      s.numResources = val;
    }
    
    s.result = null;
    s.requestResult = null;
    resetNestedPlayback(s);
    s.errors = [];
    rerender();
    return;
  }

  if (action === "update-matrix") {
    playbackEngine.cleanup();
    const { target, name, row, col } = event.target.dataset;
    const val = event.target.value;
    state[target][name][Number(row)][Number(col)] = val;
    state[target].result = null;
    state[target].requestResult = null;
    resetNestedPlayback(state[target]);
    state[target].errors = [];
    rerender();
    return;
  }

  if (action === "update-vector") {
    playbackEngine.cleanup();
    const { target, name, idx } = event.target.dataset;
    const val = event.target.value;
    state[target][name][Number(idx)] = val;
    if (target !== "bankers" || name !== "requestVector") {
      state[target].result = null;
      resetNestedPlayback(state[target]);
    }
    state[target].requestResult = null;
    state[target].errors = [];
    rerender();
    return;
  }

  if (action === "update-request-process") {
    playbackEngine.cleanup();
    state.bankers.requestProcess = event.target.value;
    state.bankers.requestResult = null;
    state.bankers.errors = [];
    rerender();
    return;
  }

  if (action === "run-bankers") {
    playbackEngine.cleanup();
    const s = state.bankers;
    s.errors = validateBankersInput(s.allocation, s.max, s.available);
    
    if (s.errors.length === 0) {
      const processes = Array.from({ length: s.numProcesses }, (_, i) => `P${i}`);
      s.result = runBankersSafetyAlgorithm(processes, s.available, s.allocation, s.max);
      s.playback.totalSteps = s.result.steps.length;
      s.playback.currentStep = 0;
      s.playback.isPlaying = false;
      s.requestResult = null;
    } else {
      s.result = null;
    }
    rerender();
    return;
  }

  if (action === "run-request") {
    playbackEngine.cleanup();
    const s = state.bankers;
    const reqErrors = validateResourceRequestInput(s.requestVector, s.numResources);
    
    if (reqErrors.length > 0) { s.errors = reqErrors; rerender(); return; }
    s.errors = [];

    const processes = Array.from({ length: s.numProcesses }, (_, i) => `P${i}`);
    s.requestResult = simulateResourceRequest(
      s.requestProcess,
      s.requestVector,
      processes,
      s.available,
      s.allocation,
      s.max
    );
    
    // Jump to end of safety check since a request is a sub-check
    s.playback.currentStep = s.playback.totalSteps;
    rerender();
    return;
  }

  if (action === "run-detection") {
    playbackEngine.cleanup();
    const s = state.detection;
    s.errors = validateDetectionInput(s.allocation, s.request, s.available);

    if (s.errors.length === 0) {
      const processes = Array.from({ length: s.numProcesses }, (_, i) => `P${i}`);
      s.result = runDeadlockDetection(processes, s.available, s.allocation, s.request);
      s.playback.totalSteps = s.result.steps.length;
      s.playback.currentStep = 0;
      s.playback.isPlaying = false;
    } else {
      s.result = null;
    }
    rerender();
    return;
  }
}

function createInitialState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function resetNestedPlayback(sectionState) {
  if (!sectionState.playback) return;
  sectionState.playback.currentStep = 0;
  sectionState.playback.totalSteps = 0;
  sectionState.playback.isPlaying = false;
}
