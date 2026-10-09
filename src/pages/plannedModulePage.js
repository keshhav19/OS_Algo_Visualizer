export function renderPlannedModulePage(module) {
  return `
    <section class="planned-panel">
      <div>
        <p class="eyebrow">Planned Module</p>
        <h2>${module.name}</h2>
        <p>${module.name} will be implemented after the CPU Scheduling phase is complete.</p>
      </div>
      <div class="planned-list" aria-label="Phase status">
        <span>Current phase</span>
        <strong>CPU Scheduling only</strong>
      </div>
    </section>
  `;
}
