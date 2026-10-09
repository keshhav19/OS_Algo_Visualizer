let activeTimer = null;

export const playbackEngine = {
  play(state, rerender) {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }
    if (state.playback.isPlaying || state.playback.currentStep >= state.playback.totalSteps) return;
    state.playback.isPlaying = true;
    rerender();
    
    activeTimer = setInterval(() => {
      if (state.playback.currentStep < state.playback.totalSteps) {
        state.playback.currentStep++;
        rerender();
      }
      if (state.playback.currentStep >= state.playback.totalSteps) {
        this.pause(state, rerender);
      }
    }, state.playback.speedMs);
  },

  pause(state, rerender) {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }
    if (!state.playback.isPlaying) return;
    state.playback.isPlaying = false;
    rerender();
  },

  toggle(state, rerender) {
    if (state.playback.isPlaying) {
      this.pause(state, rerender);
    } else {
      this.play(state, rerender);
    }
  },

  next(state, rerender) {
    this.pause(state, () => {});
    if (state.playback.currentStep < state.playback.totalSteps) {
      state.playback.currentStep++;
    }
    rerender();
  },

  prev(state, rerender) {
    this.pause(state, () => {});
    if (state.playback.currentStep > 0) {
      state.playback.currentStep--;
    }
    rerender();
  },

  reset(state, rerender) {
    this.pause(state, () => {});
    state.playback.currentStep = 0;
    rerender();
  },

  skipToEnd(state, rerender) {
    this.pause(state, () => {});
    state.playback.currentStep = state.playback.totalSteps;
    rerender();
  },

  setSpeed(state, speedMs, rerender) {
    state.playback.speedMs = speedMs;
    if (state.playback.isPlaying) {
      this.pause(state, () => {});
      this.play(state, rerender);
    } else {
      rerender();
    }
  },

  cleanup() {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }
  }
};
