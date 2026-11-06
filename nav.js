'use strict';
/* Menyu, sahifalar, tema, grafiklar, muqovalar, o'quvchi kartasi (QR), konfetti va ilova o'rnatish.
   app.js dagi db, activeLoans, overdue, cardNo, today, addDays, webResults va render ni ishlatadi. */
(function () {
/* ===== QR-kod (1-versiya, 14 belgigacha) ===== */
const QR = (function () {
  const SIZE = 21, DATA_CW = 16, EC_CW = 10;

  // GF(256) arifmetikasi
  const EXP = new Array(512), LOG = new Array(256);
  for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

  function rsRemainder(data) {
    let gen = [1];
    for (let i = 0; i < EC_CW; i++) {
      const next = new Array(gen.length + 1).fill(0);
      gen.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= mul(c, EXP[i]); });
      gen = next;
    }
    const rem = new Array(EC_CW).fill(0);
    for (const b of data) {
      const f = b ^ rem.shift();
      rem.push(0);
      for (let i = 0; i < EC_CW; i++) rem[i] ^= mul(gen[i + 1], f);
    }
    return rem;
  }

  function codewords(text) {
    const bytes = [...new TextEncoder().encode(text)];
    if (bytes.length > 14) throw new Error('QR uchun matn juda uzun');
    const bits = [];
    const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
    put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
    put(0, Math.min(4, DATA_CW * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let pad = 0xec; data.length < DATA_CW; pad ^= 0xec ^ 0x11) data.push(pad);
    return data.concat(rsRemainder(data));
  }

  function build(text, mask) {
    const m = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
    const fn = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
    const set = (x, y, v) => { m[y][x] = v; fn[y][x] = true; };

    // Qidiruv (finder) naqshlari va ajratgichlar
    for (const [cx, cy] of [[3, 3], [SIZE - 4, 3], [3, SIZE - 4]]) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, d !== 2 && d !== 4);
      }
    }
    // Vaqt (timing) chiziqlari
    for (let i = 8; i < SIZE - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }

    // Format ma'lumoti (ECC M = 00)
    const data = (0 << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i) => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(SIZE - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, SIZE - 15 + i, bit(i));
    set(8, SIZE - 8, true);

    // Ma'lumotlarni joylashtirish
    const cw = codewords(text);
    let i = 0;
    for (let right = SIZE - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < SIZE; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? SIZE - 1 - vert : vert;
        if (!fn[y][x] && i < cw.length * 8) { m[y][x] = ((cw[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
      }
    }
    // Niqob (mask)
    const rules = [
      (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
      (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
    ];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!fn[y][x] && rules[mask](x, y)) m[y][x] = !m[y][x];
    return m;
  }

  // Eng yaxshi niqobni tanlash uchun jarima
  function penalty(m) {
    let p = 0;
    const lines = [];
    for (let i = 0; i < SIZE; i++) { lines.push(m[i]); lines.push(m.map((r) => r[i])); }
    for (const line of lines) {
      let run = 1;
      for (let i = 1; i <= SIZE; i++) {
        if (i < SIZE && line[i] === line[i - 1]) run++; else { if (run >= 5) p += run - 2; run = 1; }
      }
      const s = line.map((v) => (v ? '1' : '0')).join('');
      for (const pat of ['10111010000', '00001011101']) for (let k = s.indexOf(pat); k !== -1; k = s.indexOf(pat, k + 1)) p += 40;
    }
    for (let y = 0; y < SIZE - 1; y++) for (let x = 0; x < SIZE - 1; x++) {
      if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
    }
    const dark = m.flat().filter(Boolean).length;
    p += Math.floor(Math.abs((dark * 20) - (SIZE * SIZE * 10)) / (SIZE * SIZE)) * 10;
    return p;
  }

  function matrix(text) {
    let best = null, bestP = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const m = build(text, mask), p = penalty(m);
      if (p < bestP) { bestP = p; best = m; }
    }
    return best;
  }

  // SVG matn ko'rinishida (4 modulli bo'sh chekka bilan)
  function svg(text, color) {
    const m = matrix(text), q = 4, n = SIZE + q * 2;
    let d = '';
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (m[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" role="img" aria-label="QR-kod">' +
      '<rect width="' + n + '" height="' + n + '" fill="#fff"/><path d="' + d + '" fill="' + (color || '#000') + '"/></svg>';
  }
  return { matrix, svg };
})();

/* ===== Asosiy qismlar ===== */
const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pages = [...document.querySelectorAll('.page')];
const links = [...document.querySelectorAll('[data-go]')];

/* --- Sahifalar --- */
function show(name) {
  if (!pages.some((p) => p.dataset.page === name)) name = 'home';
  pages.forEach((p) => { p.hidden = p.dataset.page !== name; });
  links.forEach((a) => a.classList.toggle('on', a.dataset.go === name));
  $('side').classList.remove('open');
  $('scrim').classList.remove('on');
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
show(location.hash.slice(1));

/* --- Telefonda menyuni ochish --- */
const toggleMenu = (open) => {
  $('side').classList.toggle('open', open);
  $('scrim').classList.toggle('on', open);
};
$('burger').addEventListener('click', () => toggleMenu(!$('side').classList.contains('open')));
$('scrim').addEventListener('click', () => toggleMenu(false));

/* --- Yuqoridagi qidiruv katalogni qidiradi --- */
$('topq').addEventListener('input', () => {
  $('q').value = $('topq').value;
  $('q').dispatchEvent(new Event('input'));
  if (location.hash !== '#katalog') location.hash = '#katalog';
});

/* --- Foydalanuvchi belgisi (ism bosh harflari) --- */
function initials() {
  const t = $('who').textContent.trim();
  $('ava').textContent = t.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}
new MutationObserver(initials).observe($('who'), { childList: true, characterData: true, subtree: true });
initials();

/* --- Yorug'/qorong'i rejim --- */
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('kutubxona-tema', t); } catch { /* saqlanmasa ham ishlayveradi */ }
  $('themeBtn').querySelector('use').setAttribute('href', t === 'dark' ? '#i-sun' : '#i-moon');
  document.querySelector('meta[name=theme-color]').setAttribute('content', t === 'dark' ? '#0b0f23' : '#f3f5fb');
}
$('themeBtn').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
applyTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

/* --- Konfetti --- */
function confetti() {
  if (reduceMotion) return;
  const cv = $('fx'), ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight; cv.classList.add('on');
  const colors = ['#6670ff', '#2dd4a0', '#f5b544', '#5b9bff', '#ff6b7a'];
  const ps = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4,
    s: 5 + Math.random() * 6, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, c: colors[(Math.random() * 5) | 0], life: 1,
  }));
  (function frame() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = false;
    for (const p of ps) {
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= 0.99; p.life -= 0.011;
      if (p.life > 0 && p.y < cv.height + 20) {
        alive = true;
        ctx.save(); ctx.globalAlpha = p.life; ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      }
    }
    if (alive) requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, cv.width, cv.height); cv.classList.remove('on'); }
  })();
}

