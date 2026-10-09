export function runDeadlockDetection(processes, available, allocation, request) {
  const numProcesses = processes.length;
  const numResources = available.length;
  
  const work = [...available];
  const finish = Array(numProcesses).fill(false);
  const steps = [];

  for (let i = 0; i < numProcesses; i++) {
    let hasResources = false;
    for (let j = 0; j < numResources; j++) {
      if (allocation[i][j] > 0) {
        hasResources = true;
        break;
      }
    }
    if (!hasResources) {
      finish[i] = true;
    }
  }

  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;

    for (let i = 0; i < numProcesses; i++) {
      if (!finish[i]) {
        let canSatisfy = true;
        for (let j = 0; j < numResources; j++) {
          if (request[i][j] > work[j]) {
            canSatisfy = false;
            break;
          }
        }

        if (canSatisfy) {
          const workBefore = [...work];
          for (let j = 0; j < numResources; j++) {
            work[j] += allocation[i][j];
          }
          
          steps.push({
            process: processes[i],
            workBefore,
            allocation: [...allocation[i]],
            request: [...request[i]],
            workAfter: [...work]
          });

          finish[i] = true;
          madeProgress = true;
        }
      }
    }
  }

  const deadlockedProcesses = [];
  const completedProcesses = [];

  for (let i = 0; i < numProcesses; i++) {
    if (finish[i]) {
      completedProcesses.push(processes[i]);
    } else {
      deadlockedProcesses.push(processes[i]);
    }
  }

  const hasDeadlock = deadlockedProcesses.length > 0;

  return {
    hasDeadlock,
    deadlockedProcesses,
    completedProcesses,
    finishStatus: finish,
    workVector: work,
    steps // Added steps for playback
  };
}
