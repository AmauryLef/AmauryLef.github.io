/* ══════════════════════════════════════════
   DÉTECTION DU CONTEXTE via ?from=
══════════════════════════════════════════ */
const params  = new URLSearchParams(window.location.search);
const context = params.get('from'); // 'Projets' | 'Stages' | null

/* ══════════════════════════════════════════
   CONFIG DES DEADLINES PAR CONTEXTE
   → Modifie uniquement ces dates
══════════════════════════════════════════ */
const CONFIG = {
    Projets: {
        openDate:  new Date('2026-08-01T12:00:00'),
        startDate: new Date('2025-04-12T00:00:00'),
        primary:   [20, 157, 221],
        secondary: [10, 111, 163],
        hex:       '#149ddd',
        hex2:      '#0a6fa3',
        halo:      'rgba(20,157,221,0.08)',
    },
    Stages: {
        openDate:  new Date('2026-08-01T12:00:00'),
        startDate: new Date('2025-07-01T00:00:00'),
        primary:   [138, 43, 226],
        secondary: [90,  20, 160],
        hex:       '#8a2be2',
        hex2:      '#5a14a0',
        halo:      'rgba(138,43,226,0.08)',
    },
};

/* Fallback si pas de paramètre */
const theme    = CONFIG[context] ?? CONFIG.Projets;
const OPEN_DATE  = theme.openDate;
const START_DATE = theme.startDate;
const COLOR      = theme.primary;
const COLOR2     = theme.secondary;
const HEX        = theme.hex;


/* ══════════════════════════════════════════
 APPLICATION DU THÈME COULEUR
 → Écrase les variables CSS du :root
══════════════════════════════════════════ */
const root = document.documentElement;
root.style.setProperty('--blue',  theme.hex);
root.style.setProperty('--blue2', theme.hex2);

// Halo (radial-gradient hardcodé dans le CSS)
const styleEl = document.createElement('style');
styleEl.textContent = `
  .halo { background: radial-gradient(circle, ${theme.halo} 0%, transparent 70%) !important; }
  .cd-block { border-color: ${theme.hex}26 !important; }
  .cd-block:hover { border-color: ${theme.hex}66 !important; }
  .btn-back { border-color: ${theme.hex}59 !important; color: ${theme.hex} !important; }
  .btn-back:hover { background: ${theme.hex} !important; border-color: ${theme.hex} !important; color: #fff !important; }
`;
document.head.appendChild(styleEl);

/* ── Label date d'ouverture ── */
document.getElementById('open-date-label').textContent =
    OPEN_DATE.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric'});

/* ── Compte à rebours ── */
function pad(n) { return String(n).padStart(2, '0'); }

function tickCountdown() {
    const now   = new Date();
    const diff  = OPEN_DATE - now;
    const total   = OPEN_DATE - START_DATE;
    const elapsed = now - START_DATE;
    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const pctRound = Math.round(pct);

    document.getElementById('progress-fill').style.width = pctRound + '%';
    document.getElementById('pct-label').textContent = pctRound + '%';

    if (diff <= 0) {
        ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
            document.getElementById(id).textContent = '00';
        });
        return;
    }
    document.getElementById('cd-days').textContent  = pad(Math.floor(diff / 86400000));
    document.getElementById('cd-hours').textContent = pad(Math.floor((diff % 86400000) / 3600000));
    document.getElementById('cd-mins').textContent  = pad(Math.floor((diff % 3600000) / 60000));
    document.getElementById('cd-secs').textContent  = pad(Math.floor((diff % 60000) / 1000));
}
tickCountdown();
setInterval(tickCountdown, 1000);

/* ══════════════════════════════════════════
   FOND ANIMÉ — particules + lignes
══════════════════════════════════════════ */
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');

const COUNT = 80;
let W, H, particles;

function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

function randomBetween(a, b) { return a + Math.random() * (b - a); }

function makeParticle() {
    const col = Math.random() > 0.4 ? COLOR : COLOR2;
    return {
        x:   randomBetween(0, W),
        y:   randomBetween(0, H),
        r:   randomBetween(1, 2.5),
        vx:  randomBetween(-0.3, 0.3),
        vy:  randomBetween(-0.3, 0.3),
        alpha: randomBetween(0.2, 0.7),
        color: col,
        twinkleSpeed: randomBetween(0.005, 0.02),
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
    };
}

function initParticles() {
    particles = Array.from({ length: COUNT }, makeParticle);
}

function drawLine(p1, p2, dist, maxDist) {
    const alpha = (1 - dist / maxDist) * 0.12;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = `rgba(${COLOR[0]},${COLOR[1]},${COLOR[2]},${alpha})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
}

function draw()
{
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
    grad.addColorStop(0, theme === CONFIG.Stages ? 'rgba(12,6,20,1)' : 'rgba(6,14,20,1)');
    grad.addColorStop(1, 'rgba(4,4,4,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const MAX_DIST = 140;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx   = particles[i].x - particles[j].x;
            const dy   = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MAX_DIST) drawLine(particles[i], particles[j], dist, MAX_DIST);
        }
    }
    for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha})`;
        ctx.fill();
    }
}

function update() {
    for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        p.alpha += p.twinkleSpeed * p.twinkleDir;
        if (p.alpha >= 0.7 || p.alpha <= 0.15) p.twinkleDir *= -1;
    }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

window.addEventListener('resize', () => { resize(); initParticles(); });
resize(); initParticles(); loop();

/* ── Engrenage (couleur dynamique) ── */
document.querySelector('.gear-wrap').innerHTML = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:72px;height:72px;animation:spin-gear 10s linear infinite">
      <path fill="${HEX}" opacity="0.9" d="
        M42 4h16l2.5 12a34 34 0 0 1 9.2 3.8l10.8-5.3 11.3 11.3-5.3 10.8A34 34 0 0 1 90 46l12 2.5v16L90 67a34 34 0 0 1-3.5 9l5.3 10.8-11.3 11.3-10.8-5.3A34 34 0 0 1 60.5 96L58 108H42l-2.5-12a34 34 0 0 1-9-3.8L19.7 97.5 8.4 86.2l5.3-10.8A34 34 0 0 1 10 67L-2 64.5v-16L10 46a34 34 0 0 1 3.7-9.2L8.4 26 19.7 14.7l10.8 5.3A34 34 0 0 1 39.5 16Z"/>
      <circle cx="50" cy="56" r="13" fill="#040404"/>
    </svg>`;