/* --- Xabar: bir necha soniyadan keyin o'chadi, muvaffaqiyatda konfetti --- */
let toastTimer;
new MutationObserver(() => {
  clearTimeout(toastTimer);
  const text = $('toast').textContent;
  if (!text) return;
  if (/(Kitob berildi|Kitob qaytarildi|Katalogga qo‘shildi|raqami berildi)/.test(text)) confetti();
  toastTimer = setTimeout(() => { $('toast').textContent = ''; }, 4000);
}).observe($('toast'), { childList: true, characterData: true, subtree: true });

/* --- Kitobxon darajalari --- */
const LEVELS = [
  { min: 6, name: 'Kitob ustasi', cls: 'l3' },
  { min: 3, name: 'Faol kitobxon', cls: 'l2' },
  { min: 1, name: 'Yosh kitobxon', cls: 'l1' },
  { min: 0, name: 'Yangi a’zo', cls: 'l0' },
];
const totalLoans = (readerId) => db.loans.filter((l) => l.readerId === readerId).length;
const levelOf = (n) => LEVELS.find((l) => n >= l.min);
function levelPill(n) {
  const l = levelOf(n), s = document.createElement('span');
  s.className = 'lvl ' + l.cls; s.textContent = l.name;
  return s;
}

/* --- O'quvchilar jadvali --- */
function renderReaderTable() {
  const body = $('readersBody');
  body.textContent = '';
  const active = activeLoans();
  [...db.readers].sort((a, b) => a.card - b.card).forEach((r) => {
    const tr = document.createElement('tr');
    const cell = (v) => { const td = document.createElement('td'); if (v instanceof Node) td.appendChild(v); else td.textContent = v; tr.appendChild(td); };
    cell(cardNo(r.card)); cell(r.name); cell(r.phone || '—'); cell(levelPill(totalLoans(r.id)));
    cell(active.filter((l) => l.readerId === r.id).length);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'small'; btn.dataset.card = r.id; btn.textContent = 'Karta';
    cell(btn);
    body.appendChild(tr);
  });
  $('readersCount').textContent = '· ' + db.readers.length + ' ta';
  const late = overdue().length;
  $('lateBadge').textContent = late;
  $('lateBadge').hidden = !late;
}

