import { pageReplacementAlgorithms } from "../algorithms/pageReplacement/index.js";
import { renderPageReplacementStats } from "../components/pageReplacementStats.js";
import { renderPageReplacementTable } from "../components/pageReplacementTable.js";
import { renderPageReplacementVisualization } from "../components/pageReplacementVisualization.js";
import {
  parseNonNegativeIntegerSequence,
  validatePositiveIntegerValue
} from "../utils/validation.js";
import { renderPlaybackControls, renderReadyPlaceholder } from "../components/playbackControls.js";
import { renderExplanationCard } from "../components/explanationCard.js";
import { playbackEngine } from "../utils/playbackEngine.js";
import { renderComparisonChart, renderComparisonInsight } from "../components/comparisonView.js";

const defaultState = {
  mode: "visualize",
  comparisonAlgorithms: ["fifo", "lru", "optimal"],
  comparisonResult: null,
  selectedAlgorithmId: "fifo",
  referenceInput: "7 0 1 2 0 3 0 4 2 3 0 3",
  frameCount: 3,
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

function generateNarrative(result, stepIndex) {
  if (!result || stepIndex === 0) return "Click Play to begin the simulation or Step Forward to advance manually.";
  
  const step = result.steps[stepIndex - 1];
  const { page, result: hitOrFault, replacedPage } = step;

  if (hitOrFault === "Hit") {
    return `<strong>Step ${stepIndex}: Page ${page}</strong> requested. It is already in memory (Hit). No pages were replaced.`;
  }
  
  if (replacedPage === null) {
    return `<strong>Step ${stepIndex}: Page ${page}</strong> requested. It is not in memory (Fault). Loaded into an empty frame.`;
  }

  const reason = getReplacementReason(result.algorithmId, replacedPage);
  return `<strong>Step ${stepIndex}: Page ${page}</strong> requested. Not in memory (Fault). Frame is full, so replaced <strong>Page ${replacedPage}</strong> because it ${reason}.`;
}

function getReplacementReason(algoId, replacedPage) {
  if (algoId === "fifo") return "was the first page to enter memory";
  if (algoId === "lru") return "was the least recently used page";
  if (algoId === "optimal") return "will not be used for the longest time in the future";
  return "was selected for replacement";
}


export function renderPageReplacementPage() {
  const selectedAlgorithm = pageReplacementAlgorithms[state.selectedAlgorithmId];
  const showMetrics = state.playback.currentStep >= state.playback.totalSteps && state.result;

  return `
    <section class="page-grid page-replacement-page">
      <div class="panel input-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Functional Module</p>
            <h2>Page Replacement</h2>
          </div>
          <button class="secondary-button" type="button" data-action="page-reset">Reset</button>
        </div>

        <div class="mode-tabs">
          <button class="mode-tab ${state.mode === 'visualize' ? 'active' : ''}" type="button" data-action="page-switch-mode" data-mode="visualize">Visualize</button>
          <button class="mode-tab ${state.mode === 'compare' ? 'active' : ''}" type="button" data-action="page-switch-mode" data-mode="compare">Compare</button>
        </div>

        ${state.mode === 'visualize' ? `
          <div class="field-group">
            <label class="field-label" for="pageAlgorithm">Page Replacement Algorithm</label>
            <select id="pageAlgorithm" class="select-control" data-action="page-select-algorithm">
              ${Object.values(pageReplacementAlgorithms).map((algorithm) => `
                <option value="${algorithm.id}" ${algorithm.id === selectedAlgorithm.id ? "selected" : ""}>
                  ${algorithm.name}
                </option>
              `).join("")}
            </select>
          </div>
          ${renderExplanationCard(selectedAlgorithm.id, "page")}
        ` : `
          <div class="field-group">
            <label class="field-label">Algorithms to Compare</label>
            <div class="comparison-algo-list">
              ${Object.values(pageReplacementAlgorithms).map(alg => `
                <label class="comparison-algo-checkbox">
                  <input type="checkbox" data-action="page-toggle-algo" value="${alg.id}" ${state.comparisonAlgorithms.includes(alg.id) ? 'checked' : ''}>
                  ${alg.name}
                </label>
              `).join("")}
            </div>
            <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">Comparison uses the exact same reference string and frames for all selected algorithms.</p>
          </div>
        `}

        <div class="field-group" style="margin-top: 16px;">
          <label class="field-label" for="pageFrames">Number of Frames</label>
          <input id="pageFrames" class="number-control" data-action="page-input-frames" type="number" min="1" max="10" step="1" value="${state.frameCount}">
        </div>

        <div class="field-group">
          <label class="field-label" for="pageString">Reference String</label>
          <p class="field-description">Enter page numbers separated by commas.</p>
          <textarea id="pageString" class="text-control" data-action="page-input-string" rows="3" placeholder="e.g., 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1">${escapeHtml(state.referenceInput)}</textarea>
        </div>

        ${state.errors.length > 0 ? `
          <div class="error-box" role="alert">
            <strong>Check the input</strong>
            <ul>${state.errors.map(e => `<li>${e}</li>`).join("")}</ul>
          </div>
        ` : ""}

        <div class="action-row">
          ${state.mode === 'visualize' ? `
            <button class="primary-button" type="button" data-action="page-run">Run Simulation</button>
          ` : `
            <button class="primary-button" type="button" data-action="page-run-comparison" ${state.comparisonAlgorithms.length < 2 ? 'disabled' : ''}>Run Comparison</button>
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
            <h2>Page Replacement</h2>
          </div>
        </div>
        ${renderPageReplacementVisualization(state.result, state.playback.currentStep)}
        <div class="narrative-box" style="margin-top: 24px">
          ${generateNarrative(state.result, state.playback.currentStep)}
        </div>
        ${renderPlaybackControls(state.playback)}
      </section>
    ` : `
      ${renderReadyPlaceholder("Page Replacement", "page")}
    `}

    ${showMetrics ? `
      <section class="panel" style="animation: fadeIn 0.5s;">
        <div class="panel-header">
          <div><p class="eyebrow">Statistics</p><h2>Page Performance</h2></div>
        </div>
        ${renderPageReplacementStats(state.result.statistics)}
        ${renderPageReplacementTable(state.result)}
      </section>
    ` : ""}
  `;
}

function renderCompareOutput() {
  if (!state.comparisonResult) {
    return renderReadyPlaceholder("Comparison", "comparison");
  }

  const results = state.comparisonResult;
  
  // Find best (fewest page faults)
  let bestValue = Infinity;
  results.forEach(r => {
    if (r.statistics.pageFaults < bestValue) bestValue = r.statistics.pageFaults;
  });
  
  const bestAlgs = results.filter(r => r.statistics.pageFaults === bestValue).map(r => r.algorithmName);
  const isTie = bestAlgs.length > 1;

  const chartData = results.map(r => ({
    algorithmName: r.algorithmName,
    faults: r.statistics.pageFaults
  }));

  const tableRows = results.map(r => `
    <tr>
      <td><strong>${r.algorithmName}</strong></td>
      <td>${r.statistics.pageFaults}</td>
      <td>${r.statistics.pageHits}</td>
      <td>${formatPercent(r.statistics.hitRatio)}</td>
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
            <th>Page Faults</th>
            <th>Page Hits</th>
            <th>Hit Ratio</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      ${renderComparisonChart("Page Faults", chartData, "faults", "faults", "danger")}
      ${renderComparisonInsight(bestAlgs, "page faults", bestValue, isTie, "faults")}
    </section>
  `;
}

export function handlePageReplacementAction(event, rerender) {
  const action = event.target.dataset.action;
  if (!action) return;

  if (action === "page-switch-mode") {
    playbackEngine.cleanup();
    state.mode = event.target.dataset.mode;
    state.result = null;
    state.comparisonResult = null;
    state.comparisonResults = [];
    resetPlayback();
    rerender();
    return;
  }

  if (action === "page-toggle-algo") {
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

  if (action === "page-run-comparison") {
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

  if (action === "page-select-algorithm") {
    playbackEngine.cleanup();
    state.selectedAlgorithmId = event.target.value;
    state.result = null;
    resetPlayback();
    state.errors = [];
    rerender();
    return;
  }

  if (action === "page-input-string") {
    state.referenceInput = event.target.value;
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    playbackEngine.cleanup();
    resetPlayback();
    rerender();
    return;
  }

  if (action === "page-input-frames") {
    state.frameCount = event.target.value;
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    playbackEngine.cleanup();
    resetPlayback();
    rerender();
    return;
  }

  if (action === "page-run") {
    playbackEngine.cleanup();
    runSelectedAlgorithm();
    rerender();
    return;
  }

  if (action === "page-compare") {
    playbackEngine.cleanup();
    runComparison();
    rerender();
    return;
  }

  if (action === "page-reset") {
    playbackEngine.cleanup();
    state = createInitialState();
    rerender();
  }
}

function runSelectedAlgorithm() {
  const parsedInput = parsePageInputs();
  state.errors = parsedInput.errors;
  state.comparisonResults = [];

  if (state.errors.length > 0) {
    state.result = null; state.comparisonResult = null;
    return;
  }

  const algorithm = pageReplacementAlgorithms[state.selectedAlgorithmId];
  state.result = algorithm.run(parsedInput.referenceSequence, parsedInput.frameCount);
  
  state.playback.totalSteps = state.result.steps.length;
  state.playback.currentStep = 0;
  state.playback.isPlaying = false;
}

function runComparison() {
  const parsedInput = parsePageInputs();
  state.errors = parsedInput.errors;

  if (state.errors.length > 0) {
    state.result = null; state.comparisonResult = null;
    state.comparisonResults = [];
    return;
  }

  state.comparisonResult = state.comparisonAlgorithms.map((algorithmId) => {
    const algorithm = pageReplacementAlgorithms[algorithmId];
    const result = algorithm.run([...parsedInput.referenceSequence], parsedInput.frameCount);
    return { algorithmId: algorithm.id, algorithmName: algorithm.name, ...result };
  });
  state.comparisonResults = [...state.comparisonResult];
  state.result = null;
  resetPlayback();
}

function parsePageInputs() {
  syncCurrentInputValues();
  const referenceSequence = parseNonNegativeIntegerSequence(state.referenceInput, "Reference String");
  const errors = [...referenceSequence.errors];
  if (referenceSequence.values.length > 200) errors.push("Reference String must contain no more than 200 references.");

  const frameCount = Number(state.frameCount);
  errors.push(...validatePositiveIntegerValue(state.frameCount, "Number of Frames"));
  if (Number.isInteger(frameCount) && frameCount > 10) {
    errors.push("Number of Frames must be 10 or fewer for a readable visualization.");
  }

  return { referenceSequence: referenceSequence.values, frameCount, errors };
}

function syncCurrentInputValues() {
  if (typeof document === "undefined") return;
  const refEl = document.querySelector("#pageString");
  const frameEl = document.querySelector("#pageFrames");
  if (refEl) state.referenceInput = refEl.value;
  if (frameEl) state.frameCount = frameEl.value;
}

function createInitialState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function resetPlayback() {
  state.playback.currentStep = 0;
  state.playback.totalSteps = 0;
  state.playback.isPlaying = false;
}

function formatPercent(ratio) {
  return `${(ratio * 100).toFixed(0)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
