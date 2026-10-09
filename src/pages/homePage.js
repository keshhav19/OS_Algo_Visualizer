export function renderHomePage(modules) {
  const cards = modules.filter(m => m.id !== "home").map(m => `
    <button class="module-card ${m.id === "cpu" ? "wide" : ""}" type="button" data-module-id="${m.id}">
      <div class="module-card-header">
        <h3>${m.name}</h3>
        <span aria-hidden="true">-></span>
      </div>
      <div class="module-card-preview" aria-hidden="true">
        ${renderModulePreview(m.id)}
      </div>
      <div class="module-card-content">
        <p>${getModuleDescription(m.id)}</p>
        <div class="module-card-algorithms">${getModuleAlgorithms(m.id)}</div>
        <span class="explore-link">Explore ${m.name}</span>
      </div>
    </button>
  `).join("");

  return `
    <div class="home-page-container">
      <header class="home-header">
        <h1>OScope</h1>
        <p class="subtitle">Operating Systems Algorithm Visualizer</p>
        <p class="description">Configure textbook workloads, run simulations, step through playback, and compare algorithm trade-offs using the same tested calculation engine.</p>
        <div class="home-actions">
          <button class="primary-button" type="button" data-module-id="cpu">Start Visualizing</button>
          <button class="secondary-button" type="button" data-module-id="cpu" data-mode="compare">Compare Algorithms</button>
        </div>
      </header>
      <section class="home-grid" aria-label="Available modules">
        ${cards}
      </section>
    </div>
  `;
}

function getModuleDescription(moduleId) {
  const descriptions = {
    cpu: "Visualize how a scheduler selects, runs, pauses, and completes processes.",
    memory: "Watch contiguous memory blocks split into allocations and free space.",
    page: "Inspect page hits, faults, frame loads, and replacement decisions.",
    deadlock: "Evaluate safe sequences, resource requests, and deadlocked processes.",
    disk: "Trace disk head movement across request queues and scan strategies."
  };
  return descriptions[moduleId] ?? "";
}

function getModuleAlgorithms(moduleId) {
  const algorithms = {
    cpu: "FCFS / SJF / Priority / Round Robin / MLQ / MLFQ",
    memory: "First Fit / Best Fit / Worst Fit",
    page: "FIFO / LRU / Optimal",
    deadlock: "Banker's / Resource Request / Detection",
    disk: "FCFS / SSTF / SCAN / C-SCAN / LOOK / C-LOOK"
  };
  return algorithms[moduleId] ?? "";
}

function renderModulePreview(moduleId) {
  if (moduleId === "cpu") return `
    <div class="preview-gantt">
      <span class="process-color-1" style="width: 30%">P1</span>
      <span class="process-color-2" style="width: 45%">P2</span>
      <span class="process-color-5" style="width: 25%">P3</span>
    </div>
    <div class="preview-axis"><span>0</span><span>3</span><span>7.5</span><span>10</span></div>
  `;

  if (moduleId === "memory") return `
    <div class="preview-memory">
      <span class="os">0x00&nbsp;&nbsp;OS</span>
      <span class="process-color-4">Process A</span>
      <span class="free">Free</span>
      <span class="process-color-2">Process B</span>
    </div>
  `;

  if (moduleId === "page") return `
    <div class="preview-frames">
      <span class="active">4</span><span>1</span><span>2</span><span class="fault">3</span>
    </div>
    <code>Ref String: 7 0 1 2 0 3 0 4</code>
  `;

  if (moduleId === "deadlock") return `
    <svg class="preview-deadlock" viewBox="0 0 180 140" role="img">
      <circle cx="40" cy="40" r="20"></circle>
      <text x="40" y="44">P1</text>
      <circle cx="140" cy="100" r="20"></circle>
      <text x="140" y="104">P2</text>
      <rect x="120" y="20" width="40" height="40" rx="4"></rect>
      <text x="140" y="44">R1</text>
      <rect x="20" y="80" width="40" height="40" rx="4"></rect>
      <text x="40" y="104">R2</text>
      <path class="ok" d="M60 40 L112 40"></path>
      <path class="ok" d="M120 100 L68 100"></path>
      <path class="wait" d="M140 60 C140 76 140 86 140 80"></path>
      <path class="wait" d="M40 80 C40 64 40 54 40 60"></path>
    </svg>
  `;

  return `
    <svg class="preview-disk" viewBox="0 0 220 120" role="img">
      <line x1="10" y1="104" x2="210" y2="104"></line>
      <polyline points="52,20 96,46 180,66 28,92 46,106"></polyline>
      <circle cx="52" cy="20" r="4"></circle>
      <circle cx="96" cy="46" r="4"></circle>
      <circle cx="180" cy="66" r="4"></circle>
      <circle cx="28" cy="92" r="4"></circle>
      <circle cx="46" cy="106" r="4"></circle>
    </svg>
  `;
}
