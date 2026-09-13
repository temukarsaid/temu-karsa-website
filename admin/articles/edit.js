/* Form Tambah/Edit Artikel — logic murni JS (gak ada framework), gantiin
   editor Decap CMS yang dulu di-mount di halaman ini. Nulis data ke
   ../dev-save-server.js (lokal, lihat catatan lengkap di file itu) — jalan
   di http://localhost:8082 selama development.

   Skema data yang ditulis WAJIB persis sama kayak yang didefinisikan di
   ../config.yml (field "type" per section: text/table_section/quote_section)
   supaya eleventy/_data/articles.js (fungsi normalizeSection) tetap bisa
   baca hasilnya tanpa disentuh sama sekali. */
(function () {
  var SAVE_SERVER = 'http://localhost:8082';
  var CATEGORY_OPTIONS = ['Legalitas Usaha', 'Office & Workspace'];

  var qs = new URLSearchParams(window.location.search);
  var originalSlug = qs.get('slug') || '';
  var isNew = !originalSlug;

  var el = {
    pageTitle: document.getElementById('pageTitle'),
    formTitle: document.getElementById('formTitle'),
    formSub: document.getElementById('formSub'),
    deleteBtn: document.getElementById('deleteBtn'),
    publishBtn: document.getElementById('publishBtn'),
    status: document.getElementById('formStatus'),

    title: document.getElementById('fTitle'),
    slug: document.getElementById('fSlug'),
    dateField: document.querySelector('.date-field'),
    dateTrigger: document.getElementById('fDateTrigger'),
    dateText: document.getElementById('fDateText'),
    datePopover: document.getElementById('datePopover'),
    dateCalPrev: document.getElementById('dateCalPrev'),
    dateCalNext: document.getElementById('dateCalNext'),
    dateCalLabel: document.getElementById('dateCalLabel'),
    dateCalGrid: document.getElementById('dateCalGrid'),
    dateHour: document.getElementById('dateHour'),
    dateMinute: document.getElementById('dateMinute'),
    dateClearBtn: document.getElementById('dateClearBtn'),
    dateDoneBtn: document.getElementById('dateDoneBtn'),
    category: document.getElementById('fCategory'),
    readTime: document.getElementById('fReadTime'),
    draft: document.getElementById('fDraft'),

    heroPreviewWrap: document.getElementById('heroPreviewWrap'),
    heroFile: document.getElementById('heroFile'),
    heroPickBtn: document.getElementById('heroPickBtn'),
    heroUploadStatus: document.getElementById('heroUploadStatus'),
    heroAlt: document.getElementById('fHeroAlt'),

    metaDescription: document.getElementById('fMetaDescription'),

    leadList: document.getElementById('leadList'),
    leadAddBtn: document.getElementById('leadAddBtn'),

    sectionsList: document.getElementById('sectionsList'),
    sectionAddBtn: document.getElementById('sectionAddBtn'),

    keywordChips: document.getElementById('keywordChips'),
    keywordInput: document.getElementById('keywordInput'),
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function slugify(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // -------------------------------------------------------------- Tanggal
  // Disimpan sebagai string ISO + offset WIB langsung (bukan lewat objek
  // Date buat parsing/serialize, biar gak ada konversi timezone browser yang
  // bisa geser jam) — konsisten sama seluruh file artikel yang ada sekarang
  // (semua +07:00). Object Date CUMA dipakai buat matematika kalender
  // (geser bulan, cari hari apa tanggal 1, dst), bukan buat nyimpen nilainya.
  function parseIso(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return null;
    return { year: +m[1], month: +m[2], day: +m[3], hour: +m[4], minute: +m[5] };
  }
  function buildIso(year, month, day, hour, minute) {
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return year + '-' + pad(month) + '-' + pad(day) + 'T' + pad(hour) + ':' + pad(minute) + ':00+07:00';
  }
  function formatDateDisplay(parts) {
    if (!parts) return '';
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(parts.day) + '/' + pad(parts.month) + '/' + parts.year + ' ' + pad(parts.hour) + ':' + pad(parts.minute);
  }

  // ------------------------------------------------------------ State awal
  var state = {
    slug: '',
    date: '',
    draft: false,
    category: CATEGORY_OPTIONS[0],
    readTime: '',
    title: '',
    metaDescription: '',
    heroImage: '',
    heroImageAlt: '',
    leadParagraphs: [],
    sections: [],
    keywords: [],
  };
  var slugTouchedManually = false;

  // ---------------------------------------------------- Normalisasi section
  // File artikel yang ADA SEKARANG ditulis dalam bentuk "sudah dinormalisasi"
  // (hasil migrasi awal, sebelum lewat form apa pun) — {id,heading,body} buat
  // teks, {quote} buat kutipan, {heading,body:"",table:{...}} buat tabel.
  // Kalau nanti artikel disave lewat form ini, bentuknya jadi CMS-shape
  // ({type:'text'|'table_section'|'quote_section', ...}) sesuai config.yml.
  // Fungsi ini nerima DUA-DUANYA pas load, buat 1 bentuk editable seragam.
  function toEditable(s) {
    if (s.type === 'quote_section') return { kind: 'quote', quote: s.quote || '' };
    if (s.type === 'table_section') {
      return {
        kind: 'table', heading: s.heading || '', table_split: !!s.table_split,
        table_headers: s.table_headers || '', table_rows: (s.table_rows && s.table_rows.length) ? s.table_rows.slice() : [''],
      };
    }
    if (s.type === 'text') {
      return { kind: 'text', heading: s.heading || '', showInToc: s.showInToc !== false, body: s.body || '' };
    }
    // Bentuk lama (belum ada "type")
    if (s.quote !== undefined) return { kind: 'quote', quote: s.quote || '' };
    if (s.table !== undefined) {
      return {
        kind: 'table', heading: s.heading || '', table_split: !!s.table.split,
        table_headers: s.table.headers || '', table_rows: (s.table.rows && s.table.rows.length) ? s.table.rows.slice() : [''],
      };
    }
    return { kind: 'text', heading: s.heading || '', showInToc: s.showInToc !== false, body: s.body || '' };
  }
  function fromEditable(s) {
    if (s.kind === 'quote') return { type: 'quote_section', quote: s.quote || '' };
    if (s.kind === 'table') {
      return {
        type: 'table_section', heading: s.heading || '', table_split: !!s.table_split,
        table_headers: s.table_headers || '', table_rows: (s.table_rows || []).filter(function (r) { return r.trim(); }),
      };
    }
    return { type: 'text', heading: s.heading || '', showInToc: s.showInToc !== false, body: s.body || '' };
  }

  // ------------------------------------------------------------- Load data
  function loadArticle() {
    if (isNew) { render(); return; }
    fetch('/eleventy/articles/' + originalSlug + '.json').then(function (r) {
      if (!r.ok) throw new Error('not found');
      return r.json();
    }).then(function (data) {
      state.slug = data.slug || originalSlug;
      state.date = data.date || '';
      state.draft = data.draft === true;
      state.category = data.category || CATEGORY_OPTIONS[0];
      state.readTime = data.readTime || '';
      state.title = data.title || '';
      state.metaDescription = data.metaDescription || '';
      state.heroImage = data.heroImage || '';
      state.heroImageAlt = data.heroImageAlt || '';
      state.leadParagraphs = (data.leadParagraphs || []).slice();
      state.sections = (data.sections || []).map(toEditable);
      state.keywords = (data.keywords || []).slice();
      slugTouchedManually = true; // artikel lama: jangan auto-ganti slug pas judul diedit
      render();
    }).catch(function () {
      el.formSub.textContent = 'Gagal memuat artikel — cek slug di URL atau kembali ke daftar Artikel.';
      setStatus('Gagal memuat artikel.', 'error');
    });
  }

  // --------------------------------------------------------------- Status
  var statusTimer;
  function setStatus(text, kind) {
    el.status.textContent = text;
    el.status.className = 'form-status' + (kind ? ' form-status--' + kind : '');
    clearTimeout(statusTimer);
    if (kind !== 'saving') statusTimer = setTimeout(function () { el.status.textContent = ''; }, 4000);
  }

  // ---------------------------------------------------------------- Render
  function render() {
    el.pageTitle.textContent = (isNew ? 'Tambah Artikel' : 'Edit Artikel') + ' | Temu Karsa Admin';
    el.formTitle.textContent = isNew ? 'Tambah Artikel' : 'Edit Artikel';
    el.formSub.textContent = isNew ? 'Isi semua bagian, lalu klik Publish Artikel.' : ('Mengedit "' + state.title + '"');
    el.deleteBtn.hidden = isNew;

    el.title.value = state.title;
    el.slug.value = state.slug;
    renderDateText();
    el.category.value = state.category;
    el.readTime.value = state.readTime;
    setToggle(el.draft, state.draft);
    el.heroAlt.value = state.heroImageAlt;
    el.metaDescription.value = state.metaDescription;
    renderHeroPreview();

    renderLeadList();
    renderSectionsList();
    renderKeywords();
  }

  function setToggle(btn, on) { btn.setAttribute('aria-checked', on ? 'true' : 'false'); }

  function renderHeroPreview() {
    if (state.heroImage) {
      el.heroPreviewWrap.className = 'image-uploader__preview';
      el.heroPreviewWrap.innerHTML = '<img src="/' + esc(state.heroImage) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:11px;">';
    } else {
      el.heroPreviewWrap.className = 'image-uploader__preview image-uploader__preview--empty';
      el.heroPreviewWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>';
    }
  }

  // ---------------------------------------------------- Icon dipakai ulang
  var ICON_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';
  var ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  var ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';

  function itemHeadHtml(index, count, title) {
    return (
      '<div class="rlist__item-head">' +
        '<span class="rlist__item-title">' + esc(title) + '</span>' +
        '<div class="rlist__item-actions">' +
          '<button type="button" class="rlist__icon-btn" data-move="up" data-index="' + index + '"' + (index === 0 ? ' disabled' : '') + ' aria-label="Naikkan">' + ICON_UP + '</button>' +
          '<button type="button" class="rlist__icon-btn" data-move="down" data-index="' + index + '"' + (index === count - 1 ? ' disabled' : '') + ' aria-label="Turunkan">' + ICON_DOWN + '</button>' +
          '<button type="button" class="rlist__icon-btn rlist__icon-btn--danger" data-remove data-index="' + index + '" aria-label="Hapus">' + ICON_TRASH + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  // ------------------------------------------------------- Paragraf Pembuka
  function renderLeadList() {
    if (!state.leadParagraphs.length) {
      el.leadList.innerHTML = '<p class="rlist__empty">Belum ada paragraf pembuka.</p>';
      return;
    }
    el.leadList.innerHTML = state.leadParagraphs.map(function (text, i) {
      return (
        '<div class="rlist__item">' +
          itemHeadHtml(i, state.leadParagraphs.length, 'Paragraf ' + (i + 1)) +
          '<textarea data-lead-index="' + i + '" rows="3">' + esc(text) + '</textarea>' +
        '</div>'
      );
    }).join('');
  }
  el.leadAddBtn.addEventListener('click', function () {
    state.leadParagraphs.push('');
    renderLeadList();
  });
  el.leadList.addEventListener('input', function (e) {
    var ta = e.target.closest('[data-lead-index]');
    if (!ta) return;
    state.leadParagraphs[Number(ta.dataset.leadIndex)] = ta.value;
  });
  el.leadList.addEventListener('click', function (e) {
    handleListReorderRemove(e, state.leadParagraphs, renderLeadList);
  });

  function handleListReorderRemove(e, arr, rerender) {
    var moveBtn = e.target.closest('[data-move]');
    var removeBtn = e.target.closest('[data-remove]');
    if (moveBtn) {
      var i = Number(moveBtn.dataset.index);
      var dir = moveBtn.dataset.move === 'up' ? -1 : 1;
      var j = i + dir;
      if (j < 0 || j >= arr.length) return;
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      rerender();
    } else if (removeBtn) {
      arr.splice(Number(removeBtn.dataset.index), 1);
      rerender();
    }
  }

  // ------------------------------------------------------------- Isi Artikel
  var SECTION_TYPE_LABEL = { text: 'Teks', table: 'Tabel Perbandingan', quote: 'Kutipan' };

  function sectionBodyHtml(s, i) {
    if (s.kind === 'quote') {
      return (
        '<div class="field field-full">' +
          '<label>Teks Kutipan</label>' +
          '<textarea data-sec-index="' + i + '" data-sec-field="quote" rows="3">' + esc(s.quote) + '</textarea>' +
        '</div>'
      );
    }
    if (s.kind === 'table') {
      var rowsHtml = s.table_rows.map(function (row, ri) {
        return (
          '<div class="table-row-edit">' +
            '<input type="text" value="' + esc(row) + '" data-sec-index="' + i + '" data-row-index="' + ri + '" data-row-field="table_rows">' +
            '<button type="button" class="rlist__icon-btn rlist__icon-btn--danger" data-row-remove data-sec-index="' + i + '" data-row-index="' + ri + '" aria-label="Hapus baris"' + (s.table_rows.length <= 1 ? ' disabled' : '') + '>' + ICON_TRASH + '</button>' +
          '</div>'
        );
      }).join('');
      return (
        '<div class="field field-full"><label>Judul Tabel</label><input type="text" value="' + esc(s.heading) + '" data-sec-index="' + i + '" data-sec-field="heading"></div>' +
        '<div class="field field-toggle field-full">' +
          '<label>Mode 2 Kolom</label>' +
          '<button type="button" class="toggle-switch" data-sec-index="' + i + '" data-sec-toggle="table_split" aria-checked="' + (s.table_split ? 'true' : 'false') + '"></button>' +
          '<p class="field__hint">Aktifkan untuk tabel ringkasan 2 kolom sejajar. Biarkan mati untuk tabel data biasa.</p>' +
        '</div>' +
        '<div class="field field-full"><label>Judul Kolom</label><input type="text" value="' + esc(s.table_headers) + '" data-sec-index="' + i + '" data-sec-field="table_headers"><p class="field__hint">Pisahkan tiap judul kolom dengan tanda | (garis vertikal). Contoh: Aspek | CV | PT</p></div>' +
        '<div class="field field-full"><label>Baris Tabel</label><div class="table-rows-list">' + rowsHtml + '</div>' +
          '<button type="button" class="btn-pill btn-pill--primary btn-pill--sm rlist__add" data-row-add data-sec-index="' + i + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
            'Tambah Baris' +
          '</button>' +
          '<p class="field__hint">Isi tiap baris dengan format sama: nilai per kolom dipisah tanda |</p>' +
        '</div>'
      );
    }
    // text
    return (
      '<div class="field field-full"><label>Judul Bagian</label><input type="text" value="' + esc(s.heading) + '" data-sec-index="' + i + '" data-sec-field="heading"><p class="field__hint">Kosongkan kalau bagian ini tanpa judul.</p></div>' +
      '<div class="field field-toggle field-full">' +
        '<label>Tampilkan di Daftar Isi</label>' +
        '<button type="button" class="toggle-switch" data-sec-index="' + i + '" data-sec-toggle="showInToc" aria-checked="' + (s.showInToc ? 'true' : 'false') + '"></button>' +
      '</div>' +
      '<div class="field field-full"><label>Isi Tulisan</label><textarea data-sec-index="' + i + '" data-sec-field="body" rows="6">' + esc(s.body) + '</textarea></div>'
    );
  }

  function renderSectionsList() {
    if (!state.sections.length) {
      el.sectionsList.innerHTML = '<p class="rlist__empty">Belum ada bagian artikel.</p>';
      return;
    }
    el.sectionsList.innerHTML = state.sections.map(function (s, i) {
      return (
        '<div class="rlist__item">' +
          itemHeadHtml(i, state.sections.length, 'Bagian ' + (i + 1) + ' — ' + SECTION_TYPE_LABEL[s.kind]) +
          '<div class="rlist__type-row">' +
            '<label>Jenis bagian</label>' +
            '<select data-sec-type-index="' + i + '">' +
              '<option value="text"' + (s.kind === 'text' ? ' selected' : '') + '>Teks</option>' +
              '<option value="table"' + (s.kind === 'table' ? ' selected' : '') + '>Tabel Perbandingan</option>' +
              '<option value="quote"' + (s.kind === 'quote' ? ' selected' : '') + '>Kutipan</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-grid">' + sectionBodyHtml(s, i) + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function defaultSection(kind) {
    if (kind === 'quote') return { kind: 'quote', quote: '' };
    if (kind === 'table') return { kind: 'table', heading: '', table_split: false, table_headers: '', table_rows: [''] };
    return { kind: 'text', heading: '', showInToc: true, body: '' };
  }

  el.sectionAddBtn.addEventListener('click', function () {
    state.sections.push(defaultSection('text'));
    renderSectionsList();
  });
  el.sectionsList.addEventListener('click', function (e) {
    var rowAdd = e.target.closest('[data-row-add]');
    var rowRemove = e.target.closest('[data-row-remove]');
    var toggle = e.target.closest('[data-sec-toggle]');
    if (rowAdd) {
      state.sections[Number(rowAdd.dataset.secIndex)].table_rows.push('');
      renderSectionsList();
      return;
    }
    if (rowRemove) {
      var sec = state.sections[Number(rowRemove.dataset.secIndex)];
      sec.table_rows.splice(Number(rowRemove.dataset.rowIndex), 1);
      if (!sec.table_rows.length) sec.table_rows.push('');
      renderSectionsList();
      return;
    }
    if (toggle) {
      var s = state.sections[Number(toggle.dataset.secIndex)];
      var field = toggle.dataset.secToggle;
      s[field] = !s[field];
      setToggle(toggle, s[field]);
      return;
    }
    handleListReorderRemove(e, state.sections, renderSectionsList);
  });
  el.sectionsList.addEventListener('change', function (e) {
    var typeSel = e.target.closest('[data-sec-type-index]');
    if (typeSel) {
      state.sections[Number(typeSel.dataset.secTypeIndex)] = defaultSection(typeSel.value);
      renderSectionsList();
    }
  });
  el.sectionsList.addEventListener('input', function (e) {
    var field = e.target.closest('[data-sec-field]');
    if (field) {
      state.sections[Number(field.dataset.secIndex)][field.dataset.secField] = field.value;
      return;
    }
    var rowField = e.target.closest('[data-row-field]');
    if (rowField) {
      state.sections[Number(rowField.dataset.secIndex)].table_rows[Number(rowField.dataset.rowIndex)] = rowField.value;
    }
  });

  // ------------------------------------------------------------- Kata Kunci
  // Chip di-render ke wadah TERPISAH (el.keywordChips), input-nya sendiri
  // gak pernah dicabut/dipasang ulang lewat innerHTML — sebelumnya
  // el.keywordInput ikut jadi anak yang di-reset lewat innerHTML, dan
  // mindahin elemen yang lagi fokus keluar-masuk DOM kayak gitu MEMICU
  // event blur di tengah jalan. Blur itu jalanin addKeywordFromInput()
  // lagi sebelum value-nya sempat dikosongin, jadi 1 kata kunci ke-tambah
  // 2x. Wadah terpisah ini betulin dari akarnya — input-nya diam aja.
  function renderKeywords() {
    el.keywordChips.innerHTML = state.keywords.map(function (kw, i) {
      return '<span class="keyword-chip-edit">#' + esc(kw) + '<button type="button" data-kw-remove="' + i + '" aria-label="Hapus">&times;</button></span>';
    }).join('');
  }
  function addKeywordFromInput() {
    var v = el.keywordInput.value.trim().replace(/^#/, '');
    el.keywordInput.value = '';
    if (v && state.keywords.indexOf(v) === -1) {
      state.keywords.push(v);
      renderKeywords();
    }
  }
  el.keywordInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeywordFromInput(); }
  });
  el.keywordInput.addEventListener('blur', function () { if (el.keywordInput.value.trim()) addKeywordFromInput(); });
  el.keywordChips.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-kw-remove]');
    if (rm) { state.keywords.splice(Number(rm.dataset.kwRemove), 1); renderKeywords(); }
  });

  // -------------------------------------------------------- Field bindings
  el.title.addEventListener('input', function () {
    state.title = el.title.value;
    if (!slugTouchedManually) { state.slug = slugify(state.title); el.slug.value = state.slug; }
  });
  el.slug.addEventListener('input', function () {
    slugTouchedManually = true;
    state.slug = slugify(el.slug.value);
  });
  el.slug.addEventListener('blur', function () { el.slug.value = state.slug; });
  el.category.addEventListener('change', function () { state.category = el.category.value; });
  el.readTime.addEventListener('input', function () { state.readTime = el.readTime.value; });
  el.draft.addEventListener('click', function () { state.draft = !state.draft; setToggle(el.draft, state.draft); });
  el.heroAlt.addEventListener('input', function () { state.heroImageAlt = el.heroAlt.value; });
  el.metaDescription.addEventListener('input', function () { state.metaDescription = el.metaDescription.value; });

  // --------------------------------------------------------- Tanggal Publish
  // Calendar_view lagi ditampilin (state terpisah dari state.date -> biar
  // bisa geser bulan buat CARI tanggal tanpa langsung ngubah nilai artikel
  // sebelum diklik/dipilih beneran).
  var calView = null; // {year, month} 1-12

  function renderDateText() {
    var parts = parseIso(state.date);
    if (parts) {
      el.dateText.textContent = formatDateDisplay(parts);
      el.dateText.classList.remove('is-placeholder');
    } else {
      el.dateText.textContent = 'dd/mm/yyyy --:--';
      el.dateText.classList.add('is-placeholder');
    }
  }

  function openDatePopover() {
    var parts = parseIso(state.date) || (function () {
      var now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: now.getHours(), minute: now.getMinutes() };
    })();
    calView = { year: parts.year, month: parts.month };
    el.dateHour.value = String(parts.hour).padStart(2, '0');
    el.dateMinute.value = String(parts.minute).padStart(2, '0');
    renderCalendarGrid();
    el.datePopover.hidden = false;
    el.dateTrigger.setAttribute('aria-expanded', 'true');
    el.dateField.classList.add('is-sheet-open');
  }
  function closeDatePopover() {
    el.datePopover.hidden = true;
    el.dateTrigger.setAttribute('aria-expanded', 'false');
    el.dateField.classList.remove('is-sheet-open');
  }
  el.dateTrigger.addEventListener('click', function () {
    if (el.datePopover.hidden) openDatePopover(); else closeDatePopover();
  });
  document.addEventListener('click', function (e) {
    if (!el.datePopover.hidden && !e.target.closest('.date-popover') && !e.target.closest('.date-trigger')) closeDatePopover();
  });

  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function renderCalendarGrid() {
    el.dateCalLabel.textContent = MONTH_NAMES[calView.month - 1] + ' ' + calView.year;
    var firstOfMonth = new Date(calView.year, calView.month - 1, 1);
    var startWeekday = firstOfMonth.getDay(); // 0=Su
    var daysInMonth = new Date(calView.year, calView.month, 0).getDate();
    var daysInPrevMonth = new Date(calView.year, calView.month - 1, 0).getDate();
    var selected = parseIso(state.date);
    var today = new Date();

    var cells = [];
    for (var i = 0; i < startWeekday; i++) {
      cells.push({ day: daysInPrevMonth - startWeekday + 1 + i, muted: true });
    }
    for (var d = 1; d <= daysInMonth; d++) cells.push({ day: d, muted: false });
    while (cells.length % 7 !== 0 || cells.length < 42) {
      cells.push({ day: cells.length - startWeekday - daysInMonth + 1, muted: true });
      if (cells.length >= 42) break;
    }

    el.dateCalGrid.innerHTML = cells.map(function (c) {
      var isSelected = !c.muted && selected && selected.year === calView.year && selected.month === calView.month && selected.day === c.day;
      var isToday = !c.muted && today.getFullYear() === calView.year && (today.getMonth() + 1) === calView.month && today.getDate() === c.day;
      var cls = (c.muted ? 'is-muted' : '') + (isSelected ? ' is-selected' : '') + (isToday && !isSelected ? ' is-today' : '');
      return '<button type="button" class="' + cls + '"' + (c.muted ? ' disabled' : ' data-day="' + c.day + '"') + '>' + c.day + '</button>';
    }).join('');
  }

  el.dateCalPrev.addEventListener('click', function () {
    calView.month--;
    if (calView.month < 1) { calView.month = 12; calView.year--; }
    renderCalendarGrid();
  });
  el.dateCalNext.addEventListener('click', function () {
    calView.month++;
    if (calView.month > 12) { calView.month = 1; calView.year++; }
    renderCalendarGrid();
  });
  el.dateCalGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-day]');
    if (!btn) return;
    var hour = Math.min(23, Math.max(0, parseInt(el.dateHour.value, 10) || 0));
    var minute = Math.min(59, Math.max(0, parseInt(el.dateMinute.value, 10) || 0));
    state.date = buildIso(calView.year, calView.month, Number(btn.dataset.day), hour, minute);
    renderDateText();
    renderCalendarGrid();
  });
  function applyTimeChange() {
    var parts = parseIso(state.date);
    if (!parts) return; // belum ada tanggal dipilih — jam diinget pas tanggal diklik
    var hour = Math.min(23, Math.max(0, parseInt(el.dateHour.value, 10) || 0));
    var minute = Math.min(59, Math.max(0, parseInt(el.dateMinute.value, 10) || 0));
    state.date = buildIso(parts.year, parts.month, parts.day, hour, minute);
    renderDateText();
  }
  el.dateHour.addEventListener('input', applyTimeChange);
  el.dateMinute.addEventListener('input', applyTimeChange);
  el.dateClearBtn.addEventListener('click', function () {
    state.date = '';
    renderDateText();
    closeDatePopover();
  });
  el.dateDoneBtn.addEventListener('click', closeDatePopover);

  // --------------------------------------------------------------- Gambar
  el.heroPickBtn.addEventListener('click', function () { el.heroFile.click(); });
  el.heroFile.addEventListener('change', function () {
    var file = el.heroFile.files[0];
    if (!file) return;
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var base = state.slug || slugify(state.title) || 'artikel';
    var filename = base + '-' + Date.now() + '.' + ext;

    el.heroUploadStatus.textContent = 'Mengunggah ' + file.name + '...';
    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = String(reader.result);
      var base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
      fetch(SAVE_SERVER + '/upload-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filename, dataBase64: base64 }),
      }).then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.data.error || 'Upload gagal');
          state.heroImage = res.data.path;
          renderHeroPreview();
          el.heroUploadStatus.textContent = 'Tersimpan: ' + res.data.path;
        }).catch(function (err) {
          el.heroUploadStatus.textContent = 'Gagal unggah: ' + err.message + ' (pastikan "npm run admin:save" jalan)';
        });
    };
    reader.readAsDataURL(file);
  });

  // ------------------------------------------------------------ Publish
  function collectArticle() {
    return {
      slug: state.slug,
      date: state.date,
      draft: state.draft,
      category: state.category,
      readTime: state.readTime,
      title: state.title,
      metaDescription: state.metaDescription,
      heroImage: state.heroImage,
      heroImageAlt: state.heroImageAlt,
      leadParagraphs: state.leadParagraphs.filter(function (p) { return p.trim(); }),
      sections: state.sections.map(fromEditable),
      keywords: state.keywords,
    };
  }

  function validate() {
    if (!state.title.trim()) return 'Judul artikel wajib diisi.';
    if (!state.slug.trim()) return 'URL artikel (slug) wajib diisi.';
    return '';
  }

  el.publishBtn.addEventListener('click', function () {
    var err = validate();
    if (err) { setStatus(err, 'error'); return; }

    var article = collectArticle();
    el.publishBtn.disabled = true;
    setStatus('Menyimpan...', 'saving');

    fetch(SAVE_SERVER + '/articles/' + article.slug, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(article),
    }).then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'Gagal menyimpan');
        // Artikel lama yang slug-nya diganti: hapus file lama biar gak nyisa duplikat.
        if (!isNew && originalSlug && originalSlug !== article.slug) {
          return fetch(SAVE_SERVER + '/articles/' + originalSlug, { method: 'DELETE' });
        }
      }).then(function () {
        window.location.href = '/admin/articles/';
      }).catch(function (err) {
        el.publishBtn.disabled = false;
        setStatus(err.message + ' (pastikan "npm run admin:save" jalan)', 'error');
      });
  });

  el.deleteBtn.addEventListener('click', function () {
    if (!window.confirm('Hapus artikel "' + state.title + '"? Aksi ini gak bisa dibatalkan.')) return;
    el.deleteBtn.disabled = true;
    setStatus('Menghapus...', 'saving');
    fetch(SAVE_SERVER + '/articles/' + originalSlug, { method: 'DELETE' })
      .then(function (r) { if (!r.ok) throw new Error('Gagal menghapus'); window.location.href = '/admin/articles/'; })
      .catch(function (err) {
        el.deleteBtn.disabled = false;
        setStatus(err.message, 'error');
      });
  });

  loadArticle();
})();
