'use strict';

/* ===== 1. Ma'lumotlarni saqlash (brauzerning localStorage'i) ===== */
const KEY = 'kutubxona-v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { books: [], readers: [], loans: [] };
  } catch {
    return { books: [], readers: [], loans: [] };
  }
}
function save() { localStorage.setItem(KEY, JSON.stringify(db)); }

let db = load();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const $ = (id) => document.getElementById(id);
// Foydalanuvchi yozgan matnni sahifaga qo'yishdan oldin shundan o'tkazing
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ===== 2. Sana bilan ishlash. Sanalar "YYYY-MM-DD" matni ko'rinishida ===== */
const DAY = 86400000;

function today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function toMs(s) { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); }
function addDays(s, n) { return new Date(toMs(s) + n * DAY).toISOString().slice(0, 10); }
function diffDays(a, b) { return Math.round((toMs(a) - toMs(b)) / DAY); }   // a - b, kunlarda
function fmt(s) { return s.split('-').reverse().join('.'); }                 // 2026-11-03 -> 03.11.2026
/* ===== 3. Qidiruv ===== */
// Katta-kichik harf, tutuq belgisi (o‘, g‘, ʻ) va aksentni e'tiborsiz qoldiradi
function norm(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[ʻʼ'‘’`´]/g, '');
}
function searchBooks(query) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [...db.books].sort((a, b) => a.title.localeCompare(b.title));
  return db.books.filter((b) => {
    const text = norm(b.title + ' ' + b.author + ' ' + b.genre);
    return words.every((w) => text.includes(w));   // hamma so'z topilishi kerak
  });
}
/* ===== 4. Nusxalar va mavjudlik ===== */
const activeLoans = () => db.loans.filter((l) => !l.returnedAt);
function available(book) {
  return book.copies - activeLoans().filter((l) => l.bookId === book.id).length;
}
/* ===== 5. Tekshirish (validatsiya) ===== */
function validName(s) {
  const words = s.trim().split(/\s+/);
  return words.length >= 2 && words.every((w) => w.length >= 2);
}
function validateBook(f) {
  const errors = {};
  if (f.title.trim().length < 2) errors.title = 'Kitob nomini kiriting';
  if (f.author.trim().length < 2) errors.author = 'Muallifni kiriting';
  if (f.year.trim() !== '') {
    const y = Number(f.year);
    if (!Number.isInteger(y) || y < 1000 || y > new Date().getFullYear()) errors.year = 'Yil noto‘g‘ri';
  }
  const c = Number(f.copies);
  if (!Number.isInteger(c) || c < 1 || c > 999) errors.copies = 'Nusxalar soni 1 dan 999 gacha bo‘lsin';
  return errors;
}
/* ===== 6. Berish va qaytarish ===== */
function overdue() { return activeLoans().filter((l) => l.dueAt < today()); }

// null qaytarsa, berish mumkin. Aks holda sababini matn qilib qaytaradi.
function canLend(bookId, readerId) {
  const book = db.books.find((b) => b.id === bookId);
  if (!readerId) return 'Avval o‘quvchini tanlang';
  if (!book) return 'Kitob topilmadi';
  if (available(book) < 1) return 'Barcha nusxalar berilgan';
  const mine = activeLoans().filter((l) => l.readerId === readerId);
  if (mine.some((l) => l.dueAt < today())) return 'Bu o‘quvchida muddati tugagan kitob bor';
  if (mine.length >= 5) return 'Bir o‘quvchiga 5 tadan ortiq kitob berilmaydi';
  if (mine.some((l) => l.bookId === bookId)) return 'Bu kitob o‘quvchida allaqachon bor';
  return null;
}
function lend(bookId, readerId, days = 14) {
  const err = canLend(bookId, readerId);
  if (err) return err;
  db.loans.push({ id: uid(), bookId, readerId, issuedAt: today(), dueAt: addDays(today(), days), returnedAt: null });
  save();
  return null;
}
function giveBack(loanId) {
  const l = db.loans.find((x) => x.id === loanId);
  if (l && !l.returnedAt) { l.returnedAt = today(); save(); }
}
/* ===== 7. Hisobot: eng ko'p o'qilgan kitoblar ===== */
function topBooks(limit = 10, sinceDays = null) {
  const from = sinceDays === null ? '' : addDays(today(), -sinceDays);
  const counts = {};
  for (const l of db.loans) if (l.issuedAt >= from) counts[l.bookId] = (counts[l.bookId] || 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, n]) => ({ book: db.books.find((b) => b.id === id), n }))
    .filter((x) => x.book);
}
/* ===== 8. Sahifani chizish ===== */
function renderStats() {
  const copies = db.books.reduce((s, b) => s + b.copies, 0);
  const out = activeLoans().length;
  $('stats').innerHTML = [
    ['Kitoblar nomi', db.books.length],
    ['Mavjud nusxalar', copies - out],
    ['Hozir berilgan', out],
    ['Muddati tugagan', overdue().length],
  ].map(([k, v]) => `<div class="card"><small>${k}</small><b>${v}</b></div>`).join('');
}

function renderReaders() {
  const keep = $('reader').value;
  $('reader').innerHTML = '<option value="">O‘quvchini tanlang</option>' +
    db.readers.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join('');
  $('reader').value = keep;
}