/* --- O'quvchi kartasi (QR bilan) --- */
$('readersBody').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-card]');
  const r = btn && db.readers.find((x) => x.id === btn.dataset.card);
  if (!r) return;
  $('lcName').textContent = r.name;
  $('lcNo').textContent = cardNo(r.card);
  $('lcLevel').textContent = levelOf(totalLoans(r.id)).name;
  $('lcQr').innerHTML = QR.svg(cardNo(r.card), '#111');      // faqat K-0001 ko'rinishidagi raqam
  $('cardModal').showModal();
});
$('lcClose').addEventListener('click', () => $('cardModal').close());
$('lcPrint').addEventListener('click', () => window.print());

/* --- Boshqaruv paneli: grafiklar va faollar --- */
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const SVGNS = 'http://www.w3.org/2000/svg';

function grow(svg) {      // chizilgandan keyin animatsiyani ishga tushiradi
  if (reduceMotion) { svg.classList.add('in'); return; }
  requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.add('in')));
}

function renderMonths() {
  const box = $('chartMonths');
  const t = today();
  let y = +t.slice(0, 4), m = +t.slice(5, 7);
  const keys = [];
  for (let i = 0; i < 6; i++) { keys.unshift({ y, m }); m--; if (m === 0) { m = 12; y--; } }
  const counts = keys.map((k) => {
    const key = k.y + '-' + String(k.m).padStart(2, '0');
    return db.loans.filter((l) => l.issuedAt.startsWith(key)).length;
  });
  const max = Math.max(1, ...counts);
  const W = 360, H = 190, base = H - 28, top = 26, bw = 36, gap = (W - 40 - bw * 6) / 5;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Oyma-oy berilgan kitoblar: ' + keys.map((k, i) => MONTHS[k.m - 1] + ' ' + counts[i]).join(', '));
  const add = (tag, attrs, text) => {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (text !== undefined) el.textContent = text;
    svg.appendChild(el);
    return el;
  };
  add('line', { x1: 14, x2: W - 14, y1: base, y2: base, class: 'axis' });
  keys.forEach((k, i) => {
    const x = 20 + i * (bw + gap), h = (counts[i] / max) * (base - top);
    add('rect', { x, y: base - h, width: bw, height: Math.max(h, 0), rx: 6, class: 'bar' + (i === keys.length - 1 ? ' now' : '') });
    add('text', { x: x + bw / 2, y: base - h - 7, class: 'val', 'text-anchor': 'middle' }, counts[i]);
    add('text', { x: x + bw / 2, y: H - 8, class: 'lab', 'text-anchor': 'middle' }, MONTHS[k.m - 1]);
  });
  box.textContent = '';
  box.appendChild(svg);
  grow(svg);
}

