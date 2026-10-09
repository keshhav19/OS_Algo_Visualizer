import { schedulingAlgorithms } from "../algorithms/scheduling/index.js";
import { renderGanttChart } from "../components/ganttChart.js";
import { renderMetricsTable } from "../components/metricsTable.js";
import { renderProcessTable } from "../components/processTable.js";
import { defaultProcesses } from "../utils/sampleData.js";
import { isNonNegativeInteger, validateProcesses, validateQueueConfigs } from "../utils/validation.js";
import { renderPlaybackControls, renderReadyPlaceholder } from "../components/playbackControls.js";
import { playbackEngine } from "../utils/playbackEngine.js";
import { renderComparisonChart, renderComparisonInsight } from "../components/comparisonView.js";
import { renderExplanationCard } from "../components/explanationCard.js";

const defaultState = {
  mode: "visualize",
  comparisonAlgorithms: ["fcfs", "sjf", "priority", "roundRobin", "mlq", "mlfq"],
  comparisonResult: null,
  selectedAlgorithmId: "fcfs",
  timeQuantum: 2,
  contextSwitchEnabled: false,
  contextSwitchTime: 2,
  processes: defaultProcesses.map((process, idx) => ({ 
    ...process, 
    queueId: (idx % 2) + 1 
  })),
  queueConfigs: [
    { id: 1, priority: 1, algorithm: "rr", timeQuantum: 2 },
    { id: 2, priority: 2, algorithm: "rr", timeQuantum: 4 },
    { id: 3, priority: 3, algorithm: "fcfs", timeQuantum: 0 }
  ],
  result: null,
  errors: [],
  playback: {
    currentStep: 0,
    totalSteps: 0,
    isPlaying: false,
    speedMs: 1000
  }
};

let state = createInitialState();

export function setCpuSchedulingMode(mode) {
  if (!["visualize", "compare"].includes(mode)) return;
  playbackEngine.cleanup();
  state.mode = mode;
  state.result = null;
  state.comparisonResult = null;
  resetPlayback();
}

function generateCpuNarrative(result, stepIndex) {
  if (!result || stepIndex === 0) return "Click Play to begin the simulation or Step Forward to advance manually.";
  
  const segment = result.ganttChart[stepIndex - 1];
  
  if (segment.isIdle || segment.pid === "Idle") {
    return `<strong>Step ${stepIndex}:</strong> CPU is idle from ${segment.start}ms to ${segment.end}ms waiting for a process to arrive.`;
  }
  
  if (segment.isContextSwitch || segment.pid === "CS") {
    return `<strong>Step ${stepIndex}:</strong> Context switch occurring from ${segment.start}ms to ${segment.end}ms.`;
  }
  
  let reason = "";
  const algoId = result.algorithmId;
  if (algoId === "fcfs") reason = "because it arrived first in the ready queue";
  else if (algoId === "sjf") reason = "because it has the shortest burst time among the processes currently in the ready queue";
  else if (algoId === "priority") reason = "because it has the highest priority among the ready processes";
  else if (algoId === "roundRobin") reason = "because it is next in the Round Robin queue rotation";
  else if (algoId === "mlq") reason = "because it is at the front of the highest priority active queue";
  else if (algoId === "mlfq") reason = "based on Multi-Level Feedback Queue priority and preemption rules";

  return `<strong>Step ${stepIndex}:</strong> Process <strong>${escapeHtml(segment.pid)}</strong> is selected ${reason}. It executes from ${segment.start}ms to ${segment.end}ms.`;
}
  
