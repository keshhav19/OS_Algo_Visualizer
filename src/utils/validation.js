export function validateProcesses(processes, options = {}) {
  const errors = [];
  const seenPids = new Set();

  if (processes.length === 0) {
    errors.push("Add at least one process before running the simulation.");
  } else if (processes.length > 50) {
    errors.push("Use no more than 50 processes.");
  }

  processes.forEach((process, index) => {
    const rowNumber = index + 1;
    const pid = String(process.pid).trim();

    if (pid.length === 0) {
      errors.push(`Row ${rowNumber}: Process ID is required.`);
    } else if (seenPids.has(pid)) {
      errors.push(`Row ${rowNumber}: Process ID "${pid}" is duplicated.`);
    } else {
      seenPids.add(pid);
    }

    if (!isNonNegativeInteger(process.arrivalTime) || Number(process.arrivalTime) > 10000) {
      errors.push(`Row ${rowNumber}: Arrival Time must be a non-negative integer no greater than 10000.`);
    }

    if (!isPositiveInteger(process.burstTime) || Number(process.burstTime) > 10000) {
      errors.push(`Row ${rowNumber}: Burst Time must be a positive integer no greater than 10000.`);
    }

    if (options.requiresPriority && !isInteger(process.priority)) {
      errors.push(`Row ${rowNumber}: Priority must be an integer for Priority scheduling.`);
    }

    if (options.requiresQueueAssignment) {
      if (process.queueId === undefined || process.queueId === "") {
        errors.push(`Row ${rowNumber}: Queue assignment is required for MLQ.`);
      } else if (options.queueConfigs && !options.queueConfigs.some(q => String(q.id) === String(process.queueId))) {
        errors.push(`Row ${rowNumber}: Assigned queue ID "${process.queueId}" does not exist.`);
      }
    }
  });

  if (options.requiresQuantum && (!isPositiveInteger(options.timeQuantum) || Number(options.timeQuantum) > 10000)) {
    errors.push("Time Quantum must be a positive integer no greater than 10000 for Round Robin.");
  }

  return errors;
}

export function parsePositiveIntegerList(value, label) {
  const errors = [];
  const rawItems = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const numbers = [];

  if (rawItems.length === 0 || rawItems.every((item) => item.length === 0)) {
    errors.push(`${label} input cannot be empty.`);
    return { values: [], errors };
  }

  if (rawItems.length > 100) {
    errors.push(`${label} must contain no more than 100 items.`);
  }

  rawItems.forEach((item, index) => {
    if (!isPositiveInteger(item) || Number(item) > 1000000) {
      errors.push(`${label} item ${index + 1} must be a positive integer no greater than 1000000.`);
    } else {
      numbers.push(Number(item));
    }
  });

  return {
    values: errors.length === 0 ? numbers : [],
    errors
  };
}

export function parseNonNegativeIntegerSequence(value, label) {
  const errors = [];
  const rawItems = String(value)
    .trim()
    .split(/[\s,]+/)
    .filter((item) => item.length > 0);
  const numbers = [];

  if (rawItems.length === 0) {
    errors.push(`${label} input cannot be empty.`);
    return { values: [], errors };
  }

  rawItems.forEach((item, index) => {
    if (!isNonNegativeInteger(item)) {
      errors.push(`${label} item ${index + 1} must be a non-negative integer.`);
    } else {
      numbers.push(Number(item));
    }
  });

  return {
    values: errors.length === 0 ? numbers : [],
    errors
  };
}

export function validatePositiveIntegerValue(value, label) {
  return isPositiveInteger(value) ? [] : [`${label} must be a positive integer.`];
}

export function isInteger(value) {
  if (typeof value === "number") {
    return Number.isSafeInteger(value);
  }
  return typeof value === "string" && /^-?\d+$/.test(value) && Number.isSafeInteger(Number(value));
}

export function isNonNegativeInteger(value) {
  return isInteger(value) && Number(value) >= 0 && !(typeof value === "string" && value.startsWith("-"));
}

export function isPositiveInteger(value) {
  return isInteger(value) && Number(value) > 0;
}