function renderBooks() {
  const list = searchBooks($('q').value);
  $('books').innerHTML = list.length ? list.map((b) => {
    const a = available(b);
    return `<li>
      <div><b>${esc(b.title)}</b><br><small>${esc(b.author)} · ${esc(b.genre)}</small></div>
      <span class="pill ${a ? 'ok' : 'no'}">${a} / ${b.copies} mavjud</span>
      <button data-lend="${b.id}" ${a ? '' : 'disabled'}>Berish</button>
    </li>`;
  }).join('') : '<li>Hech narsa topilmadi</li>';
}

function renderLoans() {
  const rows = activeLoans().sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  $('loans').innerHTML = rows.length ? rows.map((l) => {
    const b = db.books.find((x) => x.id === l.bookId);
    const r = db.readers.find((x) => x.id === l.readerId);
    const late = l.dueAt < today();
    const left = diffDays(l.dueAt, today());
    return `<li class="${late ? 'late' : ''}">
      <div><b>${esc(b ? b.title : '—')}</b><br><small>${esc(r ? r.name : '—')} · ${fmt(l.issuedAt)} → ${fmt(l.dueAt)}</small></div>
      <span class="pill ${late ? 'no' : 'ok'}">${late ? -left + ' kun kechikdi' : left + ' kun qoldi'}</span>
      <button data-back="${l.id}">Qaytarish</button>
    </li>`;
  }).join('') : '<li>Hozir berilgan kitob yo‘q</li>';
}

function renderTop() {
  const top = topBooks(10);
  $('top').innerHTML = top.length
    ? top.map(({ book, n }) => `<li>${esc(book.title)} — <b>${n}</b> marta</li>`).join('')
    : '<li>Hali berish yozuvlari yo‘q</li>';
}

function render() { renderStats(); renderReaders(); renderBooks(); renderLoans(); renderTop(); }
function toast(msg) { $('toast').textContent = msg; }
/* ===== 9. Tugmalar va formalar ===== */
$('q').addEventListener('input', renderBooks);

$('books').addEventListener('click', (e) => {
  const id = e.target.dataset.lend;
  if (!id) return;
  toast(lend(id, $('reader').value) || 'Kitob berildi');
  render();
});

$('loans').addEventListener('click', (e) => {
  const id = e.target.dataset.back;
  if (!id) return;
  giveBack(id);
  toast('Kitob qaytarildi');
  render();
});

$('bookForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const errors = validateBook(f);
  $('formError').textContent = Object.values(errors).join('. ');
  if (Object.keys(errors).length) return;
  db.books.push({
    id: uid(), title: f.title.trim(), author: f.author.trim(), genre: f.genre.trim() || 'Boshqa',
    year: f.year.trim() ? Number(f.year) : null, copies: Number(f.copies),
  });
  save();
  e.target.reset();
  e.target.elements.copies.value = 1;
  render();
});
/* ===== 10. Kirishdan oldin ism-familiya ===== */
const NAME_KEY = 'kutubxona-ism';

function enter(name) {
  localStorage.setItem(NAME_KEY, name);
  $('gate').hidden = true;
  $('app').hidden = false;
  $('who').textContent = name;
  render();
}
$('gateForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('fullName').value.trim().replace(/\s+/g, ' ');
  if (!validName(name)) { $('gateError').textContent = 'Ism va familiyani to‘liq yozing'; return; }
  enter(name);
});
const savedName = localStorage.getItem(NAME_KEY);
if (savedName) enter(savedName);
/* ===== 11. Namuna ma'lumotlar (sinash uchun) ===== */
function seed() {
  const day = (n) => addDays(today(), n);
  db.books = [
    ['O‘tkan kunlar', 'Abdulla Qodiriy', 'Roman', 3],
    ['Sariq devni minib', 'Xudoyberdi To‘xtaboyev', 'Bolalar adabiyoti', 4],
    ['Shum bola', 'G‘afur G‘ulom', 'Badiiy adabiyot', 2],
    ['Alkimyogar', 'Paulo Coelho', 'Roman', 3],
    ['1984', 'George Orwell', 'Fantastika', 2],
    ['Clean Code', 'Robert C. Martin', 'Dasturlash', 2],
  ].map(([title, author, genre, copies]) => ({ id: uid(), title, author, genre, year: null, copies }));

  db.readers = ['Aziza Karimova', 'Jasur Rahmonov', 'Malika Yusupova', 'Bobur Aliyev']
    .map((name, i) => ({ id: uid(), name, phone: '90123456' + i }));

  const [b1, b2, b3, b4, b5, b6] = db.books;
  const [r1, r2, r3, r4] = db.readers;
  // loan(kitob, o'quvchi, necha kun oldin berilgan, muddat kunlari, qaytarilgan kun yoki null)
  const loan = (b, r, ago, len, back) => ({
    id: uid(), bookId: b.id, readerId: r.id,
    issuedAt: day(-ago), dueAt: day(-ago + len), returnedAt: back === null ? null : day(back),
  });
  db.loans = [
    loan(b1, r1, 40, 14, -30), loan(b2, r2, 30, 14, -20), loan(b1, r3, 20, 14, -8), loan(b2, r4, 10, 14, -2),
    loan(b5, r1, 25, 14, null),                                   // muddati o'tgan
    loan(b3, r2, 3, 14, null), loan(b6, r3, 2, 14, null), loan(b4, r4, 1, 14, null),
  ];
  save();
}
$('seed').addEventListener('click', () => { seed(); render(); toast('Namuna ma’lumotlar yozildi'); });
// Birinchi marta kirgan odamga katalog bo'sh ko'rinmasin
if (db.books.length === 0) { seed(); render(); }
