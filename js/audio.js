/* Bake or Bust! — all sound is synthesized with WebAudio. */
(function () {
  'use strict';
  const A = (window.SFX = {});
  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  let muted = false, musicOn = true, heat = 0, tensionBus = null, hidden = false;
  let mood = null, nextStep = 0, step = 0, timer = null, song = null;

  try {
    muted = localStorage.getItem('bb_muted') === '1';
    musicOn = localStorage.getItem('bb_music') !== '0';
  } catch (e) { /* storage unavailable */ }

  A.isMuted = () => muted;
  A.isMusicOn = () => musicOn;

  A.init = function () {
    if (ctx) {
      if (!hidden && (ctx.state === 'suspended' || ctx.state === 'interrupted')) ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = 0; master.connect(comp);
    master.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.03);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0; sfxBus.connect(master);
    sfxBus.gain.setTargetAtTime(0.7, ctx.currentTime, 0.03);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    musicBus.gain.setTargetAtTime(musicOn && !hidden ? 0.2 : 0, ctx.currentTime, 0.1);
    tensionBus = ctx.createGain(); tensionBus.gain.value = 0; tensionBus.connect(musicBus);
    A.setHeat(heat);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (mood) startScheduler();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  };

  A.setMuted = function (m) {
    muted = m;
    try { localStorage.setItem('bb_muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.85, ctx.currentTime, 0.03);
  };
  A.setMusic = function (on) {
    musicOn = on;
    try { localStorage.setItem('bb_music', on ? '1' : '0'); } catch (e) { /* ignore */ }
    if (musicBus) musicBus.gain.setTargetAtTime(on && !hidden ? 0.2 : 0, ctx.currentTime, 0.1);
  };

  A.setHidden = function (value) {
    hidden = !!value;
    if (!ctx) return;
    // Stop scheduling while hidden; fade already-scheduled notes at the bus.
    if (musicBus) musicBus.gain.setTargetAtTime(musicOn && !hidden ? 0.2 : 0, ctx.currentTime, 0.03);
    if (!hidden) { nextStep = ctx.currentTime + 0.1; A.init(); }
  };

  A.setHeat = function (ratio) {
    heat = Math.max(0, Math.min(1, Number(ratio) || 0));
    const tension = Math.max(0, (heat - 0.6) / 0.4);
    if (tensionBus) tensionBus.gain.setTargetAtTime(tension, ctx.currentTime, 0.12);
  };

  function ok() { return ctx && ctx.state === 'running' && !muted && !hidden; }

  function envelope(g, t0, dur, vol, attack) {
    // A source can start on the sample just BEFORE its fractional start time.
    // Silence the gain's default value too, or noise leaks a full-volume sample.
    const gain = g.gain;
    gain.value = 0;
    gain.setValueAtTime(0, t0);
    const rise = new Float32Array(33);
    for (let i = 0; i < rise.length; i++) rise[i] = vol * (0.5 - 0.5 * Math.cos(Math.PI * i / (rise.length - 1)));
    gain.setValueCurveAtTime(rise, t0, Math.min(attack, dur * 0.5));
    // Keep the original decay, then reach actual zero before stopping the source.
    gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const end = t0 + dur + 0.005;
    gain.linearRampToValueAtTime(0, end);
    return end;
  }

  function tone(o) {
    const t0 = o.at == null ? ctx.currentTime + (o.t || 0) : o.at;
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + (o.slide || o.dur));
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    const vol = o.vol == null ? 0.25 : o.vol;
    const dur = o.dur || 0.15;
    const end = envelope(g, t0, dur, vol, o.attack || 0.006);
    let node = osc;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g);
    g.connect(o.bus || sfxBus);
    osc.onended = () => { osc.disconnect(); if (node !== osc) node.disconnect(); g.disconnect(); };
    osc.start(t0); osc.stop(end);
  }

  function noise(o) {
    const t0 = o.at == null ? ctx.currentTime + (o.t || 0) : o.at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t0);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    const vol = o.vol == null ? 0.25 : o.vol;
    const end = envelope(g, t0, o.dur, vol, o.attack || 0.01);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.onended = () => { src.disconnect(); f.disconnect(); g.disconnect(); };
    src.start(t0, Math.random() * 0.5); src.stop(end);
  }

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  const S = {
    click() { tone({ type: 'triangle', f: 880, f2: 660, dur: 0.06, vol: 0.12 }); },
    hover() { tone({ type: 'sine', f: 1200, dur: 0.03, vol: 0.04 }); },
    draw(n) {
      const f = midi(64 + Math.min(n, 14) * 1.5);
      tone({ type: 'triangle', f: f * 0.7, f2: f, dur: 0.12, vol: 0.22, slide: 0.05 });
      noise({ f: 2400, dur: 0.06, vol: 0.06, q: 2 });
    },
    egg(type) {
      type=window.BB && window.BB.EGGS[type] ? window.BB.baseEgg(type) : type;
      // Short signatures leave space for the draw sound and each egg's effect.
      const notes = { yolk: [79, 83, 86], frost: [96, 91, 84], clover: [76, 81, 88],
        butter:[76,80,83],honey:[79,86,88],cinnamon:[70,74,82],echo:[84,84,91],meringue:[95,91,88],
        pepper: [69, 70, 81], moon: [84, 91, 95], thunder: [48, 60, 66], phoenix: [72, 79, 88, 96] }[type];
      if (!notes) return;
      notes.forEach((n, i) => tone({ type: type === 'pepper' || type === 'thunder' ? 'triangle' : 'sine',
        f: midi(n), dur: 0.16, vol: 0.07, attack: 0.012, t: i * 0.045 }));
    },
    shudder() {
      [0, 0.085].forEach((t) => tone({ type: 'sine', f: 85, f2: 48, dur: 0.09, vol: 0.15, attack: 0.015, t }));
      noise({ f: 240, f2: 100, dur: 0.16, vol: 0.08, attack: 0.025, filter: 'lowpass' });
    },
    plop() { tone({ type: 'sine', f: 300, f2: 120, dur: 0.12, vol: 0.25 }); },
    sizzle(heat) { noise({ f: 3000 + heat * 400, dur: 0.25 + heat * 0.04, vol: 0.05 + heat * 0.012, q: 0.8, filter: 'highpass' }); },
    cool() { [0, 1, 2].forEach((i) => tone({ type: 'sine', f: midi(88 - i * 4), dur: 0.2, vol: 0.08, t: i * 0.05 })); },
    warn() { tone({ type: 'square', f: 1320, dur: 0.05, vol: 0.05, lp: 3000 }); tone({ type: 'square', f: 1320, dur: 0.05, vol: 0.05, t: 0.09, lp: 3000 }); },
    burn() {
      noise({ f: 900, f2: 120, dur: 0.9, vol: 0.5, q: 0.7, filter: 'lowpass' });
      tone({ type: 'sawtooth', f: 160, f2: 40, dur: 0.7, vol: 0.25, lp: 600 });
      tone({ type: 'sine', f: 90, f2: 30, dur: 0.6, vol: 0.4 });
    },
    success() { [60, 64, 67, 72, 76].forEach((n, i) => tone({ type: 'triangle', f: midi(n + 12), dur: 0.25, vol: 0.16, t: i * 0.07 })); tone({ type: 'sine', f: midi(84), dur: 0.5, vol: 0.1, t: 0.35 }); },
    fail() { [67, 63, 60, 55].forEach((n, i) => tone({ type: 'square', f: midi(n), dur: 0.22, vol: 0.07, t: i * 0.13, lp: 1400 })); },
    coin(i) { const t = (i || 0) * 0.05; tone({ type: 'square', f: 1568, dur: 0.06, vol: 0.06, t, lp: 5000 }); tone({ type: 'square', f: 2093, dur: 0.12, vol: 0.06, t: t + 0.05, lp: 5000 }); },
    cluck() {
      [0, 0.13, 0.22].forEach((t, i) => {
        tone({ type: 'sawtooth', f: 520 + i * 60, f2: 300, dur: 0.09, vol: 0.12, t, lp: 1800 });
        noise({ f: 1500, dur: 0.05, vol: 0.05, t, q: 3 });
      });
    },
    bawk() { tone({ type: 'sawtooth', f: 400, f2: 900, dur: 0.18, vol: 0.12, lp: 2000, slide: 0.08 }); tone({ type: 'sawtooth', f: 900, f2: 350, dur: 0.25, vol: 0.12, t: 0.15, lp: 2000 }); },
    magic() { for (let i = 0; i < 6; i++) tone({ type: 'sine', f: midi(79 + [0, 4, 7, 11, 14, 19][i]), dur: 0.35, vol: 0.07, t: i * 0.04 }); },
    peek() { tone({ type: 'sine', f: midi(76), f2: midi(88), dur: 0.3, vol: 0.1 }); tone({ type: 'triangle', f: midi(83), dur: 0.3, vol: 0.06, t: 0.08 }); },
    toss() { noise({ f: 800, f2: 3000, dur: 0.2, vol: 0.12, q: 1.5 }); },
    thunder() { noise({ f: 400, f2: 80, dur: 0.6, vol: 0.35, filter: 'lowpass' }); tone({ type: 'square', f: 220, f2: 55, dur: 0.3, vol: 0.08, lp: 900 }); },
    phoenix() { for (let i = 0; i < 8; i++) tone({ type: 'triangle', f: midi(72 + i * 2), dur: 0.2, vol: 0.09, t: i * 0.035 }); noise({ f: 2000, f2: 6000, dur: 0.5, vol: 0.15 }); },
    shuffle() { noise({ f: 1200, f2: 2600, dur: 0.12, vol: 0.08, q: 2 }); },
    reveal(good) { if (good) S.success(); else S.fail(); },
    buy() { S.coin(0); tone({ type: 'triangle', f: midi(79), dur: 0.15, vol: 0.12, t: 0.08 }); },
    deny() { tone({ type: 'square', f: 180, dur: 0.12, vol: 0.08, lp: 800 }); },
    heal() { [72, 76, 79].forEach((n, i) => tone({ type: 'sine', f: midi(n), dur: 0.3, vol: 0.12, t: i * 0.08 })); },
    hurt() { tone({ type: 'square', f: 300, f2: 90, dur: 0.3, vol: 0.12, lp: 1200 }); },
    whoosh() { noise({ f: 500, f2: 2500, dur: 0.3, vol: 0.1, q: 0.8 }); },
    step() { noise({ f: 300, dur: 0.05, vol: 0.06, filter: 'lowpass' }); },
    fanfare() {
      const seq = [[72, 0], [72, 0.12], [72, 0.24], [76, 0.36], [79, 0.6], [76, 0.78], [79, 0.9], [84, 1.1]];
      seq.forEach(([n, t]) => { tone({ type: 'square', f: midi(n), dur: 0.22, vol: 0.07, t, lp: 3000 }); tone({ type: 'triangle', f: midi(n - 12), dur: 0.25, vol: 0.1, t }); });
      tone({ type: 'sine', f: midi(60), dur: 1.4, vol: 0.12, t: 1.1 });
    },
    gameover() { [64, 63, 62, 61].forEach((n, i) => tone({ type: 'triangle', f: midi(n), dur: i === 3 ? 1.0 : 0.35, vol: 0.14, t: i * 0.38 })); },
    boss() { tone({ type: 'sawtooth', f: midi(45), dur: 1.0, vol: 0.15, lp: 700 }); tone({ type: 'sawtooth', f: midi(52), dur: 1.0, vol: 0.1, lp: 700, t: 0.02 }); noise({ f: 200, dur: 1.0, vol: 0.2, filter: 'lowpass' }); },
  };

  A.play = function (name, arg) {
    if (!ok() || !S[name]) return;
    try { S[name](arg); } catch (e) { /* ignore audio glitches */ }
  };

  // ---------------------------------------------------------------- Music
  // Tiny procedural tracker: chord progression + bass + arpeggio + a seeded melody.
  const SONGS = {
    title: { bpm: 96, root: 60, prog: [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M']], seed: 3, drums: false, lead: 'triangle' },
    road: { bpm: 108, root: 62, prog: [[0, 'M'], [5, 'M'], [9, 'm'], [7, 'M']], seed: 11, drums: true, lead: 'triangle' },
    woods: { bpm: 100, root: 57, prog: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], seed: 21, drums: true, lead: 'sine' },
    castle: { bpm: 112, root: 55, prog: [[0, 'm'], [5, 'm'], [8, 'M'], [7, 'M']], seed: 31, drums: true, lead: 'square' },
    bake: { bpm: 124, root: 60, prog: [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M']], seed: 41, drums: true, lead: 'triangle' },
    den: { bpm: 132, root: 58, prog: [[0, 'm'], [0, 'm'], [5, 'm'], [7, 'M']], seed: 51, drums: true, lead: 'square', swing: true },
    boss: { bpm: 138, root: 57, prog: [[0, 'm'], [8, 'M'], [10, 'M'], [7, 'M']], seed: 61, drums: true, lead: 'sawtooth' },
    win: { bpm: 112, root: 60, prog: [[0, 'M'], [5, 'M'], [7, 'M'], [0, 'M']], seed: 71, drums: true, lead: 'triangle' },
    lose: { bpm: 72, root: 57, prog: [[0, 'm'], [5, 'm'], [3, 'M'], [7, 'M']], seed: 81, drums: false, lead: 'sine' },
  };

  function buildSong(def) {
    // seeded melody over 4 bars x 16 steps
    let s = def.seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const minor = def.prog[0][1] === 'm';
    const scale = minor ? [0, 3, 5, 7, 10, 12, 15, 17] : [0, 2, 4, 7, 9, 12, 14, 16];
    const mel = [];
    let idx = 3;
    for (let i = 0; i < 64; i++) {
      const strong = i % 4 === 0;
      if ((strong && rnd() < 0.85) || (!strong && i % 2 === 0 && rnd() < 0.35)) {
        idx = Math.max(0, Math.min(scale.length - 1, idx + Math.round((rnd() - 0.5) * 4)));
        mel.push(scale[idx]);
      } else mel.push(null);
    }
    return Object.assign({ mel }, def);
  }

  function scheduleStep(t) {
    const d = song;
    const spb = 60 / d.bpm / 4; // 16th
    const bar = Math.floor(step / 16) % 4;
    const st = step % 16;
    const [deg, q] = d.prog[bar];
    const triad = q === 'm' ? [0, 3, 7] : [0, 4, 7];
    const root = d.root + deg;
    const sw = d.swing && st % 2 === 1 ? spb * 0.25 : 0;
    // bass
    if (st === 0 || st === 8 || (d.drums && st === 14)) tone({ type: 'triangle', f: midi(root - 24), dur: spb * 3.5, vol: 0.28, at: t, bus: musicBus });
    // arpeggio
    if (st % 2 === 0) {
      const n = root + triad[(st / 2) % 3] + (st >= 8 ? 12 : 0);
      tone({ type: 'square', f: midi(n), dur: spb * 1.5, vol: 0.035, at: t + sw, bus: musicBus, lp: 1800 });
    }
    // melody
    const m = d.mel[(step % 64)];
    if (m != null) tone({ type: d.lead, f: midi(d.root + 12 + m), dur: spb * 2.6, vol: d.lead === 'sawtooth' || d.lead === 'square' ? 0.05 : 0.11, at: t + sw, bus: musicBus, lp: 2600 });
    // A quiet heartbeat and close harmony emerge only near the oven limit.
    // This bus ramps smoothly as heat changes; every voice uses the same zero-start envelope.
    if ((mood === 'bake' || mood === 'boss') && heat > 0.6) {
      if (st % 4 === 0) tone({ type: 'sine', f: midi(root - 24), f2: midi(root - 26),
        dur: spb * 1.6, vol: 0.16, attack: 0.018, at: t, bus: tensionBus });
      if (st === 6 || st === 14) tone({ type: 'triangle', f: midi(root + 6),
        dur: spb * 2, vol: 0.045, attack: 0.025, at: t, bus: tensionBus, lp: 950 });
    }
    // drums
    if (d.drums) {
      if (st === 0 || st === 8) tone({ type: 'sine', f: 140, f2: 45, dur: 0.18, vol: 0.35, at: t, bus: musicBus });
      if (st === 4 || st === 12) noise({ f: 1800, dur: 0.1, vol: 0.08, at: t, bus: musicBus, q: 0.7 });
      if (st % 2 === 1) noise({ f: 8000, dur: 0.03, vol: 0.03, at: t + sw, bus: musicBus, filter: 'highpass' });
    }
  }

  function tick() {
    if (!ctx || !song || hidden) return;
    const spb = 60 / song.bpm / 4;
    if (nextStep < ctx.currentTime) nextStep = ctx.currentTime + 0.05;
    while (nextStep < ctx.currentTime + 0.2) {
      if (musicOn && !muted && ctx.state === 'running') scheduleStep(nextStep);
      nextStep += spb;
      step++;
    }
  }

  function startScheduler() {
    if (!timer) timer = setInterval(tick, 50);
  }

  A.music = function (name) {
    if (mood === name) return;
    mood = name;
    song = SONGS[name] ? buildSong(SONGS[name]) : null;
    step = 0;
    if (ctx) { nextStep = ctx.currentTime + 0.1; startScheduler(); }
  };
})();
