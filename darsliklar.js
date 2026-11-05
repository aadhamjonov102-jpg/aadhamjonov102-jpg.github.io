'use strict';
/* Maktab darsliklari: sinf va fan bo'yicha qidiruv. Havolalar infoedu.uz saytiga olib boradi.
   Yangi darslik qo'shish uchun ro'yxatga bitta qator yozing:
   { s: sinf, t: 'Fan nomi', f: 'Guruh', u: 'https://...' } */
(function () {
  const DARSLIKLAR = [{"s": 1,"t": "Ona tili (1-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/1/1-sinf-ona-tili"},{"s": 1,"t": "Ona tili (2-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/1/1-sinf-ona-tili-2-qism"},{"s": 1,"t": "Alifbe","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/1/1-sinf-alifbe"},{"s": 1,"t": "O‘qish savodxonligi (2-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/1/1-sinf-oqish-savodxonligi-2-qism"},{"s": 1,"t": "Matematika (1-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/1/1-sinf-matematika"},{"s": 1,"t": "Matematika (2-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/1/1-sinf-matematika-2-qism"},{"s": 1,"t": "Matematika (3-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/1/1-sinf-matematika-3-qism"},{"s": 1,"t": "Informatika","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/1/1-sinf-informatika"},{"s": 2,"t": "Ona tili (1-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/2/2-sinf-ona-tili"},{"s": 2,"t": "Ona tili (2-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/2/2-sinf-ona-tili-2-qism"},{"s": 2,"t": "Ona tili (3-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/2/2-sinf-ona-tili-3-qism"},{"s": 2,"t": "Ona tili (4-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/2/2-sinf-ona-tili-4-qism"},{"s": 2,"t": "Matematika (1-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/2/2-sinf-matematika"},{"s": 2,"t": "Matematika (2-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/2/2-sinf-matematika-2-qism"},{"s": 3,"t": "Ona tili (1-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/3/3-sinf-ona-tili"},{"s": 3,"t": "Ona tili (2-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/3/3-sinf-ona-tili-2-qism"},{"s": 3,"t": "Ona tili (3-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/3/3-sinf-ona-tili-3-qism"},{"s": 3,"t": "Ona tili (4-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/3/3-sinf-ona-tili-4-qism"},{"s": 3,"t": "Matematika (1-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/3/3-sinf-matematika"},{"s": 3,"t": "Matematika (2-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/3/3-sinf-matematika-2-qism"},{"s": 4,"t": "Ona tili (1-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/4/4-sinf-ona-tili"},{"s": 4,"t": "Ona tili (2-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/4/4-sinf-ona-tili-2-qism"},{"s": 4,"t": "Ona tili (3-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/4/4-sinf-ona-tili-3-qism"},{"s": 4,"t": "Ona tili (4-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/4/4-sinf-ona-tili-4-qism"},{"s": 4,"t": "Matematika (1-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/4/4-sinf-matematika"},{"s": 4,"t": "Matematika (2-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/4/4-sinf-matematika-2-qism"},{"s": 4,"t": "Tarbiya","f": "Ijtimoiy-tarixiy","u": "https://infoedu.uz/darsliklar/4/4-sinf-tarbiya"},{"s": 5,"t": "Ona tili (1-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/5/5-sinf-ona-tili"},{"s": 5,"t": "Ona tili (2-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/5/5-sinf-ona-tili-2-qism"},{"s": 5,"t": "O‘zbek tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/5/5-sinf-ozbek-tili"},{"s": 5,"t": "Matematika (1-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/5/5-sinf-matematika-1-qism"},{"s": 5,"t": "Matematika (2-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/5/5-sinf-matematika-2-qism"},{"s": 5,"t": "Ingliz tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/5/5-sinf-ingliz-tili"},{"s": 5,"t": "Adabiyot (1-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/5/5-sinf-adabiyot"},{"s": 6,"t": "Ona tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/6/6-sinf-ona-tili"},{"s": 6,"t": "Matematika (1-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/6/6-sinf-matematika"},{"s": 6,"t": "Matematika (mashq daftari)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/6/6-sinf-matematika-mashq-daftari"},{"s": 6,"t": "Ingliz tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/6/6-sinf-ingliz-tili"},{"s": 6,"t": "Adabiyot (1-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/6/6-sinf-adabiyot-1-qism"},{"s": 6,"t": "Adabiyot (2-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/6/6-sinf-adabiyot-2-qism"},{"s": 6,"t": "Fizika","f": "Tabiiy fanlar","u": "https://infoedu.uz/darsliklar/6/6-sinf-fizika"},{"s": 7,"t": "Ona tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/7/7-sinf-ona-tili"},{"s": 7,"t": "Algebra","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/7/7-sinf-algebra"},{"s": 7,"t": "Geometriya","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/7/7-sinf-geometriya"},{"s": 7,"t": "Ingliz tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/7/7-sinf-ingliz-tili"},{"s": 7,"t": "Adabiyot","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/7/7-sinf-adabiyot"},{"s": 7,"t": "Fizika","f": "Tabiiy fanlar","u": "https://infoedu.uz/darsliklar/7/7-sinf-fizika"},{"s": 7,"t": "Tarbiya","f": "Ijtimoiy-tarixiy","u": "https://infoedu.uz/darsliklar/7/7-sinf-tarbiya"},{"s": 8,"t": "Ona tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/8/8-sinf-ona-tili"},{"s": 8,"t": "Algebra","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/8/8-sinf-algebra"},{"s": 8,"t": "Geometriya","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/8/8-sinf-geometriya"},{"s": 8,"t": "Ingliz tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/8/8-sinf-ingliz-tili"},{"s": 8,"t": "Adabiyot","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/8/8-sinf-adabiyot"},{"s": 8,"t": "Fizika","f": "Tabiiy fanlar","u": "https://infoedu.uz/darsliklar/8/8-sinf-fizika"},{"s": 9,"t": "Ona tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/9/9-sinf-ona-tili"},{"s": 9,"t": "O‘zbek tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/9/9-sinf-ozbek-tili"},{"s": 9,"t": "Algebra","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/9/9-sinf-algebra"},{"s": 9,"t": "Geometriya","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/9/9-sinf-geometriya"},{"s": 9,"t": "Ingliz tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/9/9-sinf-ingliz-tili"},{"s": 9,"t": "Adabiyot","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/9/9-sinf-adabiyot"},{"s": 9,"t": "Fizika","f": "Tabiiy fanlar","u": "https://infoedu.uz/darsliklar/9/9-sinf-fizika"},{"s": 9,"t": "Tarbiya","f": "Ijtimoiy-tarixiy","u": "https://infoedu.uz/darsliklar/9/9-sinf-tarbiya"},{"s": 10,"t": "Ona tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/10/10-sinf-ona-tili"},{"s": 10,"t": "Matematika (Algebra)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/10/10-sinf-matematika"},{"s": 10,"t": "Geometriya","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/10/10-sinf-geometriya"},{"s": 10,"t": "Ingliz tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/10/10-sinf-ingliz-tili"},{"s": 10,"t": "Adabiyot (1-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/10/10-sinf-adabiyot-1-qism"},{"s": 10,"t": "Adabiyot (2-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/10/10-sinf-adabiyot-2-qism"},{"s": 11,"t": "Ona tili (1-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/11/11-sinf-ona-tili-1-qism"},{"s": 11,"t": "Ona tili (2-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/11/11-sinf-ona-tili-2-qism"},{"s": 11,"t": "Matematika (1-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/11/11-sinf-matematika-1-qism"},{"s": 11,"t": "Matematika (2-qism)","f": "Aniq fanlar","u": "https://infoedu.uz/darsliklar/11/11-sinf-matematika-2-qism"},{"s": 11,"t": "Ingliz tili","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/11/11-sinf-ingliz-tili"},{"s": 11,"t": "Adabiyot (2-qism)","f": "Tillar va adabiyot","u": "https://infoedu.uz/darsliklar/11/11-sinf-adabiyot-2-qism"}];
  const SAYT = 'https://infoedu.uz/darsliklar/';

  const $ = (id) => document.getElementById(id);
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[ʻʼ'‘’`´]/g, '');
  let sinf = 0;                                   // 0 = hamma sinflar

  function renderChips() {
    const box = $('dsinf');
    box.textContent = '';
    const make = (value, label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (sinf === value ? ' on' : '');
      b.dataset.sinf = value;
      b.textContent = label;
      box.appendChild(b);
    };
    make(0, 'Hammasi');
    for (let n = 1; n <= 11; n++) make(n, n + '-sinf');
  }

  function renderList() {
    const words = norm($('dq').value).split(/\s+/).filter(Boolean);
    const list = DARSLIKLAR.filter((d) => {
      if (sinf && d.s !== sinf) return false;
      const text = norm(d.s + '-sinf ' + d.t + ' ' + d.f);
      return words.every((w) => text.includes(w));
    });
    $('dinfo').textContent = list.length + ' ta darslik topildi';
    const ul = $('dlist');
    ul.textContent = '';
    for (const d of list) {
      const li = document.createElement('li');
      const left = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = d.s + '-sinf · ' + d.t;
      const br = document.createElement('br');
      const sm = document.createElement('small');
      sm.textContent = d.f;
      left.append(b, br, sm);
      const a = document.createElement('a');
      a.className = 'open';
      a.href = d.u;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Ochish ↗';
      li.append(left, a);
      ul.appendChild(li);
    }
    const more = $('dmore');
    more.hidden = !sinf;
    if (sinf) { more.href = SAYT + sinf; more.textContent = sinf + '-sinfning barcha darsliklari ↗'; }
  }

  $('dsinf').addEventListener('click', (e) => {
    if (e.target.dataset.sinf === undefined) return;
    sinf = Number(e.target.dataset.sinf);
    renderChips();
    renderList();
  });
  $('dq').addEventListener('input', renderList);
  renderChips();
  renderList();
})();
