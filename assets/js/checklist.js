/* ============================================================================
   ENGINE "CHECKLIST DOKUMEN USAHA" — dibangun bertahap per step (beda dari
   quiz.js Legal Check yang udah data-driven lengkap dgn branching). Step
   yang sudah ada: step 1 (Pilih Jenis Layanan, radio), step 2 (data diri
   pendiri/pemegang saham, form berulang), step 3 (NPWP pribadi tiap
   pendiri, form berulang juga — pola sama persis step 2), step 4 (3 opsi
   nama PT, field TETAP 3 — bukan form berulang kayak step 2/3, jadi gak
   ada tombol "+ Tambah"), step 5 (alamat kedudukan usaha, satu textarea),
   step 6 (susunan modal & pemegang saham — modal dasar/disetor + jumlah
   saham per pendiri, REUSE daftar nama dari state.persons step 2, bukan
   daftar baru), step 7 (nomor telepon & email aktif — step TERAKHIR,
   tombolnya "Cetak Checklist" bukan "Lanjut", submit ke Supabase lalu
   nampilin layar sukses "1x24 jam" sama persis renderLeadSuccess quiz.js).

   Beda penting dari .quiz-option Legal Check: di sana itu <button> kosong
   yg status "kepilih"-nya cuma ditandain class .is-selected lewat JS. Di
   sini .quiz-option itu <label> yg membungkus <input type="radio"> ASLI
   (name sama buat satu grup) — jadi mutual-exclusivity-nya native browser
   behavior, bukan cuma class di-toggle manual. Visual tetap sama persis
   (reuse .quiz-option__radio dkk dari style.css). */
