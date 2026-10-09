export function renderComparisonChart(title, items, valueKey, unit, colorClass = "primary") {
  if (!items || items.length === 0) return "";
  
  // Find max value to scale the bars
  const maxValue = Math.max(...items.map(item => item[valueKey] || 0));
  
  const bars = items.map(item => {
    const val = item[valueKey] || 0;
    const width = maxValue > 0 ? (val / maxValue) * 100 : 0;
    
    return `
      <div class="bar-chart-row">
        <div class="bar-chart-label">${item.algorithmName}</div>
        <div class="bar-chart-track">
          <div class="bar-chart-fill bg-${colorClass}" style="width: ${width}%;"></div>
        </div>
        <div class="bar-chart-value">${val.toFixed ? (Number.isInteger(val) ? val : val.toFixed(2)) : val} ${unit}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="comparison-chart-container">
      <h3>${title}</h3>
      <div class="bar-chart">
        ${bars}
      </div>
    </div>
  `;
}

export function renderComparisonInsight(bestAlgNames, metricName, metricValue, isTie, unit) {
  const formattedValue = Number.isInteger(metricValue) ? metricValue : metricValue.toFixed(2);
  const valString = `${formattedValue} ${unit}`.trim();
  
  if (isTie) {
    const names = bestAlgNames.join(" and ");
    return `
      <div class="comparison-insight">
        <strong>Comparison Insight:</strong> For this input, ${names} produced the same best result for ${metricName} (${valString}).
      </div>
    `;
  } else {
    return `
      <div class="comparison-insight">
        <strong>Comparison Insight:</strong> For this input, ${bestAlgNames[0]} produced the best result for ${metricName} (${valString}).
      </div>
    `;
  }
}
