/* Perilaku bersama shell admin Temu Karsa: rail navy jadi menu geser di layar
   kecil. Tombol menu & scrim-nya dibikin di sini (bukan ditulis manual di tiap
   halaman) supaya markup Dashboard / Artikel / Leads tetap identik — halaman
   Artikel yang isinya diambil alih Decap CMS pun kebagian tombolnya. */
(function () {
  var sidebar = document.querySelector('.shell__sidebar');
  if (!sidebar) return;

  var scrim = document.createElement('div');
  scrim.className = 'shell__scrim';
  document.body.appendChild(scrim);

  var burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'shell__burger';
  burger.setAttribute('aria-label', 'Buka menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>';

  var topbar = document.querySelector('.shell__topbar');
  if (topbar) topbar.insertBefore(burger, topbar.firstChild);

  // Tombol tutup (X), gantiin logo di rail pas lagi kebuka jadi menu geser
  // (lihat .shell__close di shell.css) — logo-nya udah ada di topbar, gak
  // perlu diulang di dalam rail yang lagi kebuka.
  var brand = document.querySelector('.shell__brand');
  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'shell__close';
  closeBtn.setAttribute('aria-label', 'Tutup menu');
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>';
  if (brand) brand.appendChild(closeBtn);
  closeBtn.addEventListener('click', function () { setOpen(false); });

  function setOpen(open) {
    sidebar.classList.toggle('is-open', open);
    scrim.classList.toggle('is-open', open);
    document.body.classList.toggle('has-rail-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  }

  burger.addEventListener('click', function () {
    setOpen(!sidebar.classList.contains('is-open'));
  });
  scrim.addEventListener('click', function () { setOpen(false); });
  sidebar.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setOpen(false);
  });
})();