export function renderCpuSchedulingPage() {
  const selectedAlgorithm = schedulingAlgorithms[state.selectedAlgorithmId];
  const showMetrics = state.playback.currentStep >= state.playback.totalSteps && state.result;
  
  // Check if we need queue config in comparison mode
  const needsQueueConfig = state.mode === 'compare' && (state.comparisonAlgorithms.includes('mlq') || state.comparisonAlgorithms.includes('mlfq'));

  return `
    <section class="page-grid">
      <div class="panel input-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Functional Module</p>
            <h2>CPU Scheduling</h2>
          </div>
          <button class="secondary-button" type="button" data-action="reset">Reset</button>
        </div>

        <div class="mode-tabs">
          <button class="mode-tab ${state.mode === 'visualize' ? 'active' : ''}" type="button" data-action="switch-mode" data-mode="visualize">Visualize</button>
          <button class="mode-tab ${state.mode === 'compare' ? 'active' : ''}" type="button" data-action="switch-mode" data-mode="compare">Compare</button>
        </div>

        ${state.mode === 'visualize' ? `
          <div class="field-group">
            <label class="field-label" for="algorithm">Scheduling Algorithm</label>
            <select id="algorithm" class="select-control" data-action="select-algorithm">
              ${Object.values(schedulingAlgorithms).map((algorithm) => `
                <option value="${algorithm.id}" ${algorithm.id === selectedAlgorithm.id ? "selected" : ""}>
                  ${algorithm.name}
                </option>
              `).join("")}
            </select>
          </div>
          ${renderExplanationCard(selectedAlgorithm.id, "cpu")}
        ` : `
          <div class="field-group">
            <label class="field-label">Algorithms to Compare</label>
            <div class="comparison-algo-list">
              ${Object.values(schedulingAlgorithms).map(alg => `
                <label class="comparison-algo-checkbox">
                  <input type="checkbox" data-action="toggle-algo" value="${alg.id}" ${state.comparisonAlgorithms.includes(alg.id) ? 'checked' : ''}>
                  ${alg.name}
                </label>
              `).join("")}
            </div>
            <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">Comparison uses the exact same processes, arrival times, burst times, and priorities for all selected algorithms.</p>
          </div>
        `}

        ${(state.mode === 'visualize' && selectedAlgorithm.requiresQuantum) ? `
          <div class="field-group">
            <label class="field-label" for="timeQuantum">Time Quantum (ms)</label>
            <input id="timeQuantum" class="number-control" data-action="update-quantum" type="number" min="1" step="1" value="${state.timeQuantum}">
          </div>
        ` : ""}

        ${(state.mode === 'visualize' && selectedAlgorithm.requiresQueueConfig) || needsQueueConfig ? renderQueueConfigSection(state.queueConfigs, selectedAlgorithm) : ""}

        <div class="field-group">
          <div class="toggle-row control-toggle">
            <input id="contextSwitchEnabled" data-action="update-context-switch-enabled" type="checkbox" ${state.contextSwitchEnabled ? "checked" : ""}>
            <label class="field-label inline-label" for="contextSwitchEnabled">Include Context Switch Time</label>
          </div>
          <label class="field-label" for="contextSwitch">Context Switch Time (ms)</label>
          <input id="contextSwitch" class="number-control" data-action="update-context-switch" type="number" min="0" step="1" value="${state.contextSwitchTime}" ${state.contextSwitchEnabled ? "" : "disabled"}>
        </div>

        <div class="panel-header" style="margin-top: 24px; padding-bottom: 8px;">
          <h3>Processes</h3>
          <button class="secondary-button" type="button" data-action="add-process">+ Add Process</button>
        </div>

        ${renderProcessTable(
          state.processes,
          {
            showPriority: (state.mode === 'visualize' && selectedAlgorithm.requiresPriority) || (state.mode === 'compare' && state.comparisonAlgorithms.includes('priority')),
            showQueueAssignment: (state.mode === 'visualize' && selectedAlgorithm.requiresQueueAssignment) || (state.mode === 'compare' && state.comparisonAlgorithms.includes('mlq')),
            queueConfigs: state.queueConfigs
          }
        )}

        ${state.errors.length > 0 ? `
          <div class="error-box" role="alert">
            <strong>Check the input</strong>
          <ul>${state.errors.map(e => `<li>${escapeHtml(e)}</li>`).join("")}</ul>
          </div>
        ` : ""}

        <div class="action-row" style="margin-top: 24px">
          ${state.mode === 'visualize' ? `
            <button class="primary-button" type="button" data-action="run">Run Simulation</button>
          ` : `
            <button class="primary-button" type="button" data-action="run-comparison" ${state.comparisonAlgorithms.length < 2 ? 'disabled' : ''}>Run Comparison</button>
          `}
        </div>
      </div>

      <div class="output-stack">
        ${state.mode === 'visualize' ? renderVisualizeOutput(selectedAlgorithm, showMetrics) : renderCompareOutput()}
      </div>
    </section>
  `;
}

