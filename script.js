const WEDDING = new Date("2027-02-15T00:00:00");

const els = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  celebration: document.getElementById("celebration"),
  baraatCar: document.getElementById("baraatCar"),
  honkFx: document.getElementById("honkFx"),
  audioToggle: document.getElementById("audioToggle"),
};

const CONFETTI_COLORS = [
  "#ff9933",
  "#ff6b00",
  "#ffd700",
  "#8b1530",
  "#e84a7a",
  "#ff4d6d",
  "#fff8ef",
  "#2d8a4e",
];
const confettiState = { pieces: [], intensity: 1.2, canvas: null, ctx: null, w: 0, h: 0 };

const audio = {
  ctx: null,
  master: null,
  muted: true,
  dholTimer: null,
  shehnaiNodes: [],
};

function pad2(n) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function formatUnit(el, value) {
  return el.id === "days" ? String(Math.max(0, value)) : pad2(value);
}

function setDigit(el, value) {
  const next = formatUnit(el, value);
  const prev = el.dataset.value ?? el.textContent;
  if (prev === next) return;

  el.classList.remove("flip-in", "flip-out");
  el.classList.add("flip-out");

  el.addEventListener(
    "animationend",
    () => {
      el.textContent = next;
      el.dataset.value = next;
      el.classList.remove("flip-out");
      el.classList.add("flip-in");
    },
    { once: true }
  );
}

function updateCountdown() {
  const now = new Date();
  const diff = WEDDING - now;

  if (diff <= 0) {
    ["days", "hours", "minutes", "seconds"].forEach((k) => {
      els[k].textContent = "00";
      els[k].dataset.value = "00";
    });
    els.celebration.classList.remove("hidden");
    document.body.classList.add("celebrating");
    setConfettiCelebration();
    return;
  }

  const totalSec = Math.floor(diff / 1000);
  setDigit(els.days, Math.floor(totalSec / 86400));
  setDigit(els.hours, Math.floor((totalSec % 86400) / 3600));
  setDigit(els.minutes, Math.floor((totalSec % 3600) / 60));
  setDigit(els.seconds, totalSec % 60);
}

document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => document.body.classList.add("loaded"));
  initPetals();
  initConfetti();
  confettiBurst(60);
  initBaraatAnimation();
  initAudioToggle();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  window.setInterval(() => confettiBurst(14), 8000);
});

function initAudioToggle() {
  if (!els.audioToggle) return;

  els.audioToggle.addEventListener("click", () => {
    ensureAudioContext();
    audio.muted = !audio.muted;
    syncAudioUi();
    if (!audio.muted) {
      document.body.classList.add("audio-on");
      startFestiveLoop();
    } else {
      stopFestiveLoop();
    }
  });
}

function syncAudioUi() {
  if (!els.audioToggle) return;
  els.audioToggle.setAttribute("aria-pressed", String(!audio.muted));
  const icon = els.audioToggle.querySelector(".audio-icon");
  const label = els.audioToggle.querySelector(".audio-label");
  if (icon) icon.textContent = audio.muted ? "🔇" : "🔊";
  if (label) label.textContent = audio.muted ? "Tap for music" : "Music on";
}

function ensureAudioContext() {
  if (audio.ctx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audio.ctx = new Ctx();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = 0.22;
  audio.master.connect(audio.ctx.destination);
}

function startFestiveLoop() {
  if (!audio.ctx || audio.muted) return;
  stopFestiveLoop();
  startShehnaiDrone();
  audio.dholTimer = window.setInterval(() => playDholHit(), 480);
  playDholHit();
}

function stopFestiveLoop() {
  if (audio.dholTimer) {
    clearInterval(audio.dholTimer);
    audio.dholTimer = null;
  }
  audio.shehnaiNodes.forEach((n) => {
    try {
      n.osc.stop();
      n.lfo.stop();
    } catch {
      /* already stopped */
    }
  });
  audio.shehnaiNodes = [];
}

function startShehnaiDrone() {
  const { ctx, master } = audio;
  if (!ctx || !master) return;

  const notes = [392, 440, 494, 523.25];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = i % 2 ? "sawtooth" : "triangle";
    osc.frequency.value = freq;
    filter.type = "bandpass";
    filter.frequency.value = freq * 1.5;
    filter.Q.value = 8;
    gain.gain.value = 0.015;

    lfo.frequency.value = 0.08 + i * 0.02;
    lfoGain.gain.value = freq * 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start();
    lfo.start();
    audio.shehnaiNodes.push({ osc, lfo });
  });
}

function playDholHit() {
  if (!audio.ctx || !audio.master || audio.muted) return;
  const t = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.35, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(t);
  osc.stop(t + 0.25);
}

