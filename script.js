/* ===================================================================
   kumoti.jp — main script
   =================================================================== */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ----- Status bar clock ------------------------------------------- */
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('sbTime').textContent = `${hh}:${mm}:${ss}`;
}
updateClock();
setInterval(updateClock, 1000);

/* ----- Neovim mode switcher --------------------------------------- */
const MODES = {
  top:       'NORMAL',
  about:     'INSERT',
  services:  'VISUAL',
  strengths: 'TERMINAL',
  works:     'REPLACE',
  contact:   'COMMAND',
};

const sbMode = document.getElementById('sbMode');
const sections = Object.keys(MODES).map((id) => document.getElementById(id));

const modeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const mode = MODES[entry.target.id] ?? 'NORMAL';
        sbMode.textContent = mode;
        sbMode.dataset.mode = mode;
      }
    });
  },
  { threshold: 0.35 }
);

sections.forEach((el) => el && modeObserver.observe(el));

/* ----- Hamburger menu --------------------------------------------- */
const hamburger = document.getElementById('sbHamburger');
const mobileNav = document.getElementById('sbMobileNav');

hamburger.addEventListener('click', () => {
  mobileNav.classList.toggle('open');
});
mobileNav.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => mobileNav.classList.remove('open'));
});

/* ----- Scroll reveal (IntersectionObserver) ----------------------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.fade-up').forEach((el) => revealObserver.observe(el));

/* ----- Typing helper ---------------------------------------------- */
async function typeChars(element, text, speed = 55) {
  for (const ch of text) {
    element.textContent += ch;
    await sleep(speed + Math.random() * 25);
  }
}

/* ----- Hero animation (typing catchphrase two-line) --------------- */
async function runHero() {
  const line1  = document.getElementById('heroLine1');
  const line2  = document.getElementById('heroLine2');
  const cursor = document.getElementById('heroCursor');

  await sleep(400);
  document.getElementById('heroName').classList.add('visible');
  await sleep(200);

  await typeChars(line1, line1.dataset.content, 80);
  await sleep(320);
  await typeChars(line2, line2.dataset.content, 80);
  await sleep(600);

  cursor.style.opacity = '0';
  await sleep(200);
  document.getElementById('heroActions').classList.add('visible');
}

runHero();

/* ----- Stats count-up animation ----------------------------------- */
function countUp(el, target, suffix, duration = 1200) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

let statsStarted = false;
const statsObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting && !statsStarted) {
      statsStarted = true;
      document.querySelectorAll('.stat-num[data-target]').forEach((el) => {
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix ?? '';
        countUp(el, target, suffix);
      });
      statsObserver.disconnect();
    }
  },
  { threshold: 0.4 }
);
const statsSection = document.getElementById('stats');
if (statsSection) statsObserver.observe(statsSection);

/* ----- About terminal animation ----------------------------------- */
const ABOUT_SEQUENCE = [
  { cmd: 'cat role.txt',  result: 'Full Stack Engineer' },
  { cmd: 'ls skills/',    result: 'React/  TypeScript/  Node.js/  NestJS/  Python/  AWS/' },
  { cmd: 'echo $STATUS',  result: '"open to work"' },
];

async function runAboutTerminal() {
  const output  = document.getElementById('termOutput');
  const inputEl = document.getElementById('termInput');
  const cursor  = document.getElementById('termCursor');

  await sleep(300);

  for (const { cmd, result } of ABOUT_SEQUENCE) {
    inputEl.textContent = '';
    cursor.style.display = 'inline';

    await typeChars(inputEl, cmd);
    await sleep(280);

    cursor.style.display = 'none';

    const histLine = document.createElement('div');
    histLine.className = 'term-history';
    histLine.innerHTML =
      `<span class="term-prompt-sym">❯</span>` +
      `<span class="term-cmd">${cmd}</span>`;
    output.appendChild(histLine);

    inputEl.textContent = '';

    await sleep(100);

    const resLine = document.createElement('div');
    resLine.className = 'term-result';
    resLine.textContent = result;
    output.appendChild(resLine);

    cursor.style.display = 'inline';
    await sleep(650);
  }
}

/* About terminal starts when the section scrolls into view */
let aboutTermStarted = false;
const aboutTermObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting && !aboutTermStarted) {
      aboutTermStarted = true;
      runAboutTerminal();
      aboutTermObserver.disconnect();
    }
  },
  { threshold: 0.3 }
);
const aboutSection = document.getElementById('about');
if (aboutSection) aboutTermObserver.observe(aboutSection);

/* ----- Footer year ------------------------------------------------ */
document.getElementById('year').textContent = new Date().getFullYear();

/* ----- Contact form ----------------------------------------------- */
const CONTACT_API_URL = 'https://ojjh002b35.execute-api.us-east-1.amazonaws.com/Prod/contact';

let turnstileToken = null;

function onSuccess(token) { turnstileToken = token; }
function onError()        { turnstileToken = null; }

document.getElementById('contactForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const status      = document.getElementById('formStatus');
  const name        = this.name.value.trim();
  const company     = this.company.value.trim();
  const email       = this.email.value.trim();
  const inquiryType = this.inquiryType.value;
  const message     = this.message.value.trim();

  if (!name || !inquiryType || !email || !message) {
    status.textContent = '> Error: 必須項目をすべて入力してください。';
    status.className   = 'form-status error';
    return;
  }

  if (!turnstileToken) {
    status.textContent = '> Error: スパム確認が完了していません。少し待ってから再度お試しください。';
    status.className   = 'form-status error';
    return;
  }

  const submitBtn = this.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  status.textContent = '> 送信中...';
  status.className   = 'form-status';

  try {
    const res = await fetch(CONTACT_API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, company, email, inquiryType, message, turnstileToken }),
    });

    const data = await res.json();

    if (res.ok) {
      status.textContent = `> Success: ${data.message}`;
      status.className   = 'form-status success';
      this.reset();
      turnstileToken = null;
      if (window.turnstile) window.turnstile.reset();
    } else {
      status.textContent = `> Error: ${data.message}`;
      status.className   = 'form-status error';
    }
  } catch {
    status.textContent = '> Error: 送信に失敗しました。通信環境をご確認の上、再度お試しください。';
    status.className   = 'form-status error';
  } finally {
    submitBtn.disabled = false;
  }
});
