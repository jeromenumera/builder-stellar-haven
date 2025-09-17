export function haptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

let audioCtx: AudioContext | null = null;
export function beep(frequency = 660, duration = 60) {
  try {
    // Safari/iOS: AudioContext must be created on user gesture; if fails, ignore
    // Create once
    //@ts-ignore
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = frequency;
    gain.gain.value = 0.03; // subtle
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    }, duration);
  } catch {}
}

export function feedback() {
  haptic();
  beep();
}
