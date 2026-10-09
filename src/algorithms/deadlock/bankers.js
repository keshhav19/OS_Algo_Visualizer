export function calculateNeed(allocation, max) {
  const numProcesses = allocation.length;
  const numResources = allocation[0]?.length ?? max[0]?.length ?? 0;
  const need = Array.from({ length: numProcesses }, () => Array(numResources).fill(0));

  for (let i = 0; i < numProcesses; i++) {
    for (let j = 0; j < numResources; j++) {
      need[i][j] = max[i][j] - allocation[i][j];
    }
  }

  return need;
}

export function runBankersSafetyAlgorithm(processes, available, allocation, max) {
  const numProcesses = processes.length;
  const numResources = available.length;
  
  const need = calculateNeed(allocation, max);
  const work = [...available];
  const finish = Array(numProcesses).fill(false);
  const safeSequence = [];
  const steps = [];

  let count = 0;
  while (count < numProcesses) {
    let found = false;

    for (let i = 0; i < numProcesses; i++) {
      if (!finish[i]) {
        // Check if Need[i] <= Work
        let canAllocate = true;
        for (let j = 0; j < numResources; j++) {
          if (need[i][j] > work[j]) {
            canAllocate = false;
            break;
          }
        }

        if (canAllocate) {
          const workBefore = [...work];
          const currentNeed = [...need[i]];
          const currentAllocation = [...allocation[i]];

          for (let j = 0; j < numResources; j++) {
            work[j] += allocation[i][j];
          }

          finish[i] = true;
          safeSequence.push(processes[i]);
          
          steps.push({
            process: processes[i],
            workBefore,
            need: currentNeed,
            allocation: currentAllocation,
            workAfter: [...work]
          });

          found = true;
          count++;
        }
      }
    }

    if (!found) {
      break; // Unsafe state
    }
  }

  const isSafe = count === numProcesses;

  return {
    isSafe,
    safeSequence,
    steps,
    need,
    finalWork: work,
    finish
  };
}
