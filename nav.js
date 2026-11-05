'use strict';
/* Chap menyu, sahifalar almashishi, yuqori qidiruv va o'quvchilar jadvali.
   app.js dagi db, activeLoans, overdue, cardNo va render ni ishlatadi. */
(function () {
  const $ = (id) => document.getElementById(id);
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

  /* --- Xabar bir necha soniyadan keyin o'chadi --- */
  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    if ($('toast').textContent) timer = setTimeout(() => { $('toast').textContent = ''; }, 4000);
  }).observe($('toast'), { childList: true, characterData: true, subtree: true });

  /* --- O'quvchilar jadvali va muddati tugaganlar belgisi --- */
  function renderReaderTable() {
    const body = $('readersBody');
    body.textContent = '';
    const active = activeLoans();
    [...db.readers].sort((a, b) => a.card - b.card).forEach((r) => {
      const tr = document.createElement('tr');
      [cardNo(r.card), r.name, r.phone || '—', active.filter((l) => l.readerId === r.id).length].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    $('readersCount').textContent = '· ' + db.readers.length + ' ta';
    const late = overdue().length;
    $('lateBadge').textContent = late;
    $('lateBadge').hidden = !late;
  }
  const baseRender = window.render;
  if (typeof baseRender === 'function') {
    window.render = function () { baseRender(); renderReaderTable(); };
  }
  renderReaderTable();
})();
