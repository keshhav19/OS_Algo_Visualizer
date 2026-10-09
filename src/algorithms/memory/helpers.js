export function initializeBlocks(blockSizes) {
  return blockSizes.map((size, index) => ({
    id: `B${index + 1}`,
    originalSize: Number(size),
    remainingSize: Number(size),
    allocations: []
  }));
}

export function initializeRequests(requestSizes) {
  return requestSizes.map((size, index) => ({
    id: `R${index + 1}`,
    size: Number(size)
  }));
}

export function allocateRequest(block, request) {
  block.remainingSize -= request.size;
  block.allocations.push({
    requestId: request.id,
    requestSize: request.size
  });

  return {
    requestId: request.id,
    requestSize: request.size,
    allocatedBlockId: block.id,
    originalBlockSize: block.originalSize,
    remainingBlockSize: block.remainingSize,
    status: "Allocated"
  };
}

export function createUnallocatedRow(request) {
  return {
    requestId: request.id,
    requestSize: request.size,
    allocatedBlockId: "-",
    originalBlockSize: "-",
    remainingBlockSize: "-",
    status: "Unallocated"
  };
}

export function buildMemoryResult(algorithmId, algorithmName, blocks, requests, allocations) {
  const totalMemory = blocks.reduce((sum, block) => sum + block.originalSize, 0);
  const totalRequestedMemory = requests.reduce((sum, request) => sum + request.size, 0);
  const totalAllocatedMemory = allocations
    .filter((allocation) => allocation.status === "Allocated")
    .reduce((sum, allocation) => sum + allocation.requestSize, 0);
  const allocatedRequests = allocations.filter((allocation) => allocation.status === "Allocated").length;

  return {
    algorithmId,
    algorithmName,
    allocations,
    blocks,
    unallocatedRequests: allocations.filter((allocation) => allocation.status === "Unallocated"),
    summary: {
      totalMemory,
      totalRequestedMemory,
      totalAllocatedMemory,
      allocatedRequests,
      unallocatedRequests: requests.length - allocatedRequests,
      remainingMemory: totalMemory - totalAllocatedMemory
    }
  };
}

export function runMemoryAllocation(blockSizes, requestSizes, algorithm, algorithmId, algorithmName) {
  const blocks = initializeBlocks(blockSizes);
  const requests = initializeRequests(requestSizes);
  const allocations = requests.map((request) => {
    const selectedBlock = algorithm(blocks, request);
    return selectedBlock ? allocateRequest(selectedBlock, request) : createUnallocatedRow(request);
  });

  return buildMemoryResult(algorithmId, algorithmName, blocks, requests, allocations);
}