function playHonk() {
  if (!audio.muted) {
    ensureAudioContext();
    if (audio.ctx?.state === "suspended") audio.ctx.resume();
  }

  const t = audio.ctx?.currentTime ?? 0;
  if (audio.ctx && audio.master && !audio.muted) {
    [420, 520].forEach((freq, i) => {
      const osc = audio.ctx.createOscillator();
      const gain = audio.ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.18);
      osc.connect(gain);
      gain.connect(audio.master);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.2);
    });
  }

  if (els.honkFx && window.gsap) {
    gsap.fromTo(
      els.honkFx,
      { opacity: 0, scale: 0.5 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.15,
        ease: "back.out(2)",
        onComplete: () => {
          gsap.to(els.honkFx, { opacity: 0, scale: 0.8, duration: 0.35, delay: 0.35 });
        },
      }
    );
    gsap.fromTo(
      els.honkFx.querySelectorAll(".honk-wave"),
      { scale: 0.3, opacity: 0.8 },
      { scale: 2.2, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
    );
  }
}

function initBaraatAnimation() {
  if (!els.baraatCar || !window.gsap) return;

  const lane = els.baraatCar.parentElement;

  function positions() {
    const carW = els.baraatCar.offsetWidth;
    const laneW = lane.offsetWidth;
    return {
      start: -carW - 24,
      center: Math.max(8, (laneW - carW) / 2),
      end: laneW + 24,
    };
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const { center } = positions();
    gsap.set(els.baraatCar, { x: center, y: 0, xPercent: 0 });
    return;
  }

  const play = () => {
    const { start, center, end } = positions();
    gsap.set(els.baraatCar, { x: start, y: 0, xPercent: 0 });
    const tl = gsap.timeline();
    tl.to(els.baraatCar, { x: center, duration: 3.2, ease: "power3.out" })
      .to(els.baraatCar, {
        y: -12,
        duration: 0.26,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 5,
      })
      .add(() => playHonk())
      .to(els.baraatCar, { y: 0, duration: 0.2 })
      .to({}, { duration: 0.45 })
      .to(els.baraatCar, { x: end, duration: 2.6, ease: "power2.in" })
      .call(play);
  };

  play();

  window.addEventListener("resize", () => {
    gsap.killTweensOf(els.baraatCar);
    play();
  });
}

function initPetals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.getElementById("petals");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const petals = [];
  const colors = ["#e84a7a", "#ff6b8a", "#ff9933", "#ffb347", "#ffd700"];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawn(n) {
    for (let i = 0; i < n; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: 3 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.04,
        vy: 18 + Math.random() * 32,
        vx: (Math.random() - 0.5) * 20,
        sway: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  let last = performance.now();

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (petals.length < (canvas.width < 520 ? 35 : 55)) spawn(3);

    for (const p of petals) {
      p.sway += dt * 2;
      p.x += (p.vx + Math.sin(p.sway) * 12) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr;
      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
      drawPetal(p);
    }
    requestAnimationFrame(loop);
  }

  resize();
  spawn(40);
  window.addEventListener("resize", resize);
  requestAnimationFrame(loop);
}

function createConfettiPiece(w, h, burst = false) {
  const shape = Math.random() > 0.6 ? "circle" : "rect";
  return {
    x: burst ? w * 0.5 + (Math.random() - 0.5) * w * 0.5 : Math.random() * w,
    y: burst ? -30 - Math.random() * 100 : -Math.random() * h,
    w: 4 + Math.random() * 7,
    h: 3 + Math.random() * 6,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 2.5,
    vy: 24 + Math.random() * 36,
    vx: (Math.random() - 0.5) * 26,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: 1 + Math.random() * 1.6,
    swayAmp: 10 + Math.random() * 22,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape,
    opacity: 0.55 + Math.random() * 0.45,
  };
}

function confettiBurst(count = 30) {
  if (!confettiState.ctx) return;
  const { w, h } = confettiState;
  for (let i = 0; i < count; i++) {
    confettiState.pieces.push(createConfettiPiece(w, h, true));
  }
}

function setConfettiCelebration() {
  confettiState.intensity = 3;
  confettiBurst(120);
}

function drawConfettiPiece(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = p.opacity;
  ctx.fillStyle = p.color;
  if (p.shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, p.w * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
  }
  ctx.restore();
}

function initConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.getElementById("confetti");
  if (!canvas) return;

  confettiState.canvas = canvas;
  confettiState.ctx = canvas.getContext("2d");
  let last = performance.now();

  function resize() {
    confettiState.w = canvas.width = window.innerWidth;
    confettiState.h = canvas.height = window.innerHeight;
    const base = confettiState.w < 520 ? 55 : 95;
    while (confettiState.pieces.length < base * confettiState.intensity) {
      confettiState.pieces.push(createConfettiPiece(confettiState.w, confettiState.h));
    }
  }

  function respawn(p) {
    p.x = Math.random() * confettiState.w;
    p.y = -20;
  }

  function loop(now) {
    const { ctx, pieces, w, h, intensity } = confettiState;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const target = Math.floor((w < 520 ? 55 : 95) * intensity);
    while (pieces.length < target) pieces.push(createConfettiPiece(w, h));

    ctx.clearRect(0, 0, w, h);
    for (const p of pieces) {
      p.swayPhase += p.swaySpeed * dt;
      p.x += (p.vx + Math.sin(p.swayPhase) * p.swayAmp * 0.3) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > h + 40) respawn(p);
      drawConfettiPiece(ctx, p);
    }
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(loop);
}
