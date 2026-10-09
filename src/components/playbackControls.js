const ICONS = {
  reset: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>`,
  prev: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 7l-5 5 5 5V7z"/></svg>`,
  play: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  next: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 17l5-5-5-5v10z"/></svg>`,
  skip: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>`,
  
  cpu: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>`,
  memory: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="5" rx="1"/><rect x="2" y="10" width="20" height="5" rx="1"/><rect x="2" y="17" width="20" height="5" rx="1"/><path d="M6 5.5h.01M6 12.5h.01M6 19.5h.01"/></svg>`,
  page: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  deadlock: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>`,
  disk: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  comparison: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`
};

function getPlaceholderIcon(iconOrType) {
  if (!iconOrType) return ICONS.cpu;
  const key = String(iconOrType).toLowerCase();
  if (key.includes("cpu") || key.includes("time") || key.includes("sched")) return ICONS.cpu;
  if (key.includes("mem")) return ICONS.memory;
  if (key.includes("page") || key.includes("frame")) return ICONS.page;
  if (key.includes("deadlock") || key.includes("lock") || key.includes("banker")) return ICONS.deadlock;
  if (key.includes("disk") || key.includes("seek") || key.includes("head")) return ICONS.disk;
  if (key.includes("compar") || key.includes("chart")) return ICONS.comparison;
  if (ICONS[iconOrType]) return ICONS[iconOrType];
  return ICONS.cpu;
}

export function renderPlaybackControls(playback) {
  if (!playback) return '';
  const { currentStep, totalSteps, isPlaying, speedMs } = playback;
  
  const progressPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  
  return `
    <div class="playback-controls-bar">
      <div class="playback-progress-container">
        <div class="playback-progress-bar">
          <div class="playback-progress-fill" style="width: ${progressPercent}%"></div>
          <div class="playback-progress-thumb" style="left: ${progressPercent}%"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
        <div class="playback-buttons">
          <button class="icon-button" data-action="playback-reset" title="Reset to Start" aria-label="Reset to Start" ${currentStep === 0 ? "disabled" : ""}>
            ${ICONS.reset}
          </button>
          <button class="icon-button" data-action="playback-prev" title="Previous Step" aria-label="Previous Step" ${currentStep === 0 ? "disabled" : ""}>
            ${ICONS.prev}
          </button>
          <button class="icon-button primary" data-action="playback-toggle" title="${isPlaying ? 'Pause' : 'Play'}" aria-label="${isPlaying ? 'Pause' : 'Play'}" ${currentStep >= totalSteps ? "disabled" : ""}>
            ${isPlaying ? ICONS.pause : ICONS.play}
          </button>
          <button class="icon-button" data-action="playback-next" title="Next Step" aria-label="Next Step" ${currentStep >= totalSteps ? "disabled" : ""}>
            ${ICONS.next}
          </button>
          <button class="icon-button" data-action="playback-skip" title="Skip to End" aria-label="Skip to End" ${currentStep >= totalSteps ? "disabled" : ""}>
            ${ICONS.skip}
          </button>
        </div>
        <div class="playback-status">
          <span>Step ${currentStep} of ${totalSteps}</span>
        </div>
        <div class="playback-speed">
          <label>Speed:</label>
          <select data-action="playback-speed" class="select-control short" aria-label="Playback speed">
            <option value="2000" ${speedMs === 2000 ? "selected" : ""}>0.5×</option>
            <option value="1000" ${speedMs === 1000 ? "selected" : ""}>1×</option>
            <option value="500" ${speedMs === 500 ? "selected" : ""}>2×</option>
            <option value="250" ${speedMs === 250 ? "selected" : ""}>4×</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

export function renderReadyPlaceholder(moduleName, icon) {
  const renderedIcon = getPlaceholderIcon(icon || moduleName);
  return `
    <section class="panel">
      <div class="panel-header">
        <div><p class="eyebrow">Visualization Arena</p><h2>Ready to Visualize</h2></div>
      </div>
      <div class="ready-placeholder">
        <div class="ready-placeholder-icon">${renderedIcon}</div>
        <h3>Configure Input & Run</h3>
        <p>Configure your input on the left and run the simulation to see the ${moduleName} algorithm execute step by step.</p>
      </div>
    </section>
  `;
}
