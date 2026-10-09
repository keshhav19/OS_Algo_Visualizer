const explanations = {
  // CPU
  fcfs: {
    what: "First-Come, First-Served is the simplest scheduling algorithm.",
    how: "Processes are executed in the exact order they arrive in the ready queue. It is non-preemptive.",
    watch: "Notice how long processes can delay all subsequent short processes (the convoy effect).",
    adv: ["Simple to implement", "No starvation"],
    lim: ["Poor average waiting time", "Convoy effect"],
    complexity: "O(1) scheduling overhead"
  },
  sjf: {
    what: "Shortest Job First prioritizes processes with the shortest burst time.",
    how: "When the CPU is free, it selects the process from the ready queue that requires the least CPU time.",
    watch: "Notice how short processes jump ahead of long ones, minimizing average waiting time.",
    adv: ["Optimal average waiting time for a given set of processes"],
    lim: ["Requires knowing burst times in advance", "Can starve long processes"],
    complexity: "O(n) or O(log n) depending on ready queue structure"
  },
  priority: {
    what: "Priority scheduling executes processes based on an assigned priority number.",
    how: "The CPU selects the highest-priority process from the ready queue. Lower numbers represent higher priority.",
    watch: "Notice how low-priority processes may have to wait indefinitely if high-priority processes keep arriving.",
    adv: ["Important tasks get processed quickly"],
    lim: ["Starvation of low-priority processes (requires aging to fix)"],
    complexity: "O(n) or O(log n) to find the highest priority"
  },
  roundRobin: {
    what: "Round Robin is a preemptive scheduling algorithm designed for time-sharing.",
    how: "Each process gets a small unit of CPU time (time quantum). After this time, it is preempted and moved to the back of the queue.",
    watch: "Notice the frequent context switches and how all processes make steady, fair progress.",
    adv: ["Fairness", "Good response time for interactive systems"],
    lim: ["High context switching overhead if quantum is too small", "Poor average turnaround time"],
    complexity: "O(1) overhead per switch"
  },
  mlq: {
    what: "Multi-Level Queue permanently assigns processes to different queues based on their type.",
    how: "Each queue has its own scheduling algorithm. Queues are strictly prioritized; a lower queue cannot execute unless higher queues are empty.",
    watch: "Notice how processes in lower queues wait completely until all processes in higher queues finish.",
    adv: ["Allows tailored scheduling for different process types (e.g., system vs. user)"],
    lim: ["Inflexible (processes cannot move)", "Lower queues can suffer starvation"],
    complexity: "O(1) to pick the highest non-empty queue"
  },
  mlfq: {
    what: "Multi-Level Feedback Queue is a complex, dynamic scheduling algorithm.",
    how: "Processes start in the highest priority queue. If they use their full time quantum, they are demoted to a lower queue.",
    watch: "Notice how newly arriving processes preempt long-running ones, and how CPU-bound processes sink to the bottom.",
    adv: ["Favors short interactive jobs", "Adapts to process behavior dynamically"],
    lim: ["Complex to configure", "Can still suffer from starvation without periodic boosting"],
    complexity: "O(1) to manage if queues are well-implemented"
  },

  // Memory
  firstFit: {
    what: "First Fit allocates the first available memory block that is large enough.",
    how: "It scans the memory blocks from the beginning and stops at the first block that can hold the request.",
    watch: "Notice how early memory blocks become heavily fragmented, while later blocks remain untouched.",
    adv: ["Fast and simple", "Tends to leave large blocks at the end untouched"],
    lim: ["External fragmentation", "Search time increases as memory fills up"],
    complexity: "O(n) per request"
  },
  bestFit: {
    what: "Best Fit allocates the smallest available block that is large enough.",
    how: "It scans all available memory blocks and selects the one that leaves the smallest remaining hole.",
    watch: "Notice how it tightly packs requests but leaves behind tiny, unusable fragments of free space.",
    adv: ["Minimizes wasted space within the allocated block (internal fragmentation)"],
    lim: ["Creates very small external fragments", "Slower because it must search all blocks"],
    complexity: "O(n) per request"
  },
  worstFit: {
    what: "Worst Fit allocates the largest available memory block.",
    how: "It scans all memory blocks and selects the one with the most available space.",
    watch: "Notice how it actively breaks up large free blocks, often preventing future large requests from being satisfied.",
    adv: ["Remaining fragments are larger and more likely to be usable"],
    lim: ["Destroys large contiguous free blocks quickly", "Requires searching all blocks"],
    complexity: "O(n) per request"
  },

  // Page Replacement
  fifo: {
    what: "First-In, First-Out replaces the oldest page in memory.",
    how: "It maintains a queue of pages in memory. When a fault occurs, the page at the front of the queue is replaced.",
    watch: "Notice how it completely ignores how often or how recently a page was used.",
    adv: ["Very simple to implement", "Low overhead"],
    lim: ["Poor performance", "Susceptible to Belady's Anomaly (more frames = more faults)"],
    complexity: "O(1) replacement"
  },
  lru: {
    what: "Least Recently Used replaces the page that has not been accessed for the longest time.",
    how: "It tracks the time of last access for each page. When a fault occurs, it replaces the page with the oldest access time.",
    watch: "Notice how pages that are repeatedly accessed stay safely in memory.",
    adv: ["Excellent approximation of optimal behavior", "Does not suffer from Belady's Anomaly"],
    lim: ["High hardware/software overhead to track access times"],
    complexity: "O(1) with complex hardware, or O(n) in software"
  },
  optimal: {
    what: "Optimal (MIN) replaces the page that will not be used for the longest time in the future.",
    how: "It looks ahead in the reference string to see which current page's next use is furthest away.",
    watch: "Notice how it makes perfect decisions, resulting in the absolute minimum number of page faults.",
    adv: ["Lowest possible page fault rate", "Used as a benchmark for other algorithms"],
    lim: ["Impossible to implement in real systems (requires predicting the future)"],
    complexity: "O(n) looking ahead"
  },

  // Deadlock
  bankers: {
    what: "Banker's Algorithm tests whether allocating resources will leave the system in a safe state.",
    how: "It simulates allocation based on maximum possible claims. If it can find a sequence where all processes can finish (a Safe Sequence), the state is safe.",
    watch: "Watch the Need matrix and Work vector. A process only completes if Need ≤ Work.",
    adv: ["Prevents deadlocks completely"],
    lim: ["Requires knowing maximum resource needs in advance", "Conservative (may reject safe requests)"],
    complexity: "O(m * n^2) where m=resources, n=processes"
  },
  detection: {
    what: "Deadlock Detection evaluates current allocations and requests to see if a deadlock already exists.",
    how: "It finds processes whose current requests can be satisfied by currently available resources, assumes they finish and release their resources, and repeats.",
    watch: "Notice which processes get stuck. If any processes cannot finish, the system is deadlocked.",
    adv: ["Does not require knowing maximum needs", "Allows higher resource utilization"],
    lim: ["Does not prevent deadlock", "High overhead if run frequently"],
    complexity: "O(m * n^2)"
  },

  // Disk Scheduling
  fcfs_disk: {
    what: "First-Come, First-Served processes disk requests in the exact order they arrive.",
    how: "The disk head moves directly to the next cylinder in the request queue, regardless of its position.",
    watch: "Notice the wild swings across the disk if requests are far apart.",
    adv: ["Fair", "Simple to implement"],
    lim: ["Very inefficient", "High total head movement"],
    complexity: "O(1) overhead"
  },
  sstf: {
    what: "Shortest Seek Time First selects the request closest to the current head position.",
    how: "It calculates the distance to all pending requests and moves to the closest one.",
    watch: "Notice how it efficiently clears clusters of requests, but may ignore distant requests completely.",
    adv: ["Substantially reduces total head movement compared to FCFS"],
    lim: ["Can cause starvation for requests at the edges of the disk"],
    complexity: "O(n) search per step"
  },
  scan: {
    what: "SCAN (Elevator) sweeps the disk head back and forth across the entire disk.",
    how: "The head moves in one direction, servicing requests until it hits the physical boundary (0 or diskSize-1), then reverses.",
    watch: "Notice that it always touches the edge of the disk before turning around.",
    adv: ["Prevents starvation", "Good performance under heavy load"],
    lim: ["Unnecessary movement to the edge even if no requests are there"],
    complexity: "O(n log n) initial sort"
  },
  cscan: {
    what: "C-SCAN (Circular SCAN) sweeps the disk in only one direction.",
    how: "When the head reaches the physical boundary, it jumps immediately back to the opposite boundary without servicing requests on the return trip.",
    watch: "Notice the circular jump. This provides a more uniform wait time than SCAN.",
    adv: ["More uniform wait times", "Fairer to requests at the edges"],
    lim: ["The long jump adds some overhead"],
    complexity: "O(n log n) initial sort"
  },
  look: {
    what: "LOOK is an optimized version of the SCAN elevator algorithm.",
    how: "It moves in one direction servicing requests, but reverses direction immediately after the last request instead of going all the way to the edge.",
    watch: "Notice how the head turns around precisely at the furthest request.",
    adv: ["Saves time by not moving to empty edges"],
    lim: ["Still has slightly uneven wait times for edge requests"],
    complexity: "O(n log n) initial sort"
  },
  clook: {
    what: "C-LOOK is an optimized version of C-SCAN.",
    how: "It sweeps in one direction, but upon reaching the last request in that direction, it jumps directly to the furthest request on the opposite end.",
    watch: "Notice that both the sweeping and jumping are bounded entirely by the requests, ignoring physical edges.",
    adv: ["Best combination of uniform wait times and efficiency"],
    lim: ["Slightly more complex to implement than basic SCAN"],
    complexity: "O(n log n) initial sort"
  }
};

