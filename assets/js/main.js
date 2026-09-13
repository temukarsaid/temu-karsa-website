/* ==========================================================================
   Temu Karsa — interaksi homepage (vanilla JS, tanpa dependency)
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* --------------------------------------------------------------- header */
  function initHeader() {
    var header = $('#header');
    var burger = $('#burger');
    var nav    = $('#nav');
    if (!header) return;

    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (burger && nav) {
      var closeMobileNav = function () {
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        var layanan = $('#navLayanan');
        if (layanan) {
          layanan.classList.remove('is-open');
          $('.nav__trigger', layanan).setAttribute('aria-expanded', 'false');
        }
      };

      burger.addEventListener('click', function () {
        var open = !nav.classList.contains('is-open');
        if (open) {
          nav.classList.add('is-open');
          burger.classList.add('is-open');
          burger.setAttribute('aria-expanded', 'true');
        } else {
          closeMobileNav();
        }
      });
      $$('a', nav).forEach(function (a) {
        a.addEventListener('click', closeMobileNav);
      });
    }
  }

  /* ------------------------------------------------ dropdown nav "Layanan" */
  function initNavDropdown() {
    var item = $('#navLayanan');
    if (!item) return;

    var trigger  = $('.nav__trigger', item);
    var isMobile = function () { return window.matchMedia('(max-width: 980px)').matches; };

    var close = function () {
      item.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };
    var open = function () {
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      // di desktop, hover sudah cukup — klik hanya dibutuhkan untuk mobile/keyboard
      if (item.classList.contains('is-open')) close(); else open();
    });

    document.addEventListener('click', function (e) {
      if (!item.contains(e.target)) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    // klik link di dalam dropdown menutup accordion-nya sendiri di mobile
    $$('a', item).forEach(function (a) {
      a.addEventListener('click', function () { if (isMobile()) close(); });
    });
  }

  /* ------------------------------------------------- rotator kata di hero */
  function initRotator() {
    var box = $('#rotator');
    if (!box) return;

    var items = $$('span', box);
    if (items.length < 2) return;

    // kunci lebar agar heading tidak "loncat" saat kata berganti
    var i = 0;
    items[0].classList.add('is-active');
    if (reduced) return;

    window.setInterval(function () {
      var cur = items[i];
      i = (i + 1) % items.length;
      var next = items[i];

      cur.classList.remove('is-active');
      cur.classList.add('is-out');
      next.classList.remove('is-out');
      next.classList.add('is-active');

      window.setTimeout(function () { cur.classList.remove('is-out'); }, 650);
    }, 2600);
  }

  /* --------------------------------------------------- pill highlight hero */
  function initPills() {
    var pills = $$('#pillStack li');
    if (!pills.length) return;

    var i = 0;
    pills[0].classList.add('is-active');
    if (reduced) return;

    window.setInterval(function () {
      pills[i].classList.remove('is-active');
      i = (i + 1) % pills.length;
      pills[i].classList.add('is-active');
    }, 2200);
  }

  /* ----------------------------------------------------- marquee duplikat */
  function initMarquee() {
    $$('.marquee').forEach(function (m) {
      var track = $('.marquee__track', m);
      if (track) m.appendChild(track.cloneNode(true));
    });
  }

  /* --------------------------------------------- reveal + counter + bars  */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var dec    = (el.dataset.decimals | 0);
    if (isNaN(target)) return;

    if (reduced) { el.textContent = target.toFixed(dec) + suffix; return; }

    var dur = 1500, t0 = null;
    var step = function (ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  function initObservers() {
    var targets = $$('[data-reveal], [data-count], [data-bar]');

    var show = function (el) {
      if (el.classList.contains('is-in')) return;
      el.classList.add('is-in');
      if (el.dataset.count) countUp(el);
      if (el.dataset.bar) el.style.width = el.dataset.bar + '%';
    };

    if (!('IntersectionObserver' in window)) {
      targets.forEach(show);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var delay = parseInt(el.dataset.delay || '0', 10);

        window.setTimeout(function () { show(el); }, reduced ? 0 : delay);
        io.unobserve(el);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });

    targets.forEach(function (el) { io.observe(el); });

    // Pengaman: elemen yang sudah berada di viewport saat load langsung ditampilkan,
    // dan bila observer tidak pernah terpanggil (tab tersembunyi, render di-throttle,
    // browser lawas) seluruh konten tetap muncul — bukan terkunci pada opacity 0.
    var sweep = function () {
      var vh = window.innerHeight || 0;
      targets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) show(el);
      });
    };
    window.setTimeout(sweep, 1200); // beri waktu animasi reveal normal jalan dulu
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) sweep();
    });
    window.setTimeout(function () { targets.forEach(show); }, 6000);
  }

  /* ------------------------------------------------------------------ FAQ */
  function initFaq() {
    $$('.faq__item').forEach(function (item) {
      var btn = $('.faq__q', item);
      if (!btn) return;

      btn.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        // akordion: tutup yang lain
        $$('.faq__item.is-open').forEach(function (o) {
          o.classList.remove('is-open');
          $('.faq__q', o).setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ------------------------------------------------------ Filter artikel */
  /* Tab kategori + search + pagination di halaman artikel.html — semua
     kartu tetap statis di DOM (data-category), ini cuma nge-toggle
     `hidden` sesuai filter/pencarian/halaman aktif. Dilewati kalau
     elemen-elemennya tidak ada di halaman (aman dipanggil di semua
     halaman lain). */
  function initArticleFilter() {
    var bar = $('.article-filter');
    if (!bar) return;

    var buttons = $$('.article-filter__btn', bar);
    var tiles   = $$('.article-tile');
    var search  = $('#articleSearch');
    var pager   = $('#articlePagination');
    var empty   = $('#articleEmpty');
    var PER_PAGE = 9;

    var state = { filter: 'semua', query: '', page: 1 };

    function matches(tile) {
      if (state.filter !== 'semua' && tile.dataset.category !== state.filter) return false;
      if (!state.query) return true;
      var title = (tile.querySelector('.article-tile__title') || {}).textContent || '';
      var desc  = (tile.querySelector('.article-tile__desc') || {}).textContent || '';
      var haystack = (title + ' ' + desc).toLowerCase();
      return haystack.indexOf(state.query) !== -1;
    }

    function renderPager(totalPages) {
      if (!pager) return;
      pager.innerHTML = '';
      if (totalPages <= 1) return;

      function addBtn(label, page, opts) {
        opts = opts || {};
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'article-pagination__btn' + (opts.active ? ' is-active' : '');
        b.textContent = label;
        if (opts.disabled) b.disabled = true;
        b.addEventListener('click', function () { state.page = page; render(); });
        pager.appendChild(b);
      }

      addBtn('‹', state.page - 1, { disabled: state.page === 1 });
      for (var i = 1; i <= totalPages; i++) {
        addBtn(String(i), i, { active: i === state.page });
      }
      addBtn('›', state.page + 1, { disabled: state.page === totalPages });
    }

    function render() {
      var visible = tiles.filter(matches);
      var totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
      if (state.page > totalPages) state.page = totalPages;
      if (state.page < 1) state.page = 1;

      var start = (state.page - 1) * PER_PAGE;
      var end = start + PER_PAGE;
      var pageSet = visible.slice(start, end);

      tiles.forEach(function (tile) {
        tile.hidden = pageSet.indexOf(tile) === -1;
      });

      if (empty) empty.hidden = visible.length !== 0;
      renderPager(totalPages);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        state.filter = btn.dataset.filter;
        state.page = 1;
        render();
      });
    });

    if (search) {
      search.addEventListener('input', function () {
        state.query = search.value.trim().toLowerCase();
        state.page = 1;
        render();
      });
    }

    render();
  }

  /* ------------------------------------------------------- Deck carousel(s) */
  /* Dek kartu ala Stripe: kartu aktif melebar, kartu berikutnya jadi strip
     bertingkat, kartu yang sudah dilewati menyusut sampai hilang. Lebar diatur
     lewat atribut data-pos yang dibaca CSS. Generic — dipanggil ulang dengan
     id track/tombol/caption berbeda supaya satu halaman bisa punya lebih dari
     satu carousel (mis. Artikel di homepage & Ruang Kerja di L1 workspace)
     tanpa duplikasi logika. `caption` opsional (dilewati kalau tidak ada). */
  function initDeckCarousel(opts) {
    var track = $(opts.track);
    if (!track) return;

    var prev    = $(opts.prev);
    var next    = $(opts.next);
    var caption = opts.caption ? $(opts.caption) : null;
    var captionLink = opts.caption ? document.querySelector(opts.caption + ' + a') : null;
    var span    = 550;                   // harus sama dengan durasi transisi .acard
    var slots   = 5;                     // kartu yang terlihat: 1 aktif + 4 strip
    var locked  = false;

    /* Dek digandakan supaya di belakang strip terakhir selalu ada kartu
       menunggu dengan lebar 0. Tanpa ini, kartu penerus baru bisa muncul
       setelah animasi selesai — terasa seperti jeda. */
    var order = $$('.acard', track);
    order.slice().forEach(function (card) {
      var copy = card.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.setAttribute('tabindex', '-1');
      track.appendChild(copy);
      order.push(copy);
    });

    var place = function () {
      order.forEach(function (card, i) {
        card.setAttribute('data-pos', i === 0 ? 'active' : (i < slots ? String(i + 1) : 'past'));
      });
    };

    var updateCaption = function () {
      if (!caption) return;
      var lead = order[0].dataset.lead || '';
      var desc = order[0].dataset.desc || '';
      var href = order[0].dataset.href || '#';
      var swap = function () {
        $('strong', caption).textContent = lead;
        $('span', caption).textContent = desc;
        if (captionLink) captionLink.setAttribute('href', href);
      };

      if (reduced) { swap(); return; }
      caption.classList.add('is-swapping');
      window.setTimeout(function () {
        swap();
        caption.classList.remove('is-swapping');
      }, 280);
    };

    /* Maju n langkah: kartu terdepan menyusut sampai hilang sementara kartu
       yang menunggu di ekor ikut memekar pada saat yang sama, jadi tidak ada
       jeda. Node yang sudah lewat baru dipindah ke ekor setelah animasi —
       di sana lebarnya 0, jadi perpindahannya tak terlihat. */
    var forward = function (n) {
      if (locked || n < 1) return;
      locked = true;

      var moved = order.slice(0, n);
      order = order.slice(n).concat(moved);
      place();
      updateCaption();

      window.setTimeout(function () {
        moved.forEach(function (card) { track.appendChild(card); });
        locked = false;
      }, reduced ? 0 : span);
    };

    /* Mundur: kartu paling ekor dipindah ke depan dalam keadaan menyusut, lalu
       dimekarkan jadi kartu aktif. */
    var backward = function () {
      if (locked) return;
      locked = true;

      var card = order[order.length - 1];
      order = [card].concat(order.slice(0, order.length - 1));

      track.insertBefore(card, track.firstChild);
      card.setAttribute('data-pos', 'past');
      void card.offsetWidth;              // paksa reflow supaya transisi 0 → lebar jalan
      place();
      updateCaption();

      window.setTimeout(function () { locked = false; }, reduced ? 0 : span);
    };

    prev && prev.addEventListener('click', backward);
    next && next.addEventListener('click', function () { forward(1); });

    // kartu yang belum aktif berfungsi sebagai tombol untuk melompat ke sana
    order.forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (card.getAttribute('href') === '#') e.preventDefault();
        forward(order.indexOf(card));
      });
      // kartu non-<a> (mis. galeri foto tanpa link) diberi role="button" —
      // browser tidak otomatis memicu klik lewat keyboard untuk itu, jadi
      // Enter/Space ditangani manual supaya tetap bisa diakses keyboard.
      if (card.getAttribute('role') === 'button') {
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
          }
        });
      }
    });

    place();
    updateCaption();

    /* Autoplay opsional — maju sendiri tiap `opts.autoplay` ms, loop tanpa
       henti (dek-nya memang sudah didesain sirkular). Berhenti sebentar saat
       pointer/keyboard fokus di area carousel supaya tidak mengganggu saat
       pengunjung lagi lihat-lihat, lalu jalan lagi begitu ditinggal. Dilewati
       total kalau prefers-reduced-motion aktif. */
    if (opts.autoplay && !reduced) {
      var timer = null;
      var start = function () {
        stop();
        timer = window.setInterval(function () { forward(1); }, opts.autoplay);
      };
      var stop = function () { if (timer) { window.clearInterval(timer); timer = null; } };

      track.addEventListener('mouseenter', stop);
      track.addEventListener('mouseleave', start);
      track.addEventListener('focusin', stop);
      track.addEventListener('focusout', start);
      document.addEventListener('visibilitychange', function () {
        document.hidden ? stop() : start();
      });

      start();
    }
  }

  /* -------------------------------------------------------------- AI box */
  var AI_EXAMPLES = [
    'Saya mau dirikan PT tapi belum tahu mulai dari mana...',
    'Saya mau cek KBLI usaha saya...',
    'Berapa biaya sewa Virtual Office?',
    'Saya butuh ruang meeting di Bekasi...',
    'Apa syarat pendirian CV?',
    'Bagaimana cara mengurus NIB?',
    'Apa bedanya PT Perorangan sama PT PMA?',
    'Saya mau daftarkan merek usaha saya...',
    'Coworking space di Bekasi ada apa aja?',
    'Berapa lama proses legalitas sampai selesai?'
  ];

  /* Placeholder yang mengetik & menghapus bergantian antar contoh pertanyaan.
     Placeholder asli HTML statis, jadi teksnya diketik manual karakter demi
     karakter ke overlay <div>, lalu dihapus lagi sebelum ganti ke contoh
     berikutnya — mati total begitu user fokus/mengisi kotaknya. */
  function initAiPlaceholder(input) {
    var wrap = $('#aiPlaceholder');
    if (!wrap) return;

    var textEl = $('.ai-box__ptext', wrap);
    var i = 0, timer = null;

    var stop = function () {
      if (timer) { clearTimeout(timer); timer = null; }
    };

    var loop = function () {
      var full = AI_EXAMPLES[i % AI_EXAMPLES.length];

      if (reduced) {
        textEl.textContent = full;
        timer = window.setTimeout(loop, 2600);
        return;
      }

      var pos = 0;
      var type = function () {
        textEl.textContent = full.slice(0, pos);
        if (pos < full.length) {
          pos++;
          timer = window.setTimeout(type, 42);
        } else {
          timer = window.setTimeout(erase, 1600);
        }
      };
      var erase = function () {
        textEl.textContent = full.slice(0, pos);
        if (pos > 0) {
          pos--;
          timer = window.setTimeout(erase, 22);
        } else {
          i++;
          timer = window.setTimeout(loop, 300);
        }
      };
      type();
    };

    var show = function () {
      wrap.style.display = '';
      if (!timer) loop();
    };
    var hide = function () {
      wrap.style.display = 'none';
      stop();
    };

    input.addEventListener('focus', hide);
    input.addEventListener('input', function () {
      if (input.value.length) hide(); else if (document.activeElement !== input) show();
    });
    input.addEventListener('blur', function () {
      if (!input.value.length) show();
    });

    show();
  }

  function initAiBox() {
    var box = $('#aiBox');
    if (!box) return;

    var input = $('#aiInput', box);
    var count = $('#aiCount', box);
    var send  = $('#aiSend', box);

    var refresh = function () {
      var len = input.value.length;
      count.textContent = len;
      var ready = len > 0;
      send.disabled = !ready;
      send.classList.toggle('is-ready', ready);
    };

    input.addEventListener('input', refresh);
    initAiPlaceholder(input);

    $$('.ai-chip', box).forEach(function (chip) {
      chip.addEventListener('click', function () {
        input.value = chip.textContent.trim() + ': ';
        input.focus();
        refresh();
      });
    });

    box.addEventListener('submit', function (e) {
      e.preventDefault();
      // TODO: sambungkan ke endpoint AI konsultasi bisnis
    });

    refresh();
  }

  /* ----------------------------------------------------------------- form */
  function initForm() {
    var form = $('#bookingForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var namaDepan = (form.nama.value || '').trim();
      var namaBelakang = form.nama_belakang ? (form.nama_belakang.value || '').trim() : '';
      var namaLengkap = (namaDepan + ' ' + namaBelakang).trim();
      var email = form.email ? (form.email.value || '').trim() : '';
      var telepon = form.telepon ? (form.telepon.value || '').trim() : '';
      var layanan = form.layanan ? form.layanan.value : '';
      var jadwal = form.jadwal ? form.jadwal.value : '';
      var pesan = form.pesan ? (form.pesan.value || '').trim() : '';

      // rapikan "2026-09-20T14:30" jadi "20/09/2026 14:30" biar enak dibaca di WA
      var jadwalRapi = jadwal;
      if (jadwal) {
        var d = new Date(jadwal);
        if (!isNaN(d)) {
          var pad = function (n) { return String(n).padStart(2, '0'); };
          jadwalRapi = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        }
      }

      var lines = ['Halo Temu Karsa, saya ingin mengajukan konsultasi dengan detail berikut:', ''];
      lines.push('Nama: ' + (namaLengkap || '-'));
      if (email) lines.push('Email: ' + email);
      if (telepon) lines.push('No. WhatsApp: ' + telepon);
      if (layanan) lines.push('Jenis Layanan: ' + layanan);
      if (jadwal) lines.push('Jadwal Konsultasi: ' + jadwalRapi);
      if (pesan) lines.push('Pesan: ' + pesan);

      var waText = encodeURIComponent(lines.join('\n'));
      window.open('https://wa.me/6285121558129?text=' + waText, '_blank', 'noopener');

      var status = $('#formStatus');
      if (status) {
        status.textContent =
          'Terima kasih, ' + (namaDepan || 'Bapak/Ibu') +
          '! Anda akan diarahkan ke WhatsApp Temu Karsa untuk melanjutkan.';
        status.classList.add('is-shown');
      }
      form.reset();
    });
  }

  /* ------------------------------------------------------------ blog toc */
  function initBlogToc() {
    var toc = $('.blog-toc');
    if (!toc) return;
    var links = $$('.blog-toc__link', toc);
    var targets = links.map(function (link) {
      return document.getElementById(link.getAttribute('href').slice(1));
    }).filter(Boolean);
    if (!targets.length) return;

    var setActive = function (id) {
      links.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
      });
    };

    if (!('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: '-130px 0px -70% 0px', threshold: 0 });

    targets.forEach(function (target) { io.observe(target); });
  }

  /* ------------------------------------------------------- process lines */
  /* Garis penghubung antar dot "Cara Kerja Kami". Dulu 1 garis statis (desktop
     = 1 baris 5 kartu), tapi begitu layar menyempit kartu bisa jadi 2 baris
     (mis. tablet: 3 + 2) dan baris ke-2 di-center — posisi garisnya nggak
     bisa dipatok persen tetap lagi. Jadi dot dikelompokkan per baris
     berdasarkan posisi vertikalnya, lalu 1 garis dibuat utk tiap baris yang
     isinya ≥2 dot (baris isi 1 dot, kayak di mobile, dilewatin — di situ
     sambungannya udah dari garis vertikal ::before punya .process__step). */
  function initProcessLines() {
    var track = $('.process__track');
    if (!track) return;
    var dots = $$('.process__dot', track);
    if (dots.length < 2) return;

    var render = function () {
      $$('.process__line', track).forEach(function (el) { el.remove(); });

      var trackRect = track.getBoundingClientRect();
      var rows = [];
      dots.forEach(function (dot) {
        var r = dot.getBoundingClientRect();
        var y = Math.round(r.top - trackRect.top);
        var row = rows.filter(function (row) { return Math.abs(row.y - y) < 4; })[0];
        if (!row) { row = { y: y, dots: [] }; rows.push(row); }
        row.dots.push(r);
      });

      rows.forEach(function (row) {
        if (row.dots.length < 2) return;
        var first = row.dots[0];
        var last = row.dots[row.dots.length - 1];
        var line = document.createElement('div');
        line.className = 'process__line';
        line.style.left = Math.round(first.left + first.width / 2 - trackRect.left) + 'px';
        line.style.right = Math.round(trackRect.right - (last.left + last.width / 2)) + 'px';
        line.style.top = Math.round(row.y + first.height / 2) + 'px';
        track.appendChild(line);
      });
    };

    render();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 150);
    });
    window.addEventListener('load', render);

    /* dot-dot ini juga [data-reveal] (translateY 28px -> 0 pas discroll ke
       viewport, lihat initObservers). Garis di-render() duluan sebelum
       animasi itu jalan, jadi posisinya kepatok di titik SEBELUM dot
       geser ke tempat akhirnya — begitu animasi kelar, dot pindah tapi
       garis diem, jadinya keliatan "ga center". Render ulang tiap ada
       transitionend transform yang kelar di dalam track. */
    track.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'transform') render();
    });
  }

  /* ----------------------------------------------------------------- init */
  function boot() {
    initHeader();
    initNavDropdown();
    initRotator();
    initPills();
    initMarquee();
    initObservers();
    initFaq();
    initArticleFilter();
    initDeckCarousel({ track: '#articleTrack', prev: '#articlePrev', next: '#articleNext', caption: '#articleCaption' });
    initDeckCarousel({ track: '#workspaceTrack', prev: '#workspacePrev', next: '#workspaceNext', autoplay: 3200 });
    initAiBox();
    initForm();
    initBlogToc();
    initProcessLines();
    $('#year') && ($('#year').textContent = new Date().getFullYear());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
