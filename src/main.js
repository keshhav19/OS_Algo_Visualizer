import { renderModuleNav } from "./components/moduleNav.js";
import { handleCpuSchedulingAction, renderCpuSchedulingPage, setCpuSchedulingMode } from "./pages/cpuSchedulingPage.js";
import { handleMemoryManagementAction, renderMemoryManagementPage } from "./pages/memoryManagementPage.js";
import { handlePageReplacementAction, renderPageReplacementPage } from "./pages/pageReplacementPage.js";
import { renderPlannedModulePage } from "./pages/plannedModulePage.js";
import { handleDeadlockAction, renderDeadlockPage } from "./pages/deadlockPage.js";
import { handleDiskSchedulingAction, renderDiskSchedulingPage } from "./pages/diskSchedulingPage.js";
import { renderHomePage } from "./pages/homePage.js";
import { playbackEngine } from "./utils/playbackEngine.js";

const modules = [
  { id: "home", name: "Home", icon: "OS", status: "Overview", subtitle: "Choose an Operating Systems module to visualize." },
  { id: "cpu", name: "CPU Scheduling", icon: "CPU", status: "Processes", subtitle: "Simulate and compare process execution order." },
  { id: "memory", name: "Memory Management", icon: "MEM", status: "Allocation", subtitle: "Track contiguous memory allocation decisions." },
  { id: "page", name: "Page Replacement", icon: "PAG", status: "Frames", subtitle: "Observe how page frames respond to references." },
  { id: "deadlock", name: "Deadlock Detection", icon: "DLK", status: "Resources", subtitle: "Explore safe states, requests, and detection." },
  { id: "disk", name: "Disk Scheduling", icon: "DSK", status: "Seek Path", subtitle: "Analyze disk head movement across requests." }
];

let activeModuleId = "home";
const app = document.getElementById("app");

function renderApp() {
  const activeModule = modules.find((m) => m.id === activeModuleId) || modules[0];

  app.innerHTML = `
    <div class="app-shell">
      <header class="app-topbar">
        <button class="topbar-brand" type="button" data-module-id="home" aria-label="Go to Home">
          <span class="topbar-mark" aria-hidden="true">OS</span>
          <span>OScope</span>
        </button>
        <nav class="topbar-nav" aria-label="Quick Navigation">
          <button type="button" data-module-id="home" class="${activeModuleId === "home" ? "active" : ""}">Home</button>
          <button type="button" data-module-id="cpu" class="${activeModuleId === "cpu" ? "active" : ""}">CPU Scheduling</button>
          <button type="button" data-module-id="memory" class="${activeModuleId === "memory" ? "active" : ""}">Memory</button>
          <button type="button" data-module-id="page" class="${activeModuleId === "page" ? "active" : ""}">Page Replacement</button>
          <button type="button" data-module-id="deadlock" class="${activeModuleId === "deadlock" ? "active" : ""}">Deadlock</button>
          <button type="button" data-module-id="disk" class="${activeModuleId === "disk" ? "active" : ""}">Disk</button>
        </nav>
      </header>
      <aside class="sidebar" aria-label="Sidebar Navigation">
        <div class="brand">
          <div class="brand-mark">ALG</div>
          <div>
            <h1>Algorithms</h1>
            <p>OS Concepts</p>
          </div>
        </div>
        <div class="sidebar-action-container">
          <button class="sidebar-action-btn" type="button" data-action="new-simulation" data-module-id="cpu">
            <span>+</span> New Simulation
          </button>
        </div>
        <nav class="module-nav" aria-label="Main Modules">
          ${renderModuleNav(modules, activeModuleId)}
        </nav>
        <div class="sidebar-footer">
          <a class="sidebar-link-btn" href="https://github.com/aadarshjh/OS-Algorithm-Visualizer" target="_blank" rel="noopener noreferrer">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg> Documentation / GitHub
          </a>
        </div>
      </aside>
      <main class="main-content" aria-label="Main Content">
        ${activeModule.id !== "home" ? `
          <header class="topbar">
            <div>
              <h2>${activeModule.name}</h2>
              <p>${activeModule.subtitle}</p>
            </div>
          </header>
        ` : ""}
        ${renderActivePage(activeModule)}
      </main>
    </div>
  `;
}

app.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-module-id]");
  if (navButton) {
    playbackEngine.cleanup(); // Clean up timer when switching modules
    activeModuleId = navButton.dataset.moduleId;
    if (activeModuleId === "cpu" && navButton.dataset.mode) {
      setCpuSchedulingMode(navButton.dataset.mode);
    }
    renderApp();
    return;
  }

  if (event.target.matches("select, input")) {
    return;
  }

  if (activeModuleId === "cpu") {
    handleCpuSchedulingAction(event, renderApp);
  } else if (activeModuleId === "memory") {
    handleMemoryManagementAction(event, renderApp);
  } else if (activeModuleId === "page") {
    handlePageReplacementAction(event, renderApp);
  } else if (activeModuleId === "deadlock") {
    handleDeadlockAction(event, renderApp);
  } else if (activeModuleId === "disk") {
    handleDiskSchedulingAction(event, renderApp);
  }
});

app.addEventListener("change", (event) => {
  if (activeModuleId === "cpu") {
    handleCpuSchedulingAction(event, renderApp);
  } else if (activeModuleId === "memory") {
    handleMemoryManagementAction(event, renderApp);
  } else if (activeModuleId === "page") {
    handlePageReplacementAction(event, renderApp);
  } else if (activeModuleId === "deadlock") {
    handleDeadlockAction(event, renderApp);
  } else if (activeModuleId === "disk") {
    handleDiskSchedulingAction(event, renderApp);
  }
});

renderApp();

function renderActivePage(activeModule) {
  if (activeModule.id === "home") return renderHomePage(modules);
  if (activeModule.id === "cpu") return renderCpuSchedulingPage();
  if (activeModule.id === "memory") return renderMemoryManagementPage();
  if (activeModule.id === "page") return renderPageReplacementPage();
  if (activeModule.id === "deadlock") return renderDeadlockPage();
  if (activeModule.id === "disk") return renderDiskSchedulingPage();
  return renderPlannedModulePage(activeModule);
}