export function renderExplanationCard(algorithmId, moduleType) {
  let key = algorithmId;
  if (moduleType === "disk" && key === "fcfs") key = "fcfs_disk";
  if (moduleType === "deadlock") {
     // Special case since deadlock tabs aren't typical algorithms in a dropdown
     key = algorithmId;
  }

  const exp = explanations[key];
  if (!exp) return "";

  return `
    <div class="explanation-card">
      <div style="margin-bottom: 12px;">
        <strong>What is it?</strong>
        <p style="margin: 4px 0 0 0">${exp.what}</p>
      </div>
      <div style="margin-bottom: 12px;">
        <strong>How does it work?</strong>
        <p style="margin: 4px 0 0 0">${exp.how}</p>
      </div>
      <div style="margin-bottom: 12px;">
        <strong>What should I watch for?</strong>
        <p style="margin: 4px 0 0 0">${exp.watch}</p>
      </div>
      <div style="display: flex; gap: 16px; margin-bottom: 12px;">
        <div style="flex: 1;">
          <strong>Advantages</strong>
          <ul style="margin: 4px 0 0 0; padding-left: 16px; color: var(--success-dark)">
            ${exp.adv.map(a => `<li>${a}</li>`).join("")}
          </ul>
        </div>
        <div style="flex: 1;">
          <strong>Limitations</strong>
          <ul style="margin: 4px 0 0 0; padding-left: 16px; color: var(--danger-dark)">
            ${exp.lim.map(l => `<li>${l}</li>`).join("")}
          </ul>
        </div>
      </div>
      <div>
        <strong>Complexity:</strong> <span>${exp.complexity}</span>
      </div>
    </div>
  `;
}
