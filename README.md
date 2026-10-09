# OScope — Operating Systems Algorithm Visualizer

[![Repository](https://img.shields.io/badge/Repository-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/keshhav19/OS_Algo_Visualizer)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-68%20passed-success)
![No Dependencies](https://img.shields.io/badge/dependencies-0-blue)
![JavaScript](https://img.shields.io/badge/language-Vanilla_JS-yellow)

> **Repository:** [github.com/keshhav19/OS_Algo_Visualizer](https://github.com/keshhav19/OS_Algo_Visualizer)

An interactive, textbook-accurate educational platform designed to help computer science students visualize, step through, and compare how core Operating System algorithms execute.

---

## 🎯 Features

The visualizer provides interactive step-by-step simulations and performance comparisons across 5 core OS domains:

- **CPU Scheduling**: FCFS, SJF (Non-preemptive), Priority (Non-preemptive), Round Robin, Multi-Level Queue (MLQ), and Multi-Level Feedback Queue (MLFQ). Features optional context switching overhead and configurable queue parameters.
- **Memory Management**: First Fit, Best Fit, and Worst Fit contiguous memory allocation strategies.
- **Page Replacement**: FIFO, LRU, and Optimal page replacement algorithms with hit/fault tracking.
- **Deadlock Management**: Banker's Algorithm (Safety check), Resource Request simulation, and Deadlock Detection for resource allocation graphs.
- **Disk Scheduling**: FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK with track visualizations and seek analysis.

---

## 💡 Core Workflows

1. **Visualize Mode (Interactive Step-by-Step Execution)**:
   - **Playback Engine**: Play, Pause, Next Step, Previous Step, Skip to End, Reset, and Speed Controls (0.5×, 1×, 2×, 4×).
   - **Step Narratives**: Real-time natural language explanations detailing *why* an algorithm made a specific decision at each step.
   - **Progressive Reveal**: Subdued future states, highlighted active transitions, and final metrics revealed upon completion.

2. **Compare Mode (Comparative Benchmarking)**:
   - Run multiple algorithms within a module simultaneously against the **exact same input workload**.
   - Review automatically generated **Comparison Insights** (e.g., *"SJF produced the best result for average waiting time"*).
   - Visualize trade-offs through responsive comparison charts and structured summary tables.

---

## 🛠 Architecture & Tech Stack

Built entirely with **Vanilla JavaScript (ES Modules), HTML5, and CSS3** with zero runtime dependencies.

- **Design System**: *Algorithmic Precision* (Stitch-inspired layout, deep charcoal palette, indigo accents, monospace data typography, and responsive grid layouts).
- **Pure Algorithm Core**: Algorithmic calculations are completely decoupled from UI rendering, operating as deterministic pure functions in `src/algorithms/`.
- **Test-Driven Reliability**: Comprehensive automated tests verifying textbook calculations and edge cases using Node.js's built-in test runner.

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Optional: Node.js `v20+` (for running the automated test suite)

### Running the Visualizer Locally
Since the application uses native ES Modules, serve it using any local HTTP server:

```bash
# Option 1: Using the npm start script (Python HTTP server)
npm start

# Option 2: Using Python directly
python3 -m http.server 8000

# Option 3: Using Node / npx
npx serve .
```

Then open `http://localhost:8000` (or `http://localhost:4173`) in your web browser.

### Running Automated Tests
Run the complete test suite using Node.js's native test runner:

```bash
npm run test
# or
node --test
```

*Current test suite: 81 tests across 20 suites (0 failures).*

Context-switch overhead is applied after SJF and Priority select the next process at the nominal handoff time. A process that arrives during the switch does not change that selection; the chosen process starts after the switch completes.

---

## 📁 Repository Structure

```
OS-Algorithm-Visualizer/
├── index.html                  # Main application entry point
├── package.json                # Project metadata & npm scripts
├── README.md                   # Project documentation
├── .gitignore                  # Git ignore rules
├── src/
│   ├── main.js                 # App router, shell layout & event coordinator
│   ├── algorithms/             # Pure algorithm implementations
│   │   ├── scheduling/         # CPU scheduling algorithms (FCFS, SJF, Priority, RR, MLQ, MLFQ)
│   │   ├── memory/             # Memory allocation algorithms (First Fit, Best Fit, Worst Fit)
│   │   ├── pageReplacement/    # Page replacement algorithms (FIFO, LRU, Optimal)
│   │   ├── deadlock/           # Deadlock algorithms (Banker's, Request, Detection)
│   │   └── diskScheduling/     # Disk scheduling algorithms (FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK)
│   ├── components/             # Reusable UI components (Gantt, Playback, Charts, Tables)
│   ├── pages/                  # Module page views (Home, CPU, Memory, Page, Deadlock, Disk)
│   ├── styles/
│   │   └── main.css            # Design system tokens, layouts & responsive styling
│   └── utils/                  # Validation helpers, playback engine, comparison engine
└── tests/                      # Automated test suites
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