function renderGenreChart() {
  const box = $('chartGenres');
  box.textContent = '';
  const total = db.books.length;
  if (!total) { box.textContent = 'Ma’lumot yo‘q'; return; }
  const counts = {};
  db.books.forEach((b) => { counts[b.genre] = (counts[b.genre] || 0) + 1; });
  let arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (arr.length > 5) arr = arr.slice(0, 4).concat([['Boshqalar', arr.slice(4).reduce((s, [, n]) => s + n, 0)]]);
  const colors = ['--accent', '--green', '--amber', '--blue', '--red'];

  const wrap = document.createElement('div');
  wrap.className = 'donutwrap';
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 42 42');
  svg.setAttribute('class', 'donut');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Janrlar: ' + arr.map(([g, n]) => g + ' ' + n).join(', '));
  const ring = document.createElementNS(SVGNS, 'circle');
  ring.setAttribute('cx', 21); ring.setAttribute('cy', 21); ring.setAttribute('r', 15.9155); ring.setAttribute('class', 'ring');
  svg.appendChild(ring);
  let offset = 0;
  const legend = document.createElement('ul');
  legend.className = 'legend';
  arr.forEach(([g, n], i) => {
    const pct = (n / total) * 100;
    const c = document.createElementNS(SVGNS, 'circle');
    c.setAttribute('cx', 21); c.setAttribute('cy', 21); c.setAttribute('r', 15.9155);
    c.setAttribute('class', 'seg');
    c.style.stroke = `var(${colors[i]})`;
    c.style.strokeDashoffset = String(25 - offset);
    c.dataset.dash = `${Math.max(pct - 0.8, 0.01)} ${100 - Math.max(pct - 0.8, 0.01)}`;
    c.style.strokeDasharray = '0 100';
    svg.appendChild(c);
    offset += pct;
    const li = document.createElement('li');
    const dot = document.createElement('i'); dot.style.background = `var(${colors[i]})`;
    const name = document.createElement('span'); name.textContent = g;
    const val = document.createElement('b'); val.textContent = n + ' (' + Math.round(pct) + '%)';
    li.append(dot, name, val);
    legend.appendChild(li);
  });
  const center = document.createElement('div');
  center.className = 'donut-center';
  const big = document.createElement('b'); big.textContent = total;
  const small = document.createElement('small'); small.textContent = 'kitob nomi';
  center.append(big, small);
  const holder = document.createElement('div');
  holder.className = 'donut-holder';
  holder.append(svg, center);
  wrap.append(holder, legend);
  box.appendChild(wrap);
  const play = () => svg.querySelectorAll('.seg').forEach((c) => { c.style.strokeDasharray = c.dataset.dash; });
  if (reduceMotion) play(); else requestAnimationFrame(() => requestAnimationFrame(play));
}

function renderLeaders() {
  const ol = $('leaders');
  ol.textContent = '';
  const from = addDays(today(), -30), counts = {};
  db.loans.forEach((l) => { if (l.issuedAt >= from) counts[l.readerId] = (counts[l.readerId] || 0) + 1; });
  const rows = Object.entries(counts)
    .map(([id, n]) => ({ r: db.readers.find((x) => x.id === id), n }))
    .filter((x) => x.r).sort((a, b) => b.n - a.n).slice(0, 5);
  if (!rows.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Oxirgi 30 kunda yozuv yo‘q'; ol.appendChild(li); return; }
  rows.forEach(({ r, n }, i) => {
    const li = document.createElement('li');
    const rank = document.createElement('span'); rank.className = 'rank r' + (i + 1); rank.textContent = i + 1;
    const mid = document.createElement('div');
    const name = document.createElement('b'); name.textContent = r.name;
    mid.append(name, document.createElement('br'), levelPill(totalLoans(r.id)));
    const cnt = document.createElement('span'); cnt.className = 'cnt'; cnt.textContent = n + ' ta kitob';
    li.append(rank, mid, cnt);
    ol.appendChild(li);
  });
}

function renderDashboard() { renderMonths(); renderGenreChart(); renderLeaders(); }

/* --- Statistika raqamlari 0 dan sanab chiqadi --- */
let prevStats = [];
function animateStats() {
  const bs = [...$('stats').querySelectorAll('.card b')];
  const target = bs.map((b) => Number(b.textContent) || 0);
  if (reduceMotion || !bs.length) { prevStats = target; return; }
  const from = prevStats.length === target.length ? prevStats : target.map(() => 0);
  const start = performance.now(), dur = 800;
  bs.forEach((b, i) => { b.textContent = from[i]; });
  (function step(now) {
    const k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3);
    bs.forEach((b, i) => { b.textContent = Math.round(from[i] + (target[i] - from[i]) * e); });
    if (k < 1) requestAnimationFrame(step);
  })(start);
  prevStats = target;
}
new MutationObserver(animateStats).observe($('stats'), { childList: true });