function renderVisualizeOutput(selectedAlgorithm, showMetrics) {
  return `
    ${state.result ? `
      <section class="panel">
        <div class="panel-header" style="margin-bottom: 0">
          <div>
            <p class="eyebrow">Visualization Arena</p>
            <h2>CPU Scheduling</h2>
          </div>
        </div>
        ${renderGanttChart(state.result.ganttChart, state.playback.currentStep)}
        <div class="narrative-box" style="margin-top: 24px">
          ${generateCpuNarrative(state.result, state.playback.currentStep)}
        </div>
        ${renderPlaybackControls(state.playback)}
      </section>
    ` : `
      ${renderReadyPlaceholder("CPU Scheduling", "cpu")}
    `}

    ${showMetrics ? `
      <section class="panel" style="animation: fadeIn 0.5s;">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Calculated Output</p>
            <h2>Process Metrics</h2>
          </div>
        </div>
        ${renderMetricsTable(state.result, selectedAlgorithm.requiresPriority)}
      </section>
    ` : ""}
  `;
}

function renderCompareOutput() {
  if (!state.comparisonResult) {
    return renderReadyPlaceholder("Comparison", "comparison");
  }

  const results = state.comparisonResult;
  
  // Find best (lowest avg waiting time)
  let bestValue = Infinity;
  results.forEach(r => {
    if (r.averages.waitingTime < bestValue) bestValue = r.averages.waitingTime;
  });
  
  const bestAlgs = results.filter(r => r.averages.waitingTime === bestValue).map(r => r.algorithmName);
  const isTie = bestAlgs.length > 1;

  const chartData = results.map(r => ({
    algorithmName: r.algorithmName,
    wt: r.averages.waitingTime
  }));

  const tableRows = results.map(r => `
    <tr>
      <td><strong>${r.algorithmName}</strong></td>
      <td>${r.averages.waitingTime.toFixed(2)} ms</td>
      <td>${r.averages.turnaroundTime.toFixed(2)} ms</td>
      <td>${r.averages.responseTime.toFixed(2)} ms</td>
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
            <th>Avg Waiting Time</th>
            <th>Avg Turnaround Time</th>
            <th>Avg Response Time</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      ${renderComparisonChart("Average Waiting Time", chartData, "wt", "ms", "primary")}
      ${renderComparisonInsight(bestAlgs, "average waiting time", bestValue, isTie, "ms")}
    </section>
  `;
}
function renderQueueConfigSection(queueConfigs, selectedAlgorithm) {
  const mlfqInfo = selectedAlgorithm.id === "mlfq" ? `
    <div class="queue-info-box">
      <strong>Policy:</strong> All new processes start in Queue 1. If a process uses its full time quantum, it is demoted to the next lower-priority queue. Preemption occurs if a new process arrives at a higher-priority queue.
    </div>
  ` : "";

  const queueCards = queueConfigs.map((q, index) => `
    <div class="queue-config-card">
      <div class="queue-card-header">
        <h4>Queue ${q.id}</h4>
        <button class="icon-button danger" type="button" data-action="remove-queue" data-index="${index}" ${queueConfigs.length <= 2 ? "disabled" : ""}>x</button>
      </div>
      <div class="field-row">
        <label>Priority</label>
        <input class="table-input" data-action="update-queue" data-field="priority" data-index="${index}" type="number" step="1" value="${q.priority}">
      </div>
      <div class="field-row">
        <label>Algorithm</label>
        <select class="table-input" data-action="update-queue" data-field="algorithm" data-index="${index}">
          <option value="rr" ${q.algorithm === "rr" ? "selected" : ""}>Round Robin</option>
          <option value="fcfs" ${q.algorithm === "fcfs" ? "selected" : ""}>FCFS</option>
        </select>
      </div>
      ${q.algorithm === "rr" ? `
        <div class="field-row">
          <label>Quantum</label>
          <input class="table-input" data-action="update-queue" data-field="timeQuantum" data-index="${index}" type="number" min="1" step="1" value="${q.timeQuantum || 2}">
        </div>
      ` : ""}
    </div>
  `).join("");

  return `
    <div class="queue-config-section">
      <div class="process-section-header">
        <h3>Queue Configuration</h3>
        <button class="secondary-button" type="button" data-action="add-queue" ${queueConfigs.length >= 4 ? "disabled" : ""}>Add Queue</button>
      </div>
      ${mlfqInfo}
      <div class="queue-cards-container">
        ${queueCards}
      </div>
    </div>
  `;
}


export function handleCpuSchedulingAction(event, rerender) {
  const action = event.target.dataset.action;
  if (!action) return;

  if (action === "switch-mode") {
    playbackEngine.cleanup();
    state.mode = event.target.dataset.mode;
    state.result = null;
    state.comparisonResult = null;
    resetPlayback();
    rerender();
    return;
  }

  if (action === "toggle-algo") {
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

  if (action === "run-comparison") {
    playbackEngine.cleanup();
    state.errors = validateCpuInputsForSelection(state.comparisonAlgorithms);

    if (state.errors.length === 0) {
      state.comparisonResult = state.comparisonAlgorithms.map(algoId => {
        const alg = schedulingAlgorithms[algoId];
        const res = runCpuAlgorithm(algoId);
        return { algorithmId: alg.id, algorithmName: alg.name, ...res };
      });
    } else {
      state.comparisonResult = null;
    }
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

  if (action === "update-process") {
    updateProcessField(event.target);
    playbackEngine.cleanup();
    rerender();
    return;
  }

  const selectedAlgorithm = schedulingAlgorithms[state.selectedAlgorithmId];

  if (action === "select-algorithm") {
    playbackEngine.cleanup();
    state.selectedAlgorithmId = event.target.value;
    state.errors = [];
    state.result = null; state.comparisonResult = null;
    resetPlayback();
    rerender();
    return;
  }

  if (action === "update-quantum") {
    playbackEngine.cleanup();
    state.timeQuantum = event.target.value;
    state.result = null; state.comparisonResult = null;
    resetPlayback();
    rerender();
    return;
  }

  if (action === "update-context-switch-enabled") {
    playbackEngine.cleanup();
    state.contextSwitchEnabled = event.target.checked;
    state.result = null; state.comparisonResult = null;
    resetPlayback();
    rerender();
    return;
  }

  if (action === "update-context-switch") {
    playbackEngine.cleanup();
    state.contextSwitchTime = event.target.value;
    state.result = null; state.comparisonResult = null;
    resetPlayback();
    rerender();
    return;
  }

  if (action === "add-process") {
    playbackEngine.cleanup();
    addProcess();
    rerender();
    return;
  }

  if (action === "remove-process") {
    playbackEngine.cleanup();
    removeProcess(Number(event.target.dataset.index));
    rerender();
    return;
  }

  if (action === "add-queue") {
    playbackEngine.cleanup();
    if (state.queueConfigs.length < 4) {
      const nextId = Math.max(...state.queueConfigs.map(q => q.id), 0) + 1;
      state.queueConfigs.push({
        id: nextId,
        priority: nextId,
        algorithm: "rr",
        timeQuantum: 2
      });
      state.result = null; state.comparisonResult = null;
      resetPlayback();
      rerender();
    }
    return;
  }

  if (action === "remove-queue") {
    playbackEngine.cleanup();
    if (state.queueConfigs.length > 2) {
      const [removedQueue] = state.queueConfigs.splice(Number(event.target.dataset.index), 1);
      const fallbackQueueId = state.queueConfigs[0]?.id ?? 1;
      state.processes = state.processes.map((process) => (
        String(process.queueId) === String(removedQueue.id) ? { ...process, queueId: fallbackQueueId } : process
      ));
      state.result = null; state.comparisonResult = null;
      resetPlayback();
      rerender();
    }
    return;
  }

  if (action === "update-queue") {
    playbackEngine.cleanup();
    const input = event.target;
    const index = Number(input.dataset.index);
    if (!state.queueConfigs[index]) return;
    const field = input.dataset.field;
    state.queueConfigs[index][field] = field === "algorithm" ? input.value : Number(input.value);
    state.result = null; state.comparisonResult = null;
    resetPlayback();
    rerender();
    return;
  }

  if (action === "reset") {
    playbackEngine.cleanup();
    state = createInitialState();
    rerender();
    return;
  }

  if (action === "run") {
    playbackEngine.cleanup();
    state.errors = validateCpuInputsForSelection([state.selectedAlgorithmId]);

    if (state.errors.length === 0) {
      state.result = {
        algorithmId: selectedAlgorithm.id,
        algorithmName: selectedAlgorithm.name,
        ...runCpuAlgorithm(selectedAlgorithm.id)
      };
      
      state.playback.totalSteps = state.result.ganttChart.length;
      state.playback.currentStep = 0;
      state.playback.isPlaying = false;
    } else {
      state.result = null; state.comparisonResult = null;
    }

    rerender();
  }
}

function updateProcessField(input) {
  const process = state.processes[Number(input.dataset.index)];
  if (!process) return;
  process[input.dataset.field] = input.value;
  state.result = null; state.comparisonResult = null;
  resetPlayback();
}

function createInitialState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function addProcess() {
  if (state.processes.length >= 50) {
    state.errors = ["Use no more than 50 processes."];
    return;
  }
  state.processes.push({
    pid: `P${state.processes.length + 1}`,
    arrivalTime: 0,
    burstTime: 1,
    priority: 1,
    queueId: 1
  });
  state.result = null; state.comparisonResult = null;
  state.errors = [];
  resetPlayback();
}

function removeProcess(index) {
  if (state.processes.length <= 1) return;
  state.processes.splice(index, 1);
  state.result = null; state.comparisonResult = null;
  state.errors = [];
  resetPlayback();
}

function validateCpuInputsForSelection(algorithmIds) {
  const requiresPriority = algorithmIds.includes("priority");
  const requiresQuantum = algorithmIds.includes("roundRobin");
  const requiresQueueConfig = algorithmIds.some((id) => schedulingAlgorithms[id]?.requiresQueueConfig);
  const requiresQueueAssignment = algorithmIds.includes("mlq");

  const errors = validateProcesses(state.processes, {
    requiresPriority,
    requiresQuantum,
    requiresQueueAssignment,
    queueConfigs: state.queueConfigs,
    timeQuantum: state.timeQuantum
  });

  if (requiresQueueConfig) {
    errors.push(...validateQueueConfigs(state.queueConfigs));
  }

  if (state.contextSwitchEnabled) {
    const csValue = Number(state.contextSwitchTime);
    if (!isNonNegativeInteger(state.contextSwitchTime) || csValue > 10000) {
      errors.push("Context Switch Time must be a non-negative integer no greater than 10000.");
    }
  }

  return errors;
}

function runCpuAlgorithm(algorithmId) {
  const algorithm = schedulingAlgorithms[algorithmId];
  const processCopies = state.processes.map((process) => ({ ...process }));
  const contextSwitchTime = state.contextSwitchEnabled ? Number(state.contextSwitchTime) : 0;

  if (algorithm.requiresQueueConfig) {
    return algorithm.run(processCopies, state.queueConfigs.map((queue) => ({ ...queue })), contextSwitchTime);
  }

  if (algorithm.requiresQuantum) {
    return algorithm.run(processCopies, Number(state.timeQuantum), contextSwitchTime);
  }

  return algorithm.run(processCopies, undefined, contextSwitchTime);
}

function resetPlayback() {
  state.playback.currentStep = 0;
  state.playback.totalSteps = 0;
  state.playback.isPlaying = false;
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
