const WEDDING = new Date("2027-02-15T00:00:00");
const START = new Date("2026-02-15T00:00:00");

const els = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  celebration: document.getElementById("celebration"),
  progressRing: document.getElementById("progressRing"),
  scene: document.getElementById("scene"),
};

const RING_LENGTH = 339.292;
let progressTarget = RING_LENGTH;
let progressCurrent = RING_LENGTH;

const CONFETTI_COLORS = [
  "#ffd700",
  "#ffe566",
  "#9b1b30",
  "#ff9a62",
  "#fff8f0",
  "#ffb8c8",
  "#e87890",
  "#fff5cc",
];
const confettiState = { pieces: [], intensity: 1, canvas: null, ctx: null, w: 0, h: 0 };

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

  const onOut = () => {
    el.removeEventListener("animationend", onOut);
    el.textContent = next;
    el.dataset.value = next;
    el.classList.remove("flip-out");
    el.classList.add("flip-in");
  };

  el.addEventListener("animationend", onOut, { once: true });
}

function updateProgress(now) {
  const total = WEDDING - START;
  const elapsed = now - START;
  const ratio = Math.min(1, Math.max(0, elapsed / total));
  progressTarget = RING_LENGTH * (1 - ratio);
}

(function smoothProgressRing() {
  function tick() {
    if (els.progressRing) {
      progressCurrent += (progressTarget - progressCurrent) * 0.06;
      els.progressRing.style.strokeDashoffset = String(progressCurrent);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

function updateCountdown() {
  const now = new Date();
  const diff = WEDDING - now;

  updateProgress(now);

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
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  setDigit(els.days, days);
  setDigit(els.hours, hours);
  setDigit(els.minutes, minutes);
  setDigit(els.seconds, seconds);
}

document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => document.body.classList.add("loaded"));
  initConfetti();
  confettiBurst(70);
  window.setTimeout(() => confettiBurst(35), 1200);
  window.setInterval(() => confettiBurst(18), 9000);
  updateCountdown();
  setInterval(updateCountdown, 1000);
});

(function parallax() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const scene = els.scene;
  if (!scene) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener(
    "mousemove",
    (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = (e.clientX - cx) / cx;
      targetY = (e.clientY - cy) / cy;
    },
    { passive: true }
  );

  function tick() {
    currentX += (targetX - currentX) * 0.035;
    currentY += (targetY - currentY) * 0.035;
    scene.style.setProperty("--px", currentX.toFixed(4));
    scene.style.setProperty("--py", currentY.toFixed(4));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

(function initCloudCanvas() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.getElementById("clouds");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const sceneEl = document.getElementById("scene");
  let w = 0;
  let h = 0;
  const blobs = [];

  function parallaxOffset() {
    if (!sceneEl) return { px: 0, py: 0 };
    const style = getComputedStyle(sceneEl);
    return {
      px: parseFloat(style.getPropertyValue("--px")) || 0,
      py: parseFloat(style.getPropertyValue("--py")) || 0,
    };
  }

  function makeBlob(x, y, scale, tone) {
    const parts = [];
    const n = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      parts.push({
        ox: (Math.random() - 0.5) * 120 * scale,
        oy: (Math.random() - 0.5) * 40 * scale,
        r: (40 + Math.random() * 70) * scale,
      });
    }
    return {
      x,
      y,
      parts,
      tone,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.03,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    blobs.length = 0;
    const count = w < 520 ? 6 : 10;
    for (let i = 0; i < count; i++) {
      blobs.push(
        makeBlob(
          Math.random() * w,
          h * (0.08 + Math.random() * 0.55),
          0.6 + Math.random() * 0.9,
          Math.random() > 0.5 ? "rose" : "pearl"
        )
      );
    }
  }

  function drawBlob(blob, t) {
    const drift = Math.sin(t * 0.0004 + blob.phase) * 12;
    const { px, py } = parallaxOffset();

    blob.x += blob.vx;
    blob.y += blob.vy;
    if (blob.x < -200) blob.x = w + 200;
    if (blob.x > w + 200) blob.x = -200;

    const cx = blob.x + drift + px * 20;
    const cy = blob.y + py * 14;

    for (const part of blob.parts) {
      const g = ctx.createRadialGradient(
        cx + part.ox,
        cy + part.oy,
        0,
        cx + part.ox,
        cy + part.oy,
        part.r
      );
      if (blob.tone === "rose") {
        g.addColorStop(0, "rgba(255, 252, 248, 0.62)");
        g.addColorStop(0.35, "rgba(255, 230, 200, 0.32)");
        g.addColorStop(0.7, "rgba(255, 180, 120, 0.1)");
        g.addColorStop(1, "rgba(255, 180, 120, 0)");
      } else {
        g.addColorStop(0, "rgba(255, 255, 255, 0.58)");
        g.addColorStop(0.4, "rgba(255, 248, 230, 0.28)");
        g.addColorStop(1, "rgba(255, 230, 200, 0)");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx + part.ox, cy + part.oy, part.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    for (const blob of blobs) drawBlob(blob, t);
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(frame);
})();

(function initSparkles() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.getElementById("sparkles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  const particles = [];
  const count = 88;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function spawn() {
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      const gold = Math.random() > 0.65;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.85,
        r: Math.random() * (gold ? 2.2 : 1.6) + 0.35,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.12 - 0.02,
        a: Math.random() * 0.55 + 0.15,
        twinkle: Math.random() * Math.PI * 2,
        gold,
        gleam: Math.random() > 0.7,
      });
    }
  }

  let lastSparkle = performance.now();

  function frame(now) {
    const dt = Math.min((now - lastSparkle) / 1000, 0.05);
    lastSparkle = now;
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.twinkle += 0.025 * dt * 60;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      const alpha = p.a * (0.55 + 0.45 * Math.sin(p.twinkle));
      const col = p.gold ? `rgba(255, 215, 0, ${alpha})` : `rgba(255, 200, 140, ${alpha})`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();

      if (p.gleam && alpha > 0.4) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        g.addColorStop(0, col.replace(String(alpha), String(alpha * 0.5)));
        g.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
      }

      if (p.r > 1.2 && alpha > 0.35) {
        ctx.beginPath();
        ctx.moveTo(p.x - p.r * 3, p.y);
        ctx.lineTo(p.x + p.r * 3, p.y);
        ctx.moveTo(p.x, p.y - p.r * 3);
        ctx.lineTo(p.x, p.y + p.r * 3);
        ctx.strokeStyle = col.replace(String(alpha), String(alpha * 0.35));
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(245, 198, 212, ${0.06 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(frame);
  }

  resize();
  spawn();
  window.addEventListener("resize", () => {
    resize();
    spawn();
  });
  requestAnimationFrame(frame);
})();

function createConfettiPiece(w, h, burst = false) {
  const roll = Math.random();
  const shape = roll > 0.82 ? "ribbon" : roll > 0.58 ? "circle" : "rect";
  return {
    x: burst ? w * 0.5 + (Math.random() - 0.5) * w * 0.5 : Math.random() * w,
    y: burst ? -30 - Math.random() * 120 : -Math.random() * h * 0.9,
    w: shape === "ribbon" ? 3 + Math.random() * 3 : 4 + Math.random() * 8,
    h: shape === "ribbon" ? 12 + Math.random() * 16 : 3 + Math.random() * 7,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 2.8,
    vy: 22 + Math.random() * 38,
    vx: (Math.random() - 0.5) * 28,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: 1 + Math.random() * 1.8,
    swayAmp: 12 + Math.random() * 28,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape,
    opacity: 0.5 + Math.random() * 0.5,
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
  confettiBurst(100);
  window.setTimeout(() => confettiBurst(80), 600);
  window.setTimeout(() => confettiBurst(80), 1400);
}

function drawConfettiPiece(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = p.opacity;

  if (p.shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, p.w * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  } else if (p.shape === "ribbon") {
    const g = ctx.createLinearGradient(0, -p.h / 2, 0, p.h / 2);
    g.addColorStop(0, p.color);
    g.addColorStop(1, "rgba(255,255,255,0.85)");
    ctx.fillStyle = g;
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 1);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
  } else {
    ctx.fillStyle = p.color;
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 1.5);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
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
    const base = confettiState.w < 520 ? 50 : 90;
    const target = Math.floor(base * confettiState.intensity);
    while (confettiState.pieces.length < target) {
      confettiState.pieces.push(createConfettiPiece(confettiState.w, confettiState.h));
    }
  }

  function respawn(p) {
    p.x = Math.random() * confettiState.w;
    p.y = -20 - Math.random() * 80;
    p.vy = 22 + Math.random() * 38;
    p.vx = (Math.random() - 0.5) * 28;
    p.rot = Math.random() * Math.PI * 2;
  }

  function loop(now) {
    const { ctx, pieces, w, h, intensity } = confettiState;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const base = w < 520 ? 50 : 90;
    const target = Math.floor(base * intensity);
    while (pieces.length < target) pieces.push(createConfettiPiece(w, h));
    if (pieces.length > target + 40) pieces.splice(0, pieces.length - target - 40);

    ctx.clearRect(0, 0, w, h);

    for (const p of pieces) {
      p.swayPhase += p.swaySpeed * dt;
      const sway = Math.sin(p.swayPhase) * p.swayAmp;
      p.x += (p.vx + sway * 0.35) * dt;
      p.y += p.vy * dt * (0.9 + intensity * 0.12);
      p.rot += p.vr * dt;

      if (p.y > h + 50) respawn(p);

      drawConfettiPiece(ctx, p);
    }

    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(loop);
}