/* --- Muqovalar --- */
function hue(str) { let h = 0; for (const c of String(str)) h = (h * 31 + c.codePointAt(0)) % 360; return h; }
function genCover(label) {
  const d = document.createElement('div');
  const h = hue(label);
  d.className = 'cover gen';
  d.style.background = `linear-gradient(145deg, hsl(${h} 60% 42%), hsl(${(h + 45) % 360} 65% 26%))`;
  const s = document.createElement('span'); s.textContent = label;
  d.appendChild(s);
  return d;
}
function coverFor(book) {
  if (Number.isInteger(book.cover) && book.cover > 0) {
    const box = document.createElement('div');
    box.className = 'cover';
    const img = new Image();
    img.alt = ''; img.loading = 'lazy';
    img.onerror = () => box.replaceWith(genCover(book.title));
    img.src = 'https://covers.openlibrary.org/b/id/' + book.cover + '-M.jpg?default=false';
    box.appendChild(img);
    return box;
  }
  return genCover(book.title);
}
function decorate(listId, resolve) {
  $(listId).querySelectorAll(':scope > li').forEach((li) => {
    if (li.querySelector(':scope > .cover')) return;
    const el = resolve(li);
    if (el) li.prepend(el);
  });
}
const bookById = (id) => db.books.find((b) => b.id === id);
const resolvers = {
  books: (li) => { const b = li.querySelector('[data-lend]'); const bk = b && bookById(b.dataset.lend); return bk ? coverFor(bk) : null; },
  web: (li) => {
    const b = li.querySelector('[data-add]');
    const x = b && webResults[b.dataset.add];
    return x ? coverFor({ title: x.title, cover: x.cover }) : null;
  },
  loans: (li) => {
    const b = li.querySelector('[data-back]');
    const l = b && db.loans.find((x) => x.id === b.dataset.back);
    const bk = l && bookById(l.bookId);
    return bk ? coverFor(bk) : null;
  },
  dlist: (li) => {
    const m = (li.querySelector('b') || {}).textContent;
    const n = m && m.match(/^(\d+)-sinf/);
    return n ? genCover(n[1] + '-sinf') : null;
  },
};
Object.keys(resolvers).forEach((id) => {
  const run = () => decorate(id, resolvers[id]);
  new MutationObserver(run).observe($(id), { childList: true });
  run();
});

/* --- Telefonga o'rnatish (PWA) --- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });
window.addEventListener('appinstalled', () => { $('installBtn').hidden = true; });
if (matchMedia('(display-mode: standalone)').matches) $('installBtn').hidden = true;
$('installBtn').addEventListener('click', async () => {
  if (deferredInstall) {
    deferredInstall.prompt();
    try { await deferredInstall.userChoice; } catch { /* e'tibor bermaymiz */ }
    deferredInstall = null;
  } else {
    $('toast').textContent = 'Brauzer menyusidan «Ekranga qo‘shish» (Add to Home Screen) ni tanlang.';
  }
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* --- app.js ning render() funksiyasiga ulanamiz --- */
const baseRender = window.render;
if (typeof baseRender === 'function') {
  window.render = function () { baseRender(); renderReaderTable(); renderDashboard(); };
}
renderReaderTable();
renderDashboard();
animateStats();
})();
