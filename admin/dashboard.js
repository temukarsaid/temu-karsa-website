/* Dashboard home "Lini Masa Performa" — semua angka & grafik dihitung di
   browser dari dua daftar yang sama dipakai halaman Legal Check & Checklist
   Dokumen (/api/leads, /api/checklist-leads). Gak ada data pengunjung/traffic
   di sini; jangan tambah angka yang gak ada sumbernya. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var HOUR = 3600000;
  var DAY = 24 * HOUR;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var BENTUK_LABEL = { perorangan: 'Perorangan / UMKM', cv: 'CV', pt: 'PT', yayasan: 'Yayasan / Koperasi' };
  var KATEGORI_LABEL = { makanan: 'Makanan & Minuman', dagang: 'Perdagangan', jasa: 'Jasa', manufaktur: 'Manufaktur', akomodasi: 'Akomodasi & Pariwisata' };
  var LAYANAN_LABEL = { 'pendirian-pt': 'Pendirian PT', 'pendirian-cv': 'Pendirian CV', 'nib-perizinan': 'NIB & Perizinan Berusaha', 'legalitas-pertanahan': 'Legalitas Pertanahan' };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  var ICON_WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-4.95A9 9 0 1 1 8 19.5z"/></svg>';
  var ICON_DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  var state = { days: 30, profile: 'bentuk', leads: [], checklist: [], loaded: false, error: null, traffic: null, trafficLoading: false, webDays: 30, web: null, webLoading: false, ctaDays: 30, cta: null, ctaLoading: false };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { return Number(n || 0).toLocaleString('id-ID'); }
  function pct(part, total) { return total ? Math.round((part / total) * 100) : 0; }
  function startOfDay(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function shortDate(t) { var d = new Date(t); return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function longDate(t) { var d = new Date(t); return DAYS_ID[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function rangeDate(a, b) {
    var x = new Date(a), y = new Date(b);
    return x.getMonth() === y.getMonth()
      ? x.getDate() + '–' + y.getDate() + ' ' + MONTHS[y.getMonth()] + ' ' + y.getFullYear()
      : shortDate(a) + ' – ' + shortDate(b) + ' ' + y.getFullYear();
  }
  function slotLabel(s) { return s.t === s.end ? longDate(s.t) : rangeDate(s.t, s.end); }
  function isSent(r) { return r.status === 'pdf_siap'; }

  function age(ms) {
    if (ms < HOUR) return Math.max(1, Math.round(ms / 60000)) + ' menit';
    if (ms < DAY) return Math.floor(ms / HOUR) + ' jam';
    return Math.floor(ms / DAY) + ' hari';
  }
  function urgency(ms) { return ms > DAY ? 'is-late' : ms > 12 * HOUR ? 'is-soon' : ''; }

  function inPeriod(rows) {
    var from = startOfDay(Date.now()) - (state.days - 1) * DAY;
    return rows.filter(function (r) { return new Date(r.created_at).getTime() >= from; });
  }

  /* ================================================================ Metrics */
  function renderMetrics() {
    var all = state.leads.concat(state.checklist);
    var sent = all.filter(isSent).length;
    $('statTotalLeads').textContent = num(all.length);
    $('statSiap').textContent = num(sent);
    $('statBaru').textContent = num(all.length - sent);
  }

  // Belum ada API daftar artikel — ditarik dari file JSON sumbernya; daftar
  // slug disamain manual kalau ada artikel baru/dihapus.
  var ARTICLE_SLUGS = ['pembuatan-cv', 'pt-perorangan-pmdn-pma', 'kbli-2025', 'kbli-2025-explained', 'rekomendasi-meeting-room-bekasi'];
  function loadArticleCount() {
    Promise.all(ARTICLE_SLUGS.map(function (slug) {
      return fetch('/eleventy/articles/' + slug + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    })).then(function (articles) {
      $('statArtikel').textContent = num(articles.filter(function (a) { return a && a.draft !== true; }).length);
    });
  }

  /* ================================================================ Trend */
  // 7 & 30 hari = satu batang per hari. 90 hari = satu batang per minggu:
  // 90 batang harian + garis dikirim yang naik-turun tiap hari jadi gerigi
  // yang gak kebaca. Minggu terakhir selalu berakhir di hari ini; minggu
  // pertama boleh kepotong di awal periode.
  function bucketDays() { return state.days > 45 ? 7 : 1; }

  function buildSeries() {
    var today = startOfDay(Date.now());
    var size = bucketDays();
    var count = Math.ceil(state.days / size);
    var periodStart = today - (state.days - 1) * DAY;
    var series = [];
    for (var i = 0; i < count; i++) {
      var end = today - (count - 1 - i) * size * DAY;
      series.push({ t: Math.max(periodStart, end - (size - 1) * DAY), end: end, lc: 0, cl: 0, lcSent: 0, clSent: 0, sent: 0 });
    }
    function add(rows, field) {
      rows.forEach(function (r) {
        var d = startOfDay(r.created_at);
        if (d < periodStart || d > today) return;
        var slot = series[count - 1 - Math.floor((today - d) / (size * DAY))];
        if (!slot) return;
        slot[field]++;
        if (isSent(r)) { slot[field + 'Sent']++; slot.sent++; }
      });
    }
    add(state.leads, 'lc');
    add(state.checklist, 'cl');
    return series;
  }

  function niceScale(max) {
    if (max <= 4) return { top: Math.max(max, 1) <= 2 ? 2 : 4, step: 1 };
    var steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
    for (var i = 0; i < steps.length; i++) {
      var top = Math.ceil(max / steps[i]) * steps[i];
      if (top / steps[i] <= 4) return { top: top, step: steps[i] };
    }
    return { top: Math.ceil(max / 100) * 100, step: Math.ceil(max / 400) * 100 };
  }

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVGNS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function segPath(x, y, w, h, r) {
    if (!r) return 'M' + x + ',' + (y + h) + 'V' + y + 'H' + (x + w) + 'V' + (y + h) + 'Z';
    r = Math.min(r, w / 2, h);
    return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
      'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
  }

  var chartGeom = null;
  var activeIndex = -1;

  // Satu batang = satu hari/minggu, ditumpuk dari bawah: Legal Check terkirim,
  // Legal Check belum dikirim (pudar), Checklist terkirim, Checklist belum
  // dikirim (pudar). Bagian pudar = antrian yang lahir di hari itu, jadi
  // selisih "masuk vs dikirim" kebaca langsung dari bentuk batangnya.
  function renderTrend(animate) {
    var host = $('trendChart');
    if (!state.loaded) return;
    var series = buildSeries();
    var total = 0, sent = 0, busiest = null;
    series.forEach(function (s) {
      var n = s.lc + s.cl;
      total += n; sent += s.sent;
      if (n && (!busiest || n >= busiest.n)) busiest = { n: n, t: s.t };
    });
    var weekly = bucketDays() > 1;
    $('trendTitleText').textContent = weekly ? 'Submission mingguan' : 'Submission harian';
    $('trendSummary').innerHTML = state.error
      ? 'Data submission gagal dimuat: ' + esc(state.error)
      : '<b>' + num(total) + '</b> submission dalam ' + state.days + ' hari terakhir · <b>' + num(sent) + '</b> sudah dikirim (' + pct(sent, total) + '%)' +
        (busiest ? ' · paling ramai <b>' + (weekly ? 'minggu ' + shortDate(busiest.t) : shortDate(busiest.t)) + '</b> (' + busiest.n + ')' : '');

    var W = host.clientWidth, H = host.clientHeight;
    var m = { l: 30, r: 6, t: 10, b: 26 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var maxN = 0;
    series.forEach(function (s) { maxN = Math.max(maxN, s.lc + s.cl); });
    var sc = niceScale(maxN);
    var y = function (v) { return m.t + ih - (v / sc.top) * ih; };
    var slot = iw / series.length;
    var bw = Math.max(2, Math.min(28, slot * (series.length > 20 ? 0.66 : 0.52)));
    var gap = bw > 4 ? 1.5 : 1;

    host.innerHTML = '';
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' }, host);
    if (animate) svg.classList.add('is-growing');

    var grid = el('g', { class: 'grid' }, svg);
    for (var v = 0; v <= sc.top; v += sc.step) {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 ? 'is-base' : '' }, grid);
      var lab = el('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, svg);
      lab.textContent = v;
    }

    var band = el('rect', { class: 'band', x: 0, y: m.t - 4, width: slot, height: ih + 4, rx: 6 }, svg);
    var bars = el('g', {}, svg);
    var centers = [];
    series.forEach(function (s, i) {
      var cx = m.l + slot * i + slot / 2;
      centers.push(cx);
      var segs = [
        { cls: 'bar bar-lc', n: s.lcSent },
        { cls: 'bar bar-lc is-pending', n: s.lc - s.lcSent },
        { cls: 'bar bar-cl', n: s.clSent },
        { cls: 'bar bar-cl is-pending', n: s.cl - s.clSent },
      ].filter(function (g) { return g.n > 0; });
      // Hari/minggu tanpa submission tetap dapat penanda tipis di garis dasar
      // — slot kosong tanpa tanda kebaca "datanya hilang", bukan "0".
      if (!segs.length) {
        el('rect', { class: 'bar-zero', x: cx - bw / 2, y: m.t + ih - 3, width: bw, height: 3, rx: 1.5 }, bars);
        return;
      }
      var cursor = m.t + ih;
      segs.forEach(function (g, k) {
        var h = (g.n / sc.top) * ih;
        var isTop = k === segs.length - 1;
        var drawH = isTop ? h : Math.max(1, h - gap);
        el('path', { class: g.cls, d: segPath(cx - bw / 2, cursor - drawH, bw, drawH, isTop ? 3 : 0) }, bars);
        cursor -= h;
      });
    });

    var every = Math.ceil(series.length / (W < 560 ? 4 : 7));
    series.forEach(function (s, i) {
      var isLast = i === series.length - 1;
      if (!isLast && (series.length - 1 - i) % every !== 0) return;
      if (!isLast && series.length - 1 - i < every * 0.6) return;
      var t = el('text', { x: isLast ? W - m.r : m.l + slot * i + slot / 2, y: H - 6, 'text-anchor': isLast ? 'end' : 'middle', class: isLast ? 'x-today' : '' }, svg);
      t.textContent = isLast ? (weekly ? 'Minggu ini' : 'Hari ini') : shortDate(s.t);
    });

    var hit = el('rect', { class: 'hit', x: m.l, y: m.t, width: iw, height: ih + m.b }, svg);
    chartGeom = { series: series, slot: slot, m: m, band: band, centers: centers, W: W, y: y };
    hit.addEventListener('pointermove', onChartPointer);
    hit.addEventListener('pointerdown', onChartPointer);
    hit.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideTip(); });

    // Versi teks buat pembaca layar & keyboard — grafik SVG-nya sendiri
    // aria-hidden, angkanya tetap bisa diakses lewat tabel ini.
    var rows = series.map(function (s) {
      return '<tr><th scope="row">' + slotLabel(s) + '</th><td>' + s.lc + '</td><td>' + s.cl + '</td><td>' + s.sent + '</td></tr>';
    }).join('');
    $('trendTable').innerHTML =
      '<caption>' + (weekly ? 'Submission per minggu' : 'Submission per hari') + ', ' + state.days + ' hari terakhir</caption>' +
      '<thead><tr><th scope="col">Periode</th><th scope="col">Legal Check</th><th scope="col">Checklist Dokumen</th><th scope="col">Sudah dikirim</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>';

    var empty = document.createElement('div');
    empty.className = 'chart__empty';
    empty.textContent = 'Belum ada submission di periode ini.';
    if (!total) host.appendChild(empty);
    if (activeIndex >= series.length) activeIndex = series.length - 1;
  }

  function showTip(i) {
    if (!chartGeom) return;
    var g = chartGeom;
    activeIndex = i;
    var s = g.series[i];
    g.band.setAttribute('x', g.m.l + g.slot * i + 1);
    g.band.setAttribute('width', Math.max(3, g.slot - 2));
    g.band.classList.add('is-on');

    var tip = $('trendTip');
    var n = s.lc + s.cl;
    tip.innerHTML = n
      ? '<p class="chart-tip__date">' + slotLabel(s) + '</p>' +
        '<p class="chart-tip__row"><span class="chart-tip__dot" style="background:var(--tool-lc)"></span>Legal Check<b>' + s.lc + '</b></p>' +
        '<p class="chart-tip__row"><span class="chart-tip__dot" style="background:var(--tool-cl)"></span>Checklist Dokumen<b>' + s.cl + '</b></p>' +
        '<p class="chart-tip__total">Sudah dikirim<b>' + s.sent + ' dari ' + n + '</b></p>'
      : '<p class="chart-tip__date">' + slotLabel(s) + '</p>' +
        '<p class="chart-tip__row">Tidak ada submission masuk.</p>';
    tip.hidden = false;

    // Tooltip duduk di atas puncak batang hari itu, dijepit biar gak keluar
    // dari lebar grafik di slot pertama/terakhir.
    var chart = $('trendChart');
    var half = tip.offsetWidth / 2;
    var left = Math.max(half, Math.min(g.W - half, g.centers[i]));
    tip.style.left = (chart.offsetLeft + left) + 'px';
    tip.style.top = (chart.offsetTop + Math.max(g.y(n), 24)) + 'px';
  }

  function onChartPointer(e) {
    if (!chartGeom) return;
    var g = chartGeom;
    var rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    var i = Math.max(0, Math.min(g.series.length - 1, Math.floor((e.clientX - rect.left - g.m.l) / g.slot)));
    showTip(i);
  }
  function hideTip() {
    $('trendTip').hidden = true;
    if (chartGeom) chartGeom.band.classList.remove('is-on');
    activeIndex = -1;
  }

  // Keyboard: grafik bisa difokus, panah kiri/kanan pindah hari/minggu.
  var chartHost = $('trendChart');
  chartHost.addEventListener('focus', function () {
    if (chartGeom) showTip(activeIndex >= 0 ? activeIndex : chartGeom.series.length - 1);
  });
  chartHost.addEventListener('blur', hideTip);
  chartHost.addEventListener('keydown', function (e) {
    if (!chartGeom) return;
    var last = chartGeom.series.length - 1;
    var i = activeIndex < 0 ? last : activeIndex;
    if (e.key === 'ArrowLeft') i = Math.max(0, i - 1);
    else if (e.key === 'ArrowRight') i = Math.min(last, i + 1);
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = last;
    else if (e.key === 'Escape') { hideTip(); return; }
    else return;
    e.preventDefault();
    showTip(i);
  });
  document.addEventListener('pointerdown', function (e) {
    if (!chartHost.contains(e.target)) hideTip();
  });

  /* ================================================================ Queue */
  function renderQueue() {
    var list = $('queueList'), stateEl = $('queueState'), more = $('queueMore'), count = $('queueCount');
    if (state.error) {
      list.hidden = true; more.hidden = true; count.innerHTML = '';
      stateEl.hidden = false;
      stateEl.className = 'empty-state empty-state--error';
      stateEl.innerHTML = '<p class="empty-state__title">Antrian gagal dimuat</p><p class="empty-state__hint">' + esc(state.error) + '</p>';
      return;
    }
    var now = Date.now();
    var pending = state.leads.map(function (r) { return { r: r, tool: 'lc' }; })
      .concat(state.checklist.map(function (r) { return { r: r, tool: 'cl' }; }))
      .filter(function (x) { return !isSent(x.r); })
      .sort(function (a, b) { return new Date(a.r.created_at) - new Date(b.r.created_at); });
    var late = pending.filter(function (x) { return now - new Date(x.r.created_at) > DAY; }).length;

    count.innerHTML = pending.length
      ? '<span class="count-chip">' + num(pending.length) + ' menunggu</span>' + (late ? '<span class="count-chip count-chip--late">' + num(late) + ' lewat 24 jam</span>' : '')
      : '<span class="count-chip count-chip--ok">Semua terkirim</span>';

    if (!pending.length) {
      list.hidden = true; more.hidden = true;
      stateEl.hidden = false;
      stateEl.className = 'empty-state';
      stateEl.innerHTML = '<p class="empty-state__title">Antrian kosong</p><p class="empty-state__hint">Semua submission sudah dikirim PDF-nya. Submission baru dari Legal Check atau Checklist Dokumen muncul di sini otomatis.</p>';
      return;
    }

    stateEl.hidden = true;
    list.hidden = false;
    var shown = pending.slice(0, 6);
    list.innerHTML = shown.map(function (x) {
      var r = x.r, waited = now - new Date(r.created_at).getTime();
      var u = urgency(waited);
      // Skala meter = 7 hari (penanda tipis di 1/7 = batas janji 24 jam), biar
      // umur antrian yang beda-beda tetap kebaca beda — bukan semua mentok
      // penuh merah begitu lewat 24 jam.
      var fill = Math.min(100, (waited / (7 * DAY)) * 100);
      var wa = 'https://wa.me/' + String(r.whatsapp || '').replace(/\D/g, '').replace(/^0/, '62');
      var pdf = x.tool === 'lc' ? '/admin/leads/?id=' + encodeURIComponent(r.id) : '/admin/checklist/?id=' + encodeURIComponent(r.id);
      return (
        '<li class="q-item">' +
          '<div>' +
            '<p class="q-item__name">' + esc(r.nama) + '</p>' +
            '<p class="q-item__meta"><span class="tool-tag' + (x.tool === 'cl' ? ' tool-tag--cl' : '') + '">' + (x.tool === 'lc' ? 'Legal Check' : 'Checklist Dokumen') + '</span>' + shortDate(r.created_at) + '</p>' +
          '</div>' +
          '<div class="q-wait">' +
            '<span class="q-wait__age ' + u + '">Menunggu ' + age(waited) + '</span>' +
            '<span class="q-meter q-meter--sla ' + u + '" aria-hidden="true"><span style="width:' + Math.max(2, fill).toFixed(1) + '%"></span></span>' +
          '</div>' +
          '<div class="q-actions">' +
            '<a class="icon-btn" href="' + esc(wa) + '" target="_blank" rel="noopener" title="Kirim via WhatsApp" aria-label="Kirim via WhatsApp ke ' + esc(r.nama) + '">' + ICON_WA + '</a>' +
            '<a class="icon-btn" href="' + esc(pdf) + '" title="Lihat & download PDF" aria-label="Lihat PDF ' + esc(r.nama) + '">' + ICON_DOC + '</a>' +
            '<button type="button" class="icon-btn icon-btn--done" data-done="' + esc(r.id) + '" data-tool="' + x.tool + '" title="Tandai sudah dikirim" aria-label="Tandai ' + esc(r.nama) + ' sudah dikirim">' + ICON_CHECK + '</button>' +
          '</div>' +
        '</li>'
      );
    }).join('');
    more.hidden = pending.length <= shown.length;
    more.textContent = '+' + num(pending.length - shown.length) + ' submission lain masih menunggu — buka daftar lengkap di bawah.';
  }

  $('queueList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-done]');
    if (!btn) return;
    btn.disabled = true;
    var endpoint = btn.dataset.tool === 'lc' ? '/api/leads' : '/api/checklist-leads';
    fetch(endpoint + '?id=' + encodeURIComponent(btn.dataset.done), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pdf_siap' }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d.error || 'Gagal update status');
        var rows = btn.dataset.tool === 'lc' ? state.leads : state.checklist;
        rows.forEach(function (r) { if (r.id === btn.dataset.done) r.status = 'pdf_siap'; });
        renderAll(false);
      })
      .catch(function (err) { btn.disabled = false; window.alert(err.message); });
  });

  /* ======================================================= Bar list helper */
  function barsHtml(entries, total) {
    var top = entries.length ? entries[0].n : 0;
    return entries.map(function (e) {
      return (
        '<li class="bar-row"' + (e.title ? ' title="' + esc(e.title) + '"' : '') + '>' +
          '<span class="bar-row__label">' + esc(e.label) + '</span>' +
          '<span class="bar-row__val"><b>' + num(e.n) + '</b>' + pct(e.n, total) + '%</span>' +
          '<span class="bar-row__track"><span class="bar-row__fill" style="transform:scaleX(' + (top ? e.n / top : 0).toFixed(3) + ')"></span></span>' +
        '</li>'
      );
    }).join('');
  }
  function emptyLi(title, hint, isError) {
    return '<li class="empty-state' + (isError ? ' empty-state--error' : '') + '"><p class="empty-state__title">' + esc(title) + '</p><p class="empty-state__hint">' + esc(hint) + '</p></li>';
  }

  /* ============================================================== Profile */
  function renderProfile() {
    var ul = $('profileBars');
    var source, field, labels, isCl;
    if (state.profile === 'layanan') { source = inPeriod(state.checklist); field = 'jenisLayanan'; labels = LAYANAN_LABEL; isCl = true; }
    else { source = inPeriod(state.leads); field = state.profile; labels = state.profile === 'bentuk' ? BENTUK_LABEL : KATEGORI_LABEL; isCl = false; }

    $('profileSub').textContent = 'Dari ' + num(source.length) + ' submission ' + (isCl ? 'Checklist Dokumen' : 'Legal Check') + ' dalam ' + state.days + ' hari terakhir.';

    var counts = {};
    source.forEach(function (r) { var k = r[field] || 'lainnya'; counts[k] = (counts[k] || 0) + 1; });
    var entries = Object.keys(counts).map(function (k) {
      return { label: labels[k] || (k === 'lainnya' ? 'Tidak diisi' : k), n: counts[k] };
    }).sort(function (a, b) { return b.n - a.n; });
    ul.innerHTML = entries.length
      ? barsHtml(entries, source.length)
      : emptyLi('Belum ada data', 'Belum ada submission ' + (isCl ? 'Checklist Dokumen' : 'Legal Check') + ' di periode ini.');
  }

  /* ============================================================== Traffic */
  var PAGE_LABEL = {
    '/': 'Beranda', '/index.html': 'Beranda', '/legal-check.html': 'Legal Check', '/karsabiz.html': 'KarsaBiz',
    '/checklist-dokumen-usaha.html': 'Checklist Dokumen Usaha', '/kalkulator-modal-usaha.html': 'Kalkulator Modal Usaha',
    '/kontak.html': 'Kontak', '/tentang-kami.html': 'Tentang Kami', '/artikel.html': 'Artikel',
    '/kbli-2025.html': 'Artikel: KBLI 2025', '/kbli-2025-explained.html': 'Artikel: KBLI 2025 dijelaskan',
  };
  var CHANNEL_LABEL = {
    'Organic Search': 'Pencarian organik (Google dll.)', 'Direct': 'Langsung (ketik alamat / bookmark)',
    'Organic Social': 'Media sosial', 'Referral': 'Website lain (referral)', 'Paid Search': 'Iklan pencarian',
    'Paid Social': 'Iklan media sosial', 'Email': 'Email', 'Organic Video': 'Video', 'Unassigned': 'Tidak terdeteksi',
  };
  function pageLabel(path) {
    var clean = path.replace(/\?.*$/, '');
    if (PAGE_LABEL[clean]) return PAGE_LABEL[clean];
    var name = clean.replace(/^\//, '').replace(/\.html$/, '').replace(/[-_]+/g, ' ');
    var SMALL = { dan: 1, di: 1, ke: 1, untuk: 1, dari: 1 };
    return name
      ? name.split(' ').map(function (w, i) {
          if (/^(pt|cv|kbli|nib|pmdn|pma)$/i.test(w)) return w.toUpperCase();
          return i && SMALL[w] ? w : w.charAt(0).toUpperCase() + w.slice(1);
        }).join(' ')
      : 'Beranda';
  }
  function parseDay(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).getTime(); }

  function loadTraffic() {
    var asked = state.days;
    state.trafficLoading = true;
    renderCompare();
    fetch('/api/analytics?days=' + asked).then(function (r) {
      var demo = r.headers.get('X-Demo-Data') === '1';
      return r.json().then(function (d) { return { status: r.status, d: d, demo: demo }; });
    }).then(function (res) {
      if (asked !== state.days) return; // periode sudah diganti lagi
      state.trafficLoading = false;
      if (res.status === 503 && res.d.error === 'not_configured') { state.traffic = { notConfigured: true }; }
      else if (res.d.error) { state.traffic = { error: res.d.error }; }
      else { state.traffic = res.d; state.traffic.demo = res.demo; }
      renderCompare();
    }).catch(function (err) {
      if (asked !== state.days) return;
      state.trafficLoading = false;
      state.traffic = { error: String(err.message || err) };
      renderCompare();
    });
  }

  function loadWeb() {
    var asked = state.webDays;
    state.webLoading = true;
    renderTrafficAll();
    fetch('/api/analytics?days=' + asked).then(function (r) {
      var demo = r.headers.get('X-Demo-Data') === '1';
      return r.json().then(function (d) { return { status: r.status, d: d, demo: demo }; });
    }).then(function (res) {
      if (asked !== state.webDays) return; // periode sudah diganti lagi
      state.webLoading = false;
      if (res.status === 503 && res.d.error === 'not_configured') { state.web = { notConfigured: true }; }
      else if (res.d.error) { state.web = { error: res.d.error }; }
      else { state.web = res.d; state.web.demo = res.demo; }
      renderTrafficAll();
    }).catch(function (err) {
      if (asked !== state.webDays) return;
      state.webLoading = false;
      state.web = { error: String(err.message || err) };
      renderTrafficAll();
    });
  }

  function renderTrafficAll() {
    renderTrafficSummary();
    renderTrafficChart();
    renderPages();
    renderSources();
  }

  /* ======================================================= Klik Konsultasi */
  // Dua angka sesuai permintaan: klik per pengunjung unik & semua klik.
  // Periode kartu ini punya kontrol sendiri (state.ctaDays), terpisah dari periode Submission.
  function loadCta() {
    var asked = state.ctaDays;
    state.ctaLoading = true;
    renderCta();
    fetch('/api/analytics?days=' + asked).then(function (r) {
      var demo = r.headers.get('X-Demo-Data') === '1';
      return r.json().then(function (d) { return { status: r.status, d: d, demo: demo }; });
    }).then(function (res) {
      if (asked !== state.ctaDays) return;
      state.ctaLoading = false;
      if (res.status === 503 && res.d.error === 'not_configured') { state.cta = { notConfigured: true }; }
      else if (res.d.error) { state.cta = { error: res.d.error }; }
      else { state.cta = res.d; state.cta.demo = res.demo; }
      renderCta();
    }).catch(function (err) {
      if (asked !== state.ctaDays) return;
      state.ctaLoading = false;
      state.cta = { error: String(err.message || err) };
      renderCta();
    });
  }

  function renderCta() {
    var t = state.cta, ul = $('ctaBars'), sum = $('ctaSummary'), chip = $('ctaSource');
    chip.hidden = true;
    if (state.ctaLoading || !t) { sum.textContent = 'Memuat data klik…'; ul.innerHTML = ''; return; }
    if (t.notConfigured) { sum.textContent = 'Muncul setelah Google Analytics terhubung.'; ul.innerHTML = ''; return; }
    if (t.error) { sum.textContent = 'Data klik gagal dimuat.'; ul.innerHTML = ''; return; }
    if (!t.clicks) { sum.textContent = 'Data klik belum tersedia dari Google Analytics.'; ul.innerHTML = ''; return; }

    chip.hidden = false;
    chip.textContent = t.demo ? 'Data contoh' : 'Google Analytics';
    chip.className = 'source-chip' + (t.demo ? ' demo-chip' : '');

    var c = t.clicks.current, p = t.clicks.previous;
    var visitors = (t.totals.current && t.totals.current.users) || 0;
    if (!c.all) {
      sum.textContent = 'Belum ada klik tercatat dalam ' + state.ctaDays + ' hari terakhir. Pencatatan mulai dihitung sejak tombol dilacak, jadi angkanya naik seiring pengunjung menekan tombol.';
      ul.innerHTML = '';
      return;
    }
    var delta = '';
    if (p && p.all) {
      var ch = Math.round(((c.all - p.all) / p.all) * 100);
      delta = ch === 0 ? '' : ' <span class="delta ' + (ch > 0 ? 'delta--up' : 'delta--down') + '">' + (ch > 0 ? 'naik ' : 'turun ') + Math.abs(ch) + '% dari ' + state.ctaDays + ' hari sebelumnya</span>';
    }
    sum.innerHTML = '<b>' + num(c.all) + '</b> klik dari <b>' + num(c.unique) + '</b> pengunjung unik dalam ' + state.ctaDays + ' hari terakhir' + delta +
      (visitors ? ' · <b>' + pct(c.unique, visitors) + '%</b> pengunjung website menekan tombol' : '') +
      ' · rata-rata <b>' + (c.all / c.unique).toFixed(1).replace('.', ',') + '</b> klik per pengunjung';
    ul.innerHTML = [
      { label: 'Semua klik', n: c.all },
      { label: 'Klik per pengunjung unik', n: c.unique },
    ].map(function (e) {
      return (
        '<li class="bar-row">' +
          '<span class="bar-row__label">' + e.label + '</span>' +
          '<span class="bar-row__val"><b>' + num(e.n) + '</b></span>' +
          '<span class="bar-row__track"><span class="bar-row__fill" style="transform:scaleX(' + (e.n / c.all).toFixed(3) + ')"></span></span>' +
        '</li>'
      );
    }).join('');
  }

  function renderTrafficSummary() {
    var t = state.web, chip = $('trafficSource'), sum = $('trafficSummary');
    var setup = !!(t && t.notConfigured);
    $('trafficSetup').hidden = !setup;
    $('trafficChart').hidden = setup;
    $('trafficLegend').hidden = setup;
    if (state.webLoading || !t) { sum.textContent = 'Memuat data pengunjung…'; chip.hidden = true; return; }
    if (setup) { sum.textContent = 'Belum terhubung ke Google Analytics.'; chip.hidden = true; return; }
    if (t.error) { sum.textContent = 'Data pengunjung gagal dimuat: ' + t.error; chip.hidden = true; return; }

    chip.hidden = false;
    chip.textContent = t.demo ? 'Data contoh' : 'Google Analytics';
    chip.className = 'source-chip' + (t.demo ? ' demo-chip' : '');

    var cur = t.totals.current || { users: 0, newUsers: 0, sessions: 0, views: 0 };
    var prev = t.totals.previous;
    var delta = '';
    if (prev && prev.users) {
      var ch = Math.round(((cur.users - prev.users) / prev.users) * 100);
      delta = ch === 0
        ? ' <span class="delta">sama dengan ' + state.webDays + ' hari sebelumnya</span>'
        : ' <span class="delta ' + (ch > 0 ? 'delta--up' : 'delta--down') + '">' + (ch > 0 ? 'naik ' : 'turun ') + Math.abs(ch) + '% dari ' + state.webDays + ' hari sebelumnya</span>';
    }
    sum.innerHTML = '<b>' + num(cur.users) + '</b> pengunjung dalam ' + state.webDays + ' hari terakhir' + delta +
      ' · <b>' + num(cur.newUsers) + '</b> pengunjung baru · <b>' + num(cur.sessions) + '</b> sesi · <b>' + num(cur.views) + '</b> page views';
  }

  var trafficGeom = null;
  var trafficIndex = -1;

  function renderTrafficChart() {
    var host = $('trafficChart');
    var t = state.web;
    host.innerHTML = '';
    trafficGeom = null;
    $('trafficTip').hidden = true;
    if (state.webLoading) { host.innerHTML = '<div class="chart__empty">Memuat…</div>'; return; }
    if (!t || t.notConfigured || t.error) return;
    var days = t.daily || [];
    if (!days.length) { host.innerHTML = '<div class="chart__empty">Belum ada kunjungan di periode ini.</div>'; return; }

    var W = host.clientWidth, H = host.clientHeight;
    var m = { l: 34, r: 6, t: 10, b: 26 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var maxU = 0;
    days.forEach(function (d) { maxU = Math.max(maxU, d.users); });
    var sc = niceScale(maxU);
    var y = function (v) { return m.t + ih - (v / sc.top) * ih; };
    var step = days.length > 1 ? iw / (days.length - 1) : 0;
    var x = function (i) { return days.length > 1 ? m.l + i * step : m.l + iw / 2; };

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' }, host);
    var grid = el('g', { class: 'grid' }, svg);
    for (var v = 0; v <= sc.top; v += sc.step) {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 ? 'is-base' : '' }, grid);
      var lab = el('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, svg);
      lab.textContent = num(v);
    }
    var line = days.map(function (d, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(d.users).toFixed(1); }).join('');
    el('path', { class: 'area', d: line + 'L' + x(days.length - 1).toFixed(1) + ',' + y(0) + 'L' + x(0).toFixed(1) + ',' + y(0) + 'Z' }, svg);
    el('path', { class: 'area-line', d: line }, svg);
    var rule = el('line', { class: 'rule', x1: 0, x2: 0, y1: m.t, y2: m.t + ih }, svg);
    var dot = el('circle', { class: 'area-dot', cx: 0, cy: 0, r: 5 }, svg);

    var every = Math.ceil(days.length / (W < 560 ? 4 : 7));
    days.forEach(function (d, i) {
      var isLast = i === days.length - 1;
      if (!isLast && (days.length - 1 - i) % every !== 0) return;
      if (!isLast && days.length - 1 - i < every * 0.6) return;
      var tx = el('text', { x: isLast ? W - m.r : x(i), y: H - 6, 'text-anchor': isLast ? 'end' : 'middle', class: isLast ? 'x-today' : '' }, svg);
      tx.textContent = isLast ? 'Hari ini' : shortDate(parseDay(d.date));
    });

    var hit = el('rect', { class: 'hit', x: m.l - step / 2, y: m.t, width: iw + step, height: ih + m.b }, svg);
    trafficGeom = { days: days, x: x, y: y, step: step, m: m, W: W, rule: rule, dot: dot };
    function fromPointer(e) {
      var rect = svg.getBoundingClientRect();
      var i = step ? Math.round((e.clientX - rect.left - m.l) / step) : 0;
      showTrafficTip(Math.max(0, Math.min(days.length - 1, i)));
    }
    hit.addEventListener('pointermove', fromPointer);
    hit.addEventListener('pointerdown', fromPointer);
    hit.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideTrafficTip(); });

    $('trafficTable').innerHTML =
      '<caption>Pengunjung website per hari, ' + state.webDays + ' hari terakhir</caption>' +
      '<thead><tr><th scope="col">Tanggal</th><th scope="col">Pengunjung</th><th scope="col">Sesi</th><th scope="col">Page views</th></tr></thead>' +
      '<tbody>' + days.map(function (d) {
        return '<tr><th scope="row">' + longDate(parseDay(d.date)) + '</th><td>' + d.users + '</td><td>' + d.sessions + '</td><td>' + d.views + '</td></tr>';
      }).join('') + '</tbody>';
  }

  function showTrafficTip(i) {
    var g = trafficGeom;
    if (!g) return;
    trafficIndex = i;
    var d = g.days[i];
    var cx = g.x(i), cy = g.y(d.users);
    g.rule.setAttribute('x1', cx); g.rule.setAttribute('x2', cx); g.rule.classList.add('is-on');
    g.dot.setAttribute('cx', cx); g.dot.setAttribute('cy', cy); g.dot.classList.add('is-on');
    var tip = $('trafficTip');
    tip.innerHTML =
      '<p class="chart-tip__date">' + longDate(parseDay(d.date)) + '</p>' +
      '<p class="chart-tip__row">Pengunjung<b>' + num(d.users) + '</b></p>' +
      '<p class="chart-tip__row">Sesi<b>' + num(d.sessions) + '</b></p>' +
      '<p class="chart-tip__row">Page views<b>' + num(d.views) + '</b></p>';
    tip.hidden = false;
    var chart = $('trafficChart');
    var half = tip.offsetWidth / 2;
    tip.style.left = (chart.offsetLeft + Math.max(half, Math.min(g.W - half, cx))) + 'px';
    tip.style.top = (chart.offsetTop + Math.max(cy, 24)) + 'px';
  }
  function hideTrafficTip() {
    $('trafficTip').hidden = true;
    if (trafficGeom) { trafficGeom.rule.classList.remove('is-on'); trafficGeom.dot.classList.remove('is-on'); }
    trafficIndex = -1;
  }

  var trafficHost = $('trafficChart');
  trafficHost.addEventListener('focus', function () {
    if (trafficGeom) showTrafficTip(trafficIndex >= 0 ? trafficIndex : trafficGeom.days.length - 1);
  });
  trafficHost.addEventListener('blur', hideTrafficTip);
  trafficHost.addEventListener('keydown', function (e) {
    if (!trafficGeom) return;
    var last = trafficGeom.days.length - 1;
    var i = trafficIndex < 0 ? last : trafficIndex;
    if (e.key === 'ArrowLeft') i = Math.max(0, i - 1);
    else if (e.key === 'ArrowRight') i = Math.min(last, i + 1);
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = last;
    else if (e.key === 'Escape') { hideTrafficTip(); return; }
    else return;
    e.preventDefault();
    showTrafficTip(i);
  });
  document.addEventListener('pointerdown', function (e) {
    if (!trafficHost.contains(e.target)) hideTrafficTip();
  });

  function trafficListState(ul) {
    var t = state.web;
    if (state.webLoading || !t) { ul.innerHTML = '<li class="skeleton"><div class="skeleton__row"></div><div class="skeleton__row"></div><div class="skeleton__row"></div></li>'; return true; }
    if (t.notConfigured) { ul.innerHTML = emptyLi('Menunggu Google Analytics', 'Muncul otomatis setelah Google Analytics terhubung (langkahnya ada di kartu Pengunjung website).'); return true; }
    if (t.error) { ul.innerHTML = emptyLi('Gagal dimuat', t.error, true); return true; }
    return false;
  }

  function renderPages() {
    var ul = $('pagesBars');
    if (trafficListState(ul)) return;
    var t = state.web;
    var total = (t.totals.current && t.totals.current.views) || 0;
    $('pagesSub').textContent = 'Page views per halaman dalam ' + state.webDays + ' hari terakhir.';
    // GA mencatat /karsabiz dan /karsabiz.html (dan / vs /index.html) sebagai
    // halaman beda — digabung dulu biar satu halaman = satu baris.
    var merged = {};
    (t.pages || []).forEach(function (p) {
      var key = p.path.replace(/\?.*$/, '').replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/(.)\/$/, '$1') || '/';
      if (!merged[key]) merged[key] = { label: pageLabel(key === '/' ? '/' : key + '.html'), title: key, n: 0 };
      merged[key].n += p.views;
    });
    var entries = Object.keys(merged).map(function (k) { return merged[k]; }).sort(function (a, b) { return b.n - a.n; });
    ul.innerHTML = entries.length ? barsHtml(entries, total) : emptyLi('Belum ada data', 'Belum ada page views di periode ini.');
  }

  function renderSources() {
    var ul = $('sourcesBars');
    if (trafficListState(ul)) return;
    var t = state.web;
    var total = (t.totals.current && t.totals.current.sessions) || 0;
    $('sourcesSub').textContent = 'Asal sesi kunjungan dalam ' + state.webDays + ' hari terakhir.';
    var entries = (t.sources || []).map(function (s) { return { label: CHANNEL_LABEL[s.channel] || s.channel, n: s.sessions }; });
    ul.innerHTML = entries.length ? barsHtml(entries, total) : emptyLi('Belum ada data', 'Belum ada sesi kunjungan di periode ini.');
  }

  /* ============================================================== Compare */
  function renderCompare() {
    var now = Date.now();
    var lc = inPeriod(state.leads), cl = inPeriod(state.checklist);
    var total = lc.length + cl.length;
    var t = state.traffic;
    var visitors = t && t.toolVisitors && !t.error ? t.toolVisitors : null;
    $('compareSub').textContent = 'Dalam ' + state.days + ' hari terakhir — dari pengunjung halaman tool sampai PDF dikirim.';
    function row(name, rows, tool, note) {
      var sent = rows.filter(isSent).length;
      var waiting = rows.filter(function (r) { return !isSent(r); });
      var oldest = waiting.reduce(function (m, r) { return Math.max(m, now - new Date(r.created_at).getTime()); }, 0);
      var v = visitors ? visitors[tool] : null;
      var conv = v ? (rows.length / v) * 100 : null;
      var convText = conv == null ? null : (conv < 10 ? conv.toFixed(1).replace('.', ',') : Math.round(conv)) + '%';
      return (
        '<tr>' +
          '<td><div class="cmp-tool' + (tool === 'cl' ? ' cmp-tool--cl' : '') + '"><i></i><span>' + name + '<small>' + note + '</small></span></div></td>' +
          '<td class="cell-num">' + (v != null ? '<span class="cmp-metric__num">' + num(v) + '</span>' : '<span class="cell-muted" title="Butuh Google Analytics">—</span>') + '</td>' +
          '<td><div class="cmp-metric"><span class="cmp-metric__num">' + num(rows.length) + '<span>' + pct(rows.length, total) + '% dari total</span></span>' +
            '<span class="q-meter' + (tool === 'cl' ? ' q-meter--cl' : '') + '"><span style="width:' + pct(rows.length, total) + '%"></span></span></div></td>' +
          '<td>' + (convText ? '<span class="cmp-metric__num">' + convText + '<span>' + num(rows.length) + ' dari ' + num(v) + '</span></span>' : '<span class="cell-muted" title="Butuh Google Analytics">—</span>') + '</td>' +
          '<td><div class="cmp-metric"><span class="cmp-metric__num">' + num(sent) + '<span>' + pct(sent, rows.length) + '% · ' + num(waiting.length) + ' menunggu</span></span>' +
            '<span class="q-meter q-meter--sent"><span style="width:' + pct(sent, rows.length) + '%"></span></span></div></td>' +
          '<td class="cell-num">' + (waiting.length ? '<span class="' + (oldest > DAY ? 'is-late' : '') + '">' + age(oldest) + '</span>' : '<span class="cell-muted">—</span>') + '</td>' +
        '</tr>'
      );
    }
    $('compareBody').innerHTML =
      row('Legal Check', lc, 'lc', 'Kuis diagnostic legalitas') +
      row('Checklist Dokumen', cl, 'cl', 'Form 7 langkah pendirian');
  }

  /* ================================================================ Wiring */
  function renderAll(animate) {
    renderMetrics();
    renderTrend(animate);
    renderQueue();
    renderProfile();
    renderCompare();
  }

  function bindSeg(id, attr, onPick) {
    var seg = $(id);
    seg.addEventListener('click', function (e) {
      var btn = e.target.closest('.seg__btn');
      if (!btn || btn.getAttribute('aria-checked') === 'true') return;
      seg.querySelectorAll('.seg__btn').forEach(function (b) { b.setAttribute('aria-checked', b === btn ? 'true' : 'false'); });
      onPick(btn.dataset[attr]);
    });
    seg.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var btns = Array.prototype.slice.call(seg.querySelectorAll('.seg__btn'));
      var cur = btns.findIndex(function (b) { return b.getAttribute('aria-checked') === 'true'; });
      var next = btns[(cur + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
      next.click(); next.focus();
    });
  }
  // Periode Submission mengatur Submission, Antrian-profil, dan tabel perbandingan; Pengunjung website (+ halaman & sumber) dan Klik Konsultasi Gratis punya kontrol sendiri.
  bindSeg('periodSeg', 'days', function (v) {
    state.days = Number(v);
    hideTip();
    renderTrend(true); renderProfile(); renderCompare();
    loadTraffic();
  });
  bindSeg('webSeg', 'days', function (v) { state.webDays = Number(v); hideTrafficTip(); loadWeb(); });
  bindSeg('ctaSeg', 'days', function (v) { state.ctaDays = Number(v); loadCta(); });
  bindSeg('profileSeg', 'profile', function (v) { state.profile = v; renderProfile(); });

  var resizeTimer;
  new ResizeObserver(function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (state.loaded) renderTrend(false);
      if (trafficGeom) renderTrafficChart();
    }, 80);
  }).observe($('trendChart'));

  function getList(url) {
    return fetch(url).then(function (r) {
      if (r.status === 401) { window.location.href = '/admin/'; throw new Error('Sesi habis, silakan masuk lagi.'); }
      var demo = r.headers.get('X-Demo-Data') === '1';
      return r.json().then(function (d) {
        if (!Array.isArray(d)) throw new Error(d && d.error ? d.error : 'Respon server tidak valid');
        return { rows: d, demo: demo };
      });
    });
  }

  function loadDashboard() {
    Promise.all([getList('/api/leads'), getList('/api/checklist-leads')]).then(function (res) {
      state.leads = res[0].rows;
      state.checklist = res[1].rows;
      $('demoChip').hidden = !(res[0].demo || res[1].demo);
      state.loaded = true; state.error = null;
      renderAll(true);
    }).catch(function (err) {
      state.loaded = true; state.error = String(err.message || err);
      renderTrend(false); renderQueue();
    });
    loadTraffic();
    loadWeb();
    loadCta();
    loadArticleCount();
  }

  /* ================================================================ Login */
  var loginScreen = $('loginScreen');
  var shell = $('shell');
  function showShell() {
    loginScreen.hidden = true;
    shell.hidden = false;
    loadDashboard();
  }

  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var errorEl = $('loginError');
    var submit = $('loginSubmit');
    errorEl.hidden = true;
    submit.disabled = true;
    submit.textContent = 'Memeriksa...';
    fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: $('email').value, password: $('password').value }),
    }).then(function (r) {
      return r.text().then(function (text) {
        var data;
        try { data = JSON.parse(text); } catch (err) { data = { error: 'Respon server tidak valid (' + r.status + ')' }; }
        return { ok: r.ok, data: data };
      });
    }).then(function (res) {
      submit.disabled = false;
      submit.textContent = 'Masuk';
      if (!res.ok) { errorEl.textContent = res.data.error || 'Login gagal.'; errorEl.hidden = false; return; }
      showShell();
    }).catch(function (err) {
      submit.disabled = false;
      submit.textContent = 'Masuk';
      errorEl.textContent = String(err);
      errorEl.hidden = false;
    });
  });

  fetch('/api/admin-me').then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) { if (res.ok) { showShell(); return; } loginScreen.hidden = false; })
    .catch(function () { loginScreen.hidden = false; });
})();