(function () {
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var STEP1_OPTIONS = [
    { value: 'pendirian-pt', label: 'Pendirian PT' },
    { value: 'pendirian-cv', label: 'Pendirian CV' },
    { value: 'nib-perizinan', label: 'NIB & Perizinan Berusaha' },
    { value: 'legalitas-pertanahan', label: 'Legalitas Pertanahan' }
  ];

  function emptyPerson() { return { nama: '', nik: '', alamat: '' }; }
  function emptyNpwp() { return { nama: '', npwp: '' }; }

  var TOTAL_STEPS = 7; // step 7 = terakhir (fix, bukan perkiraan lagi)

  function initChecklist() {
    var root = $('#checklistQuiz');
    if (!root) return;

    var bubble = $('#checklistBubble', root);
    var card = $('#checklistCard', root);
    var progressBar = $('#checklistProgressBar', root);
    var progressEl = $('#checklistProgress', root);

    // state dipegang di sini (bukan di-reset tiap render) biar jawaban
    // step sebelumnya gak hilang pas user maju/mundur antar step.
    var state = {
      jenisLayanan: null,
      persons: [emptyPerson()],
      npwpList: [emptyNpwp()],
      companyNames: ['', '', ''],
      businessAddress: '',
      modalDasar: '',
      modalDisetor: '',
      contactPhone: '',
      contactEmail: ''
    };

    function setProgress(step) {
      var pct = Math.min(100, (step / TOTAL_STEPS) * 100);
      progressBar.style.transform = 'scaleX(' + (pct / 100) + ')';
      progressEl.setAttribute('aria-valuenow', Math.round(pct));
    }

    function renderBubble(stepNum, eyebrowLabel, title, subtitle) {
      bubble.innerHTML =
        '<div class="quiz-bubble__eyebrow"><span class="quiz-bubble__eyebrow-num">' + stepNum + '</span>' + eyebrowLabel + '</div>' +
        '<h2 class="quiz-bubble__title">' + title + '</h2>' +
        (subtitle ? '<p class="quiz-bubble__subtitle">' + subtitle + '</p>' : '');
    }

    /* ============================================================ STEP 1 */
    function optionHtml(opt) {
      var isSelected = state.jenisLayanan === opt.value;
      return (
        '<label class="quiz-option' + (isSelected ? ' is-selected' : '') + '">' +
          '<input type="radio" name="jenisLayanan" value="' + opt.value + '" class="quiz-option__input"' +
            (isSelected ? ' checked' : '') + '>' +
          '<span class="quiz-option__radio" aria-hidden="true"></span>' +
          '<span class="quiz-option__text">' +
            '<span class="quiz-option__label">' + opt.label + '</span>' +
          '</span>' +
        '</label>'
      );
    }

    function renderStep1() {
      renderBubble(1, 'Pilih salah satu', 'Jenis layanan apa yang kamu butuhkan?');

      var optionsHtml = STEP1_OPTIONS.map(optionHtml).join('');

      card.innerHTML =
        '<div class="quiz-options">' + optionsHtml + '</div>' +
        '<div class="quiz-actions">' +
          '<button type="button" class="btn btn--light btn--sm quiz-next" id="checklistNext" ' + (state.jenisLayanan ? '' : 'disabled') + '>Lanjut' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></i>' +
          '</button>' +
        '</div>';

      var nextBtn = $('#checklistNext', card);

      $$('.quiz-option', card).forEach(function (label) {
        var input = $('.quiz-option__input', label);
        input.addEventListener('change', function () {
          state.jenisLayanan = input.value;
          $$('.quiz-option', card).forEach(function (l) {
            l.classList.toggle('is-selected', $('.quiz-option__input', l).checked);
          });
          nextBtn.disabled = false;
        });
      });

      nextBtn.addEventListener('click', function () {
        if (!state.jenisLayanan) return;
        renderStep2();
      });

      setProgress(1);
    }

    /* ============================================================ STEP 2 */
    function personBlockHtml(person, i) {
      var nikInvalid = person.nik && person.nik.length !== 16;
      return (
        '<div class="checklist-person" data-person-index="' + i + '">' +
          '<div class="checklist-person__head">' +
            '<span class="checklist-person__title">Pendiri / Pemegang Saham ' + (i + 1) + '</span>' +
            (i > 0 ?
              '<button type="button" class="checklist-person__remove" data-remove-index="' + i + '" aria-label="Hapus pendiri ' + (i + 1) + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m3 0-.9 13.1A2 2 0 0 1 16.1 22H7.9a2 2 0 0 1-2-1.9L5 7"/></svg>' +
              '</button>'
              : '') +
          '</div>' +
          '<div class="checklist-person__fields">' +
            '<div class="field">' +
              '<label for="checklistPersonNama' + i + '">Nama Lengkap (sesuai KTP)</label>' +
              '<input type="text" id="checklistPersonNama' + i + '" data-person-field="nama" data-person-index="' + i + '" placeholder="Masukkan nama sesuai KTP" value="' + person.nama + '">' +
            '</div>' +
            '<div class="field">' +
              '<label for="checklistPersonNik' + i + '">NIK (sesuai KTP)</label>' +
              '<input type="text" inputmode="numeric" maxlength="16" id="checklistPersonNik' + i + '" data-person-field="nik" data-person-index="' + i + '" placeholder="16 digit NIK" value="' + person.nik + '"' + (nikInvalid ? ' aria-invalid="true"' : '') + '>' +
            '</div>' +
            '<div class="field">' +
              '<label for="checklistPersonAlamat' + i + '">Alamat (sesuai KTP)</label>' +
              '<textarea id="checklistPersonAlamat' + i + '" data-person-field="alamat" data-person-index="' + i + '" placeholder="Contoh: Jl. Melati III No. 12, RT 004/RW 007, Kel. Sukamaju, Kec. Cibinong">' + person.alamat + '</textarea>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    function personsValid() {
      return state.persons.every(function (p) {
        return p.nama.trim() && p.alamat.trim() && /^\d{16}$/.test(p.nik);
      });
    }

    function renderStep2() {
      renderBubble(
        2,
        'Lengkapi data',
        'Siapa saja pendiri / pemegang saham usahamu?',
        'Kalau usahamu dimiliki lebih dari satu orang, tambahkan datanya satu per satu lewat tombol di bawah.'
      );

      var personsHtml = state.persons.map(personBlockHtml).join('');

      card.innerHTML =
        '<div class="checklist-persons" id="checklistPersons">' + personsHtml + '</div>' +
        '<button type="button" class="checklist-add-person" id="checklistAddPerson">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>' +
          'Tambah Pendiri / Pemegang Saham' +
        '</button>' +
        '<div class="quiz-actions">' +
          '<button type="button" class="btn btn--ghost btn--sm quiz-back" id="checklistBack">' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg></i>' +
            'Kembali</button>' +
          '<button type="button" class="btn btn--light btn--sm quiz-next" id="checklistNext2" ' + (personsValid() ? '' : 'disabled') + '>Lanjut' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></i>' +
          '</button>' +
        '</div>';

      var persons = $('#checklistPersons', card);
      var next2Btn = $('#checklistNext2', card);

      function refreshNext() { next2Btn.disabled = !personsValid(); }

      $$('[data-person-field]', persons).forEach(function (input) {
        input.addEventListener('input', function () {
          var i = Number(input.dataset.personIndex);
          var field = input.dataset.personField;
          var value = input.value;
          if (field === 'nik') value = value.replace(/\D/g, '').slice(0, 16);
          if (field === 'nik' && value !== input.value) input.value = value;
          state.persons[i][field] = value;
          refreshNext();
        });
      });

      $$('.checklist-person__remove', persons).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = Number(btn.dataset.removeIndex);
          state.persons.splice(i, 1);
          renderStep2();
        });
      });

      $('#checklistAddPerson', card).addEventListener('click', function () {
        state.persons.push(emptyPerson());
        renderStep2();
      });

      $('#checklistBack', card).addEventListener('click', renderStep1);

      next2Btn.addEventListener('click', function () {
        if (!personsValid()) return;
        renderStep3();
      });

      setProgress(2);
    }

    /* ============================================================ STEP 3 */
    function npwpBlockHtml(entry, i) {
      var npwpInvalid = entry.npwp && entry.npwp.length !== 15 && entry.npwp.length !== 16;
      return (
        '<div class="checklist-person" data-npwp-index="' + i + '">' +
          '<div class="checklist-person__head">' +
            '<span class="checklist-person__title">NPWP Pribadi Pendiri ' + (i + 1) + '</span>' +
            (i > 0 ?
              '<button type="button" class="checklist-person__remove" data-remove-npwp-index="' + i + '" aria-label="Hapus NPWP pendiri ' + (i + 1) + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m3 0-.9 13.1A2 2 0 0 1 16.1 22H7.9a2 2 0 0 1-2-1.9L5 7"/></svg>' +
              '</button>'
              : '') +
          '</div>' +
          '<div class="checklist-person__fields">' +
            '<div class="field">' +
              '<label for="checklistNpwpNama' + i + '">Nama Pendiri</label>' +
              '<input type="text" id="checklistNpwpNama' + i + '" data-npwp-field="nama" data-npwp-index="' + i + '" placeholder="Nama pendiri pemilik NPWP ini" value="' + entry.nama + '">' +
            '</div>' +
            '<div class="field">' +
              '<label for="checklistNpwpNomor' + i + '">Nomor NPWP</label>' +
              '<input type="text" inputmode="numeric" maxlength="16" id="checklistNpwpNomor' + i + '" data-npwp-field="npwp" data-npwp-index="' + i + '" placeholder="16 digit NPWP (atau 15 digit format lama)" value="' + entry.npwp + '"' + (npwpInvalid ? ' aria-invalid="true"' : '') + '>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    function npwpListValid() {
      return state.npwpList.every(function (e) {
        return e.nama.trim() && (e.npwp.length === 15 || e.npwp.length === 16);
      });
    }

    function renderStep3() {
      renderBubble(
        3,
        'Lengkapi data',
        'Berapa NPWP pribadi tiap pendiri?',
        'Tambahkan NPWP pribadi untuk tiap pendiri/pemegang saham yang sudah kamu isi di langkah sebelumnya.'
      );

      var npwpHtml = state.npwpList.map(npwpBlockHtml).join('');

      card.innerHTML =
        '<div class="checklist-persons" id="checklistNpwpList">' + npwpHtml + '</div>' +
        '<button type="button" class="checklist-add-person" id="checklistAddNpwp">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>' +
          'Tambah NPWP Pribadi Pendiri' +
        '</button>' +
        '<div class="quiz-actions">' +
          '<button type="button" class="btn btn--ghost btn--sm quiz-back" id="checklistBack3">' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg></i>' +
            'Kembali</button>' +
          '<button type="button" class="btn btn--light btn--sm quiz-next" id="checklistNext3" ' + (npwpListValid() ? '' : 'disabled') + '>Lanjut' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></i>' +
          '</button>' +
        '</div>';

      var npwpList = $('#checklistNpwpList', card);
      var next3Btn = $('#checklistNext3', card);

      function refreshNext() { next3Btn.disabled = !npwpListValid(); }

      $$('[data-npwp-field]', npwpList).forEach(function (input) {
        input.addEventListener('input', function () {
          var i = Number(input.dataset.npwpIndex);
          var field = input.dataset.npwpField;
          var value = input.value;
          if (field === 'npwp') value = value.replace(/\D/g, '').slice(0, 16);
          if (field === 'npwp' && value !== input.value) input.value = value;
          state.npwpList[i][field] = value;
          refreshNext();
        });
      });

      $$('.checklist-person__remove', npwpList).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = Number(btn.dataset.removeNpwpIndex);
          state.npwpList.splice(i, 1);
          renderStep3();
        });
      });

      $('#checklistAddNpwp', card).addEventListener('click', function () {
        state.npwpList.push(emptyNpwp());
        renderStep3();
      });

      $('#checklistBack3', card).addEventListener('click', renderStep2);

      next3Btn.addEventListener('click', function () {
        if (!npwpListValid()) return;
        renderStep4();
      });

      setProgress(3);
    }

    /* ============================================================ STEP 4 */
    function companyNamesValid() {
      var names = state.companyNames.map(function (n) { return n.trim(); });
      if (names.some(function (n) { return !n; })) return false;
      var unique = {};
      for (var i = 0; i < names.length; i++) {
        var key = names[i].toLowerCase();
        if (unique[key]) return false;
        unique[key] = true;
      }
      return true;
    }

    function renderStep4() {
      renderBubble(
        4,
        'Lengkapi data',
        'Nama PT apa yang kamu inginkan?',
        'Siapkan 3 opsi nama berbeda, jaga-jaga kalau pilihan pertama ternyata sudah dipakai badan usaha lain.'
      );

      var placeholders = ['Contoh: Maju Jaya Sentosa', 'Contoh: Karya Abadi Makmur', 'Contoh: Cipta Mandiri Sejahtera'];
      var fieldsHtml = state.companyNames.map(function (name, i) {
        return (
          '<div class="field">' +
            '<label for="checklistCompanyName' + i + '">Nama PT Pilihan ' + (i + 1) + '</label>' +
            '<input type="text" id="checklistCompanyName' + i + '" data-company-index="' + i + '" placeholder="' + placeholders[i] + '" value="' + name + '">' +
          '</div>'
        );
      }).join('');

      card.innerHTML =
        '<div class="checklist-person__fields">' + fieldsHtml + '</div>' +
        '<div class="quiz-actions">' +
          '<button type="button" class="btn btn--ghost btn--sm quiz-back" id="checklistBack4">' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg></i>' +
            'Kembali</button>' +
          '<button type="button" class="btn btn--light btn--sm quiz-next" id="checklistNext4" ' + (companyNamesValid() ? '' : 'disabled') + '>Lanjut' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></i>' +
          '</button>' +
        '</div>';

      var next4Btn = $('#checklistNext4', card);

      $$('[data-company-index]', card).forEach(function (input) {
        input.addEventListener('input', function () {
          var i = Number(input.dataset.companyIndex);
          state.companyNames[i] = input.value;
          next4Btn.disabled = !companyNamesValid();
        });
      });

      $('#checklistBack4', card).addEventListener('click', renderStep3);

      next4Btn.addEventListener('click', function () {
        if (!companyNamesValid()) return;
        renderStep5();
      });

      setProgress(4);
    }

    /* ============================================================ STEP 5 */
    function renderStep5() {
      renderBubble(
        5,
        'Lengkapi data',
        'Di mana alamat kedudukan usahamu?',
        'Alamat ini yang dipakai sebagai alamat resmi kantor/usaha di dokumen legalitas — boleh sama atau beda dengan alamat KTP pendiri.'
      );

      card.innerHTML =
        '<div class="checklist-person__fields">' +
          '<div class="field">' +
            '<label for="checklistBusinessAddress">Alamat Kedudukan Usaha</label>' +
            '<textarea id="checklistBusinessAddress" placeholder="Contoh: Jl. Melati III No. 12, RT 004/RW 007, Kel. Sukamaju, Kec. Cibinong">' + state.businessAddress + '</textarea>' +
          '</div>' +
        '</div>' +
        '<div class="quiz-actions">' +
          '<button type="button" class="btn btn--ghost btn--sm quiz-back" id="checklistBack5">' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg></i>' +
            'Kembali</button>' +
          '<button type="button" class="btn btn--light btn--sm quiz-next" id="checklistNext5" ' + (state.businessAddress.trim() ? '' : 'disabled') + '>Lanjut' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></i>' +
          '</button>' +
        '</div>';

      var next5Btn = $('#checklistNext5', card);

      $('#checklistBusinessAddress', card).addEventListener('input', function () {
        state.businessAddress = this.value;
        next5Btn.disabled = !this.value.trim();
      });

      $('#checklistBack5', card).addEventListener('click', renderStep4);

      next5Btn.addEventListener('click', function () {
        if (!state.businessAddress.trim()) return;
        renderStep6();
      });

      setProgress(5);
    }

    /* ============================================================ STEP 6 */
    function isPositiveNumber(v) { return v.trim() !== '' && Number(v) > 0; }

    function shareholdersValid() {
      return isPositiveNumber(state.modalDasar) &&
        isPositiveNumber(state.modalDisetor) &&
        state.persons.every(function (p) { return isPositiveNumber(p.saham || ''); });
    }

    function shareholderRowHtml(person, i) {
      return (
        '<div class="field">' +
          '<label for="checklistSaham' + i + '">Jumlah Lembar Saham — ' + (person.nama.trim() || 'Pendiri ' + (i + 1)) + '</label>' +
          '<input type="text" inputmode="numeric" id="checklistSaham' + i + '" data-saham-index="' + i + '" placeholder="Contoh: 100" value="' + (person.saham || '') + '">' +
        '</div>'
      );
    }

    function renderStep6() {
      renderBubble(
        6,
        'Lengkapi data',
        'Bagaimana susunan modal & pemegang saham?',
        'Isi modal dasar dan modal disetor usahamu, lalu bagi jumlah lembar saham untuk tiap pendiri yang sudah kamu isi sebelumnya.'
      );

      var shareholderRowsHtml = state.persons.map(shareholderRowHtml).join('');

      card.innerHTML =
        '<div class="checklist-person__fields">' +
          '<div class="field">' +
            '<label for="checklistModalDasar">Modal Dasar (Rp)</label>' +
            '<input type="text" inputmode="numeric" id="checklistModalDasar" placeholder="Contoh: 50000000" value="' + state.modalDasar + '">' +
          '</div>' +
          '<div class="field">' +
            '<label for="checklistModalDisetor">Modal Disetor (Rp)</label>' +
            '<input type="text" inputmode="numeric" id="checklistModalDisetor" placeholder="Contoh: 12500000" value="' + state.modalDisetor + '">' +
          '</div>' +
        '</div>' +
        '<div class="checklist-shareholders" id="checklistShareholders">' +
          '<div class="checklist-person__fields">' + shareholderRowsHtml + '</div>' +
        '</div>' +
        '<div class="quiz-actions">' +
          '<button type="button" class="btn btn--ghost btn--sm quiz-back" id="checklistBack6">' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg></i>' +
            'Kembali</button>' +
          '<button type="button" class="btn btn--light btn--sm quiz-next" id="checklistNext6" ' + (shareholdersValid() ? '' : 'disabled') + '>Lanjut' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></i>' +
          '</button>' +
        '</div>';

      var next6Btn = $('#checklistNext6', card);
      function refreshNext() { next6Btn.disabled = !shareholdersValid(); }

      function bindNumeric(input, onChange) {
        input.addEventListener('input', function () {
          var digits = input.value.replace(/\D/g, '');
          if (digits !== input.value) input.value = digits;
          onChange(digits);
          refreshNext();
        });
      }

      bindNumeric($('#checklistModalDasar', card), function (v) { state.modalDasar = v; });
      bindNumeric($('#checklistModalDisetor', card), function (v) { state.modalDisetor = v; });

      $$('[data-saham-index]', card).forEach(function (input) {
        bindNumeric(input, function (v) {
          state.persons[Number(input.dataset.sahamIndex)].saham = v;
        });
      });

      $('#checklistBack6', card).addEventListener('click', renderStep5);

      next6Btn.addEventListener('click', function () {
        if (!shareholdersValid()) return;
        renderStep7();
      });

      setProgress(6);
    }

    /* ============================================================ STEP 7 */
    function phoneValid(v) { return v.replace(/\D/g, '').length >= 9; }
    function emailValid(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
    function contactValid() { return phoneValid(state.contactPhone) && emailValid(state.contactEmail); }

    function renderStep7() {
      renderBubble(
        7,
        'Lengkapi data',
        'Nomor telepon & email aktif apa yang bisa dihubungi?',
        'Kontak ini dipakai tim kami untuk korespondensi resmi terkait legalitas usahamu.'
      );

      card.innerHTML =
        '<div class="checklist-person__fields">' +
          '<div class="field">' +
            '<label for="checklistContactPhone">Nomor Telepon / WhatsApp Aktif</label>' +
            '<input type="tel" id="checklistContactPhone" placeholder="Contoh: 08123456789" value="' + state.contactPhone + '">' +
          '</div>' +
          '<div class="field">' +
            '<label for="checklistContactEmail">Email Aktif</label>' +
            '<input type="email" id="checklistContactEmail" placeholder="Contoh: nama@email.com" value="' + state.contactEmail + '">' +
          '</div>' +
        '</div>' +
        '<div class="quiz-actions">' +
          '<button type="button" class="btn btn--ghost btn--sm quiz-back" id="checklistBack7">' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg></i>' +
            'Kembali</button>' +
          '<button type="button" class="btn btn--light btn--sm quiz-next" id="checklistSubmit" ' + (contactValid() ? '' : 'disabled') + '>Cetak Checklist' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></i>' +
          '</button>' +
        '</div>';

      var submitBtn = $('#checklistSubmit', card);
      function refreshNext() { submitBtn.disabled = !contactValid(); }

      $('#checklistContactPhone', card).addEventListener('input', function () {
        var cleanVal = this.value.replace(/[^0-9+\- ]/g, '');
        if (this.value !== cleanVal) this.value = cleanVal;
        state.contactPhone = this.value;
        refreshNext();
      });

      $('#checklistContactEmail', card).addEventListener('input', function () {
        state.contactEmail = this.value;
        refreshNext();
      });

      $('#checklistBack7', card).addEventListener('click', renderStep6);

      submitBtn.addEventListener('click', function () {
        if (!contactValid()) return;
        // Lepas class quiz-next sebelum disable: .quiz-next:disabled bikin
        // tombol abu-abu (dipakai buat state "belum valid" di step 1-6),
        // tapi pas lagi "Mengirim..." tombolnya harus tetap biru kayak
        // #quizLeadSubmit Legal Check (disable-nya cuma ngunci klik ganda,
        // bukan nunjukin ada yang invalid lagi).
        submitBtn.classList.remove('quiz-next');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';
        submitChecklist().then(function (ok) {
          if (ok) { renderSuccess(); return; }
          renderSubmitError();
        });
      });

      setProgress(7);
    }

    /* ----------------------------------------------- Submit ke Supabase
       Pola sama persis quiz.js Legal Check: insert ke tabel `leads` yang
       sama (bukan tabel baru) — dibedain lewat answers.formType biar admin
       bisa misahin "Checklist Dokumen Usaha" dari kuis Legal Check tanpa
       perlu migrasi skema tabel. */
    var SUPABASE_URL = 'https://dzrhihckfjaztdwtqmzy.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cmhpaGNrZmphenRkd3RxbXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODUzMjAsImV4cCI6MjEwNDg2MTMyMH0.XYYYjoeDnHV6WWwceCHYJFPfmYl0lJ6vDuui9SKAOWo';
    var supabaseClient = (typeof supabase !== 'undefined')
      ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;

    function submitChecklist() {
      var row = {
        nama: (state.persons[0] && state.persons[0].nama.trim()) || '-',
        whatsapp: state.contactPhone.trim(),
        email: state.contactEmail.trim(),
        answers: {
          formType: 'checklist-dokumen-usaha',
          jenisLayanan: state.jenisLayanan,
          persons: state.persons,
          npwpList: state.npwpList,
          companyNames: state.companyNames,
          businessAddress: state.businessAddress,
          modalDasar: state.modalDasar,
          modalDisetor: state.modalDisetor
        }
      };

      if (!supabaseClient) {
        console.error('[Checklist Dokumen Usaha] Supabase client belum siap (cek koneksi CDN supabase-js).');
        return Promise.resolve(false);
      }

      return supabaseClient.from('leads').insert(row).then(function (res) {
        if (res.error) {
          console.error('[Checklist Dokumen Usaha] Gagal insert ke Supabase:', res.error);
          return false;
        }
        return true;
      }).catch(function (err) {
        console.error('[Checklist Dokumen Usaha] Gagal insert ke Supabase:', err);
        return false;
      });
    }

    function renderSuccess() {
      renderBubble(7, 'Selesai', 'Checklist kamu sedang kami proses.');
      card.innerHTML =
        '<p class="quiz-lead-status">' +
          'Dokumen checklist dalam bentuk PDF akan dikirim personal ke WhatsApp / email yang kamu daftarkan, ya. ' +
          'Tim kami biasanya membalas dalam 1x24 jam kerja.' +
        '</p>';
      setProgress(7);
    }

    // Fallback kalau insert ke Supabase gagal — sama kayak renderLeadError
    // di quiz.js, jangan sampai user ngerasa isian panjangnya hilang
    // begitu aja tanpa jalan keluar.
    function renderSubmitError() {
      var waText = encodeURIComponent('Halo Temu Karsa, saya baru saja coba isi Checklist Dokumen Usaha tapi gagal terkirim. Mohon bantu prosesnya ya.');
      card.innerHTML =
        '<p class="quiz-lead-status">' +
          'Waduh, ada gangguan pas ngirim checklist kamu. Coba lagi sebentar, atau langsung hubungi kami manual lewat WhatsApp biar gak ketunda.' +
        '</p>' +
        '<div class="quiz-actions">' +
          '<a class="btn btn--ghost btn--sm quiz-wa-link" href="https://wa.me/6285121558129?text=' + waText + '" target="_blank" rel="noopener">Hubungi via WhatsApp</a>' +
          '<button type="button" class="btn btn--light btn--sm" id="checklistRetry">Coba Lagi</button>' +
        '</div>';
      $('#checklistRetry', card).addEventListener('click', renderStep7);
    }

    renderStep1();
  }

  document.addEventListener('DOMContentLoaded', initChecklist);
})();