export function validateQueueConfigs(queueConfigs) {
  const errors = [];
  
  if (!queueConfigs || queueConfigs.length < 2) {
    errors.push("At least 2 queues are required.");
    return errors;
  }
  
  const seenIds = new Set();
  const seenPriorities = new Set();
  
  queueConfigs.forEach((q, index) => {
    const rowNumber = index + 1;
    
    if (q.id === undefined || String(q.id).trim() === "") {
      errors.push(`Queue ${rowNumber}: Queue ID is required.`);
    } else if (seenIds.has(String(q.id))) {
      errors.push(`Queue ${rowNumber}: Queue ID "${q.id}" is duplicated.`);
    } else {
      seenIds.add(String(q.id));
    }
    
    if (!isInteger(q.priority)) {
      errors.push(`Queue ${rowNumber}: Priority must be an integer.`);
    } else if (seenPriorities.has(Number(q.priority))) {
      errors.push(`Queue ${rowNumber}: Priority ${q.priority} is duplicated. Queues must have unique priorities.`);
    } else {
      seenPriorities.add(Number(q.priority));
    }
    
    if (q.algorithm === "rr" && (!isPositiveInteger(q.timeQuantum) || Number(q.timeQuantum) > 10000)) {
      errors.push(`Queue ${rowNumber}: Time Quantum must be a positive integer no greater than 10000 for Round Robin.`);
    }
  });
  
  return errors;
}

export function validateBankersInput(allocation, max, available) {
  const errors = [];
  const numProcesses = allocation.length;
  const numResources = available.length;

  if (numProcesses < 1 || numResources < 1) errors.push("Banker's Algorithm requires at least one process and one resource.");
  if (numProcesses > 10 || numResources > 10) errors.push("Banker's Algorithm supports at most 10 processes and 10 resources.");
  if (!Array.isArray(max) || max.length !== numProcesses) errors.push("Allocation and Max matrices must have the same number of processes.");

  for (let j = 0; j < numResources; j++) {
    if (!isNonNegativeInteger(available[j])) {
      errors.push(`Available resource ${j} must be a non-negative integer.`);
    }
  }

  for (let i = 0; i < numProcesses; i++) {
    for (let j = 0; j < numResources; j++) {
      if (!isNonNegativeInteger(allocation[i]?.[j])) {
        errors.push(`Process P${i} Allocation resource ${j} must be a non-negative integer.`);
      }
      if (!isNonNegativeInteger(max?.[i]?.[j])) {
        errors.push(`Process P${i} Max resource ${j} must be a non-negative integer.`);
      }
      if (isNonNegativeInteger(allocation[i]?.[j]) && isNonNegativeInteger(max?.[i]?.[j])) {
        if (Number(allocation[i][j]) > Number(max[i][j])) {
          errors.push(`Process P${i} Allocation resource ${j} cannot exceed Max claim.`);
        }
      }
    }
  }

  return errors;
}

export function validateDetectionInput(allocation, request, available) {
  const errors = [];
  const numProcesses = allocation.length;
  const numResources = available.length;

  if (numProcesses < 1 || numResources < 1) errors.push("Deadlock Detection requires at least one process and one resource.");
  if (numProcesses > 10 || numResources > 10) errors.push("Deadlock Detection supports at most 10 processes and 10 resources.");
  if (!Array.isArray(request) || request.length !== numProcesses) errors.push("Allocation and Request matrices must have the same number of processes.");

  for (let j = 0; j < numResources; j++) {
    if (!isNonNegativeInteger(available[j])) {
      errors.push(`Available resource ${j} must be a non-negative integer.`);
    }
  }

  for (let i = 0; i < numProcesses; i++) {
    for (let j = 0; j < numResources; j++) {
      if (!isNonNegativeInteger(allocation[i]?.[j])) {
        errors.push(`Process P${i} Allocation resource ${j} must be a non-negative integer.`);
      }
      if (!isNonNegativeInteger(request?.[i]?.[j])) {
        errors.push(`Process P${i} Request resource ${j} must be a non-negative integer.`);
      }
    }
  }

  return errors;
}

export function validateResourceRequestInput(request, availableLength) {
  const errors = [];
  if (request.length !== availableLength) {
    errors.push("Resource request length does not match number of resources.");
  }
  for (let j = 0; j < request.length; j++) {
    if (!isNonNegativeInteger(request[j])) {
      errors.push(`Request resource ${j} must be a non-negative integer.`);
    }
  }
  return errors;
}
