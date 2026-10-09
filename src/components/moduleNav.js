export function renderModuleNav(modules, activeModuleId) {
  return modules.map((module) => `
    <button
      class="module-button ${module.id === activeModuleId ? "active" : ""}"
      type="button"
      data-module-id="${module.id}"
      aria-pressed="${module.id === activeModuleId}"
    >
      <span class="module-icon" aria-hidden="true">${module.icon}</span>
      <span>
        <strong>${module.name}</strong>
        <small>${module.status}</small>
      </span>
    </button>
  `).join("");
}
