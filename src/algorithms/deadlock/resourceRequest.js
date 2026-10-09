import { calculateNeed, runBankersSafetyAlgorithm } from "./bankers.js";

export function simulateResourceRequest(processIndex, request, processes, available, allocation, max) {
  const numResources = available.length;
  const need = calculateNeed(allocation, max);
  
  // Step 1: Check if Request <= Need
  for (let j = 0; j < numResources; j++) {
    if (request[j] > need[processIndex][j]) {
      return {
        granted: false,
        reason: `Request exceeds its declared maximum claim (Request > Need for resource ${j}).`
      };
    }
  }

  // Step 2: Check if Request <= Available
  for (let j = 0; j < numResources; j++) {
    if (request[j] > available[j]) {
      return {
        granted: false,
        reason: `Resources are not immediately available (Request > Available for resource ${j}). Process must wait.`
      };
    }
  }

  // Step 3: Pretend to allocate
  const tempAvailable = [...available];
  const tempAllocation = allocation.map(row => [...row]);
  
  for (let j = 0; j < numResources; j++) {
    tempAvailable[j] -= request[j];
    tempAllocation[processIndex][j] += request[j];
  }

  // Step 4: Run safety algorithm
  const safetyResult = runBankersSafetyAlgorithm(processes, tempAvailable, tempAllocation, max);

  if (safetyResult.isSafe) {
    return {
      granted: true,
      reason: "Request can be safely granted.",
      safetyResult
    };
  } else {
    return {
      granted: false,
      reason: "Request cannot be granted because the resulting state is unsafe.",
      safetyResult
    };
  }
}
