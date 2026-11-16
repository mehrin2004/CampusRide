// Web Audio API Synthesizer for CampusRide App Sound Effects
// Works cross-platform without external audio file dependencies.

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Play a realistic dual-tone bus horn honk
 */
export const playBusHorn = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Bus horn primary frequencies (low & mid brassy notes)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(320, now);
    osc2.frequency.setValueAtTime(425, now);

    // Filter to give bus horn resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    // Envelope for double honk feel
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.26);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 0.52);
    osc2.stop(now + 0.52);
  } catch (err) {
    console.warn('Audio play error:', err);
  }
};

/**
 * Play engine start/rev sound effect
 */
export const playEngineSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.6);

    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch (err) {
    console.warn('Engine sound error:', err);
  }
};

/**
 * Play sleek mobile app action chime
 */
export const playAppChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.warn('App chime error:', err);
  }
};

let repeatingInterval = null;

/**
 * Start playing bus horn sound repeatedly at regular intervals (default every 6 seconds)
 */
export const startRepeatingBusHorn = (intervalMs = 6000) => {
  stopRepeatingBusHorn();
  playBusHorn();
  repeatingInterval = setInterval(() => {
    playBusHorn();
  }, intervalMs);
};

/**
 * Stop repeating bus horn sound
 */
export const stopRepeatingBusHorn = () => {
  if (repeatingInterval) {
    clearInterval(repeatingInterval);
    repeatingInterval = null;
  }
};
