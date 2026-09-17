/* ============================================================================
   ENGINE KUIS KARSABIZ (Legalitas Business Diagnostic) — generic, baca
   konten & aturan dari QUIZ_DATA + evaluateRecommendations() di
   quiz-data.js. Nggak perlu diubah pas ganti pertanyaan/aturan — cukup
   edit quiz-data.js.

   Beda dari kuis versi lama: di akhir, engine ini GAK nampilin hasil
   rekomendasi ke user. Rekomendasi dihitung di belakang layar terus
   di-insert ke tabel `leads` di Supabase (lihat submitLead di bawah), user
   cuma diminta isi nama/WhatsApp/email terus dikasih tau hasilnya nyusul
   personal. Ini sengaja, sesuai briefing produk — bukan bug.

   Layout ala "konsultasi": maskot "ngomong" lewat bubble berisi
   pertanyaan, kartu jawaban di sebelahnya. Ekspresi maskot ganti-ganti
   sesuai field `mascot` di quiz-data.js (fallback ke default kalau kosong).
   ============================================================================ */
(function () {
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Kredensial Supabase — "anon key" ini MEMANG didesain buat nempel di
  // kode client (bukan rahasia kayak service_role key), aman karena akses
  // publiknya udah dibatasi ketat lewat Row Level Security (RLS) di
  // Supabase: tabel `leads` cuma bisa di-INSERT dari sini, gak bisa
  // dibaca/diubah/dihapus lewat API publik sama sekali.
  var SUPABASE_URL = 'https://dzrhihckfjaztdwtqmzy.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cmhpaGNrZmphenRkd3RxbXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODUzMjAsImV4cCI6MjEwNDg2MTMyMH0.XYYYjoeDnHV6WWwceCHYJFPfmYl0lJ6vDuui9SKAOWo';
  var supabaseClient = (typeof supabase !== 'undefined')
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  var DEFAULT_MASCOT_QUESTION = 'penasaran';
  var DEFAULT_MASCOT_LEAD = 'terpesona';

  function initQuiz() {
    var root = $('#quiz');
    if (!root || typeof QUIZ_DATA === 'undefined') return;

    var bubble    = $('#quizBubble', root);
    var card      = $('#quizCard', root);
    var mascotImg = $('#quizMascotImg', root);
    var progressBar = $('#quizProgressBar', root);
    var progressEl  = $('#quizProgress', root);

    // history = jejak step yang udah dilewatin, buat tombol "Kembali" (satu
    // langkah mundur, linear — bukan loncat ke step sembarang) dan buat
    // nomor urut di eyebrow bubble.
    var history = [];
    // answers = SEMUA jawaban terkumpul sepanjang kuis, flat — key-nya id
    // pertanyaan biasa (q1, q2, q5, q6, q7) atau `key` grup (kemasan,
    // bahan, produkKhusus). Ini yang dibaca evaluateRecommendations() di
    // quiz-data.js buat nentuin rekomendasi akhir.
    var answers = {};
    // state jawaban yang lagi aktif di pertanyaan yang lagi ditampilkan —
    // buat pertanyaan biasa isinya {index, option}, buat pertanyaan grup
    // isinya {groupKey: value_or_array}
    var selectedOption = null;
    var selectedIndex = null;
    var groupAnswers = null;

    // Kedalaman terpanjang dari titik manapun ke ujung (lead-capture) —
    // dipakai buat ngira-ngira total step progress bar (perkiraan, karena
    // tiap cabang panjangnya beda — cabang makanan/dagang lebih panjang
    // karena ada pertanyaan tambahan).
    function maxDepthFrom(id, seen) {
      seen = seen || {};
      if (seen[id]) return 0; // jaga-jaga kalau ada data muter (siklus)
      seen[id] = true;
      var q = QUIZ_DATA.questions[id];
      if (!q) return 1; // ini sudah "lead-capture" (ujung)
      if (q.type === 'group') return 1 + maxDepthFrom(q.next, seen);
      var max = 0;
      q.options.forEach(function (opt) {
        var d = maxDepthFrom(opt.next, seen);
        if (d > max) max = d;
      });
      return 1 + max;
    }
    var estimatedTotal = maxDepthFrom(QUIZ_DATA.start);

    function setMascot(expression) {
      if (mascotImg) mascotImg.src = 'assets/img/mascot/' + expression + '.png';
    }

    function setProgress(isEnd) {
      var pct = isEnd ? 100 : Math.min(100, (history.length / estimatedTotal) * 100);
      progressBar.style.transform = 'scaleX(' + (pct / 100) + ')';
      progressEl.setAttribute('aria-valuenow', Math.round(pct));
    }

    function optionButtonHtml(opt, i, isCheckbox) {
      return (
        '<button type="button" class="quiz-option' + (isCheckbox ? ' quiz-option--checkbox' : '') + '" data-index="' + i + '">' +
          '<span class="quiz-option__radio" aria-hidden="true"></span>' +
          '<span class="quiz-option__text">' +
            '<span class="quiz-option__label">' + opt.label + '</span>' +
            (opt.desc ? '<span class="quiz-option__desc">' + opt.desc + '</span>' : '') +
          '</span>' +
        '</button>'
      );
    }

    /* ---------------------------------------------- Pertanyaan biasa (single-select) */
    function renderQuestion(id, presetIndex) {
      var q = QUIZ_DATA.questions[id];
      selectedOption = null;
      selectedIndex = null;
      setMascot(q.mascot || DEFAULT_MASCOT_QUESTION);

      bubble.innerHTML =
        '<div class="quiz-bubble__eyebrow"><span class="quiz-bubble__eyebrow-num">' + (history.length + 1) + '</span>Pilih salah satu</div>' +
        '<h2 class="quiz-bubble__title">' + q.title + '</h2>' +
        (q.subtitle ? '<p class="quiz-bubble__subtitle">' + q.subtitle + '</p>' : '');

      var optionsHtml = q.options.map(function (opt, i) { return optionButtonHtml(opt, i, false); }).join('');

      var hasPrev = history.length > 0;
      card.innerHTML =
        '<div class="quiz-options">' + optionsHtml + '</div>' +
        '<div class="quiz-actions">' +
          (hasPrev ? '<button type="button" class="btn btn--ghost btn--sm quiz-back">Kembali</button>' : '') +
          '<button type="button" class="btn btn--light btn--sm quiz-next" disabled>Lanjut' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></i>' +
          '</button>' +
        '</div>';

      $$('.quiz-option', card).forEach(function (btn) {
        btn.addEventListener('click', function () {
          $$('.quiz-option', card).forEach(function (b) { b.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
          selectedIndex = Number(btn.dataset.index);
          selectedOption = q.options[selectedIndex];
          $('.quiz-next', card).disabled = false;
        });
      });

      // baru trigger conditional logic (pindah pertanyaan) pas user pencet
      // Lanjut — milih opsi doang belum mindahin apa-apa
      $('.quiz-next', card).addEventListener('click', function () {
        if (!selectedOption) return;
        answers[id] = selectedOption.value;
        history.push({ id: id, kind: 'single', index: selectedIndex });
        goTo(selectedOption.next);
      });

      if (hasPrev) $('.quiz-back', card).addEventListener('click', goBack);

      // kalau baru balik dari "Kembali", tandain lagi jawaban yang
      // sebelumnya udah dipilih biar gak keliatan kosong
      if (presetIndex != null) {
        var presetBtn = $$('.quiz-option', card)[presetIndex];
        if (presetBtn) {
          presetBtn.classList.add('is-selected');
          selectedIndex = presetIndex;
          selectedOption = q.options[presetIndex];
          $('.quiz-next', card).disabled = false;
        }
      }

      setProgress(false);
    }

    /* -------------------------------- Pertanyaan grup (kumpulin fakta, single/multi) */
    function renderGroupQuestion(id, presetGroupAnswers) {
      var q = QUIZ_DATA.questions[id];
      groupAnswers = {};
      setMascot(q.mascot || DEFAULT_MASCOT_QUESTION);

      bubble.innerHTML =
        '<div class="quiz-bubble__eyebrow"><span class="quiz-bubble__eyebrow-num">' + (history.length + 1) + '</span>Pilih salah satu</div>' +
        '<h2 class="quiz-bubble__title">' + q.title + '</h2>' +
        (q.subtitle ? '<p class="quiz-bubble__subtitle">' + q.subtitle + '</p>' : '');

      var groupsHtml = q.groups.map(function (group) {
        var optionsHtml = group.options.map(function (opt, i) { return optionButtonHtml(opt, i, group.multi); }).join('');
        return (
          '<div class="quiz-group" data-key="' + group.key + '">' +
            '<div class="quiz-group__label">' + group.label +
              (group.hint ? '<span class="quiz-group__hint">' + group.hint + '</span>' : '') +
            '</div>' +
            '<div class="quiz-options">' + optionsHtml + '</div>' +
          '</div>'
        );
      }).join('');

      var hasPrev = history.length > 0;
      card.innerHTML =
        groupsHtml +
        '<div class="quiz-actions">' +
          (hasPrev ? '<button type="button" class="btn btn--ghost btn--sm quiz-back">Kembali</button>' : '') +
          '<button type="button" class="btn btn--light btn--sm quiz-next" disabled>Lanjut' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></i>' +
          '</button>' +
        '</div>';

      function groupIsValid(group) {
        var required = group.required !== false;
        if (!required) return true;
        var val = groupAnswers[group.key];
        return group.multi ? !!(val && val.length) : val != null;
      }
      function refreshNextButton() {
        $('.quiz-next', card).disabled = !q.groups.every(groupIsValid);
      }

      // panggil sekali di awal — kalau semua grup opsional (required:false,
      // kayak "produkKhusus"), tombol Lanjut harusnya udah aktif dari awal
      // tanpa nunggu user klik apapun dulu
      refreshNextButton();

      q.groups.forEach(function (group) {
        var groupEl = $('.quiz-group[data-key="' + group.key + '"]', card);
        $$('.quiz-option', groupEl).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var i = Number(btn.dataset.index);
            var value = group.options[i].value;
            if (group.multi) {
              var current = groupAnswers[group.key] || [];
              var pos = current.indexOf(value);
              if (pos === -1) { current.push(value); btn.classList.add('is-selected'); }
              else { current.splice(pos, 1); btn.classList.remove('is-selected'); }
              groupAnswers[group.key] = current;
            } else {
              $$('.quiz-option', groupEl).forEach(function (b) { b.classList.remove('is-selected'); });
              btn.classList.add('is-selected');
              groupAnswers[group.key] = value;
            }
            refreshNextButton();
          });
        });
      });

      $('.quiz-next', card).addEventListener('click', function () {
        if (!q.groups.every(groupIsValid)) return;
        q.groups.forEach(function (group) {
          answers[group.key] = group.multi ? (groupAnswers[group.key] || []) : (groupAnswers[group.key] || null);
        });
        history.push({ id: id, kind: 'group', groupAnswers: groupAnswers });
        goTo(q.next);
      });

      if (hasPrev) $('.quiz-back', card).addEventListener('click', goBack);

      // restore state kalau baru balik dari "Kembali"
      if (presetGroupAnswers) {
        groupAnswers = {};
        q.groups.forEach(function (group) {
          var prevVal = presetGroupAnswers[group.key];
          if (prevVal == null) return;
          var groupEl = $('.quiz-group[data-key="' + group.key + '"]', card);
          var values = group.multi ? prevVal : [prevVal];
          group.options.forEach(function (opt, i) {
            if (values.indexOf(opt.value) !== -1) $$('.quiz-option', groupEl)[i].classList.add('is-selected');
          });
          groupAnswers[group.key] = prevVal;
        });
        refreshNextButton();
      }

      setProgress(false);
    }

    function goBack() {
      if (!history.length) return;
      var prev = history.pop();
      if (prev.kind === 'group') renderGroupQuestion(prev.id, prev.groupAnswers);
      else renderQuestion(prev.id, prev.index);
    }

    /* ------------------------------------------------------- Layar akhir: lead capture */
    function renderLeadCapture() {
      setMascot(DEFAULT_MASCOT_LEAD);

      bubble.innerHTML =
        '<div class="quiz-bubble__eyebrow">Hampir Selesai</div>' +
        '<h2 class="quiz-bubble__title">Satu langkah lagi sebelum hasilnya kami siapkan.</h2>' +
        '<p class="quiz-bubble__subtitle">Masukkan kontak kamu — tim kami akan analisis jawabanmu dan kirim rekomendasi legalitas secara personal.</p>';

      var hasPrev = history.length > 0;
      card.innerHTML =
        '<div class="quiz-lead-form">' +
          '<div class="field">' +
            '<label for="quizLeadName">Nama Lengkap</label>' +
            '<input type="text" id="quizLeadName" placeholder="Masukkan nama kamu" required>' +
            '</div>' +
          '<div class="field">' +
            '<label for="quizLeadWa">Nomor WhatsApp</label>' +
            '<input type="tel" id="quizLeadWa" placeholder="Contoh: 08123456789" pattern="[0-9+-- ]{9,15}" title="Nomor WhatsApp harus berupa angka (min. 9 digit)" required>' +
          '</div>' +
          '<div class="field">' +
            '<label for="quizLeadEmail">Alamat Email</label>' +
            '<input type="email" id="quizLeadEmail" placeholder="Masukkan email" required>' +
          '</div>' +
        '</div>' +
        '<div class="quiz-actions" id="quizLeadActions">' +
          (hasPrev ? '<button type="button" class="btn btn--ghost btn--sm quiz-back">Kembali</button>' : '') +
          '<button type="button" class="btn btn--light btn--sm" id="quizLeadSubmit">Kirim &amp; Analisis Jawabanku' +
            '<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></i>' +
          '</button>' +
        '</div>';

      if (hasPrev) $('.quiz-back', card).addEventListener('click', goBack);

      var waInput = $('#quizLeadWa', card);
      waInput.addEventListener('input', function () {
        // Hapus karakter non-digit kecuali + / - / spasi jika diketik
        var cleanVal = this.value.replace(/[^0-9+-- ]/g, '');
        if (this.value !== cleanVal) this.value = cleanVal;
        
        var digitsOnly = this.value.replace(/\D/g, '');
        if (digitsOnly.length > 0 && digitsOnly.length < 9) {
          this.setCustomValidity('Nomor WhatsApp minimal 9 digit angka.');
        } else {
          this.setCustomValidity('');
        }
      });

      $('#quizLeadSubmit', card).addEventListener('click', function () {
        var nameEl = $('#quizLeadName', card);
        var waEl = $('#quizLeadWa', card);
        var emailEl = $('#quizLeadEmail', card);

        var digitsOnly = waEl.value.replace(/\D/g, '');
        if (!digitsOnly || digitsOnly.length < 9) {
          waEl.setCustomValidity('Nomor WhatsApp harus berupa angka (minimal 9 digit).');
        } else {
          waEl.setCustomValidity('');
        }

        if (!nameEl.reportValidity() || !waEl.reportValidity() || !emailEl.reportValidity()) return;

        var submitBtn = $('#quizLeadSubmit', card);
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';

        submitLead({ nama: nameEl.value.trim(), whatsapp: waEl.value.trim(), email: emailEl.value.trim() })
          .then(function (ok) {
            if (ok) { renderLeadSuccess(); return; }
            renderLeadError();
          });
      });

      setProgress(true);
    }

    function renderLeadSuccess() {
      setMascot('terpesona');
      bubble.innerHTML =
        '<div class="quiz-bubble__eyebrow">Terima Kasih!</div>' +
        '<h2 class="quiz-bubble__title">Jawabanmu sedang kami analisis.</h2>';
      card.innerHTML =
        '<p class="quiz-lead-status">' +
          'Hasil rekomendasi legalitas bisnismu akan dikirim personal ke WhatsApp / email yang kamu daftarkan, ya. Tim kami biasanya membalas dalam 1x24 jam kerja.' +
        '</p>' +
        '<div class="quiz-actions quiz-actions--first">' +
          '<button type="button" class="btn btn--ghost btn--sm quiz-restart">Ulangi Kuis</button>' +
        '</div>';
      $('.quiz-restart', card).addEventListener('click', reset);
    }

    // Fallback kalau insert ke Supabase gagal (koneksi putus, dsb) — jangan
    // sampai user ngerasa jawabannya "hilang begitu aja" tanpa penjelasan,
    // kasih jalur langsung ke WhatsApp biar leads-nya tetap kepegang.
    function renderLeadError() {
      var waText = encodeURIComponent('Halo Temu Karsa, saya baru saja coba isi KarsaBiz tapi gagal terkirim. Ini jawaban saya: ...');
      card.innerHTML =
        '<p class="quiz-lead-status">' +
          'Waduh, ada gangguan pas ngirim jawabanmu. Coba lagi sebentar, atau langsung hubungi kami manual lewat WhatsApp biar gak ketunda.' +
        '</p>' +
        '<div class="quiz-actions">' +
          '<a class="btn btn--ghost btn--sm" href="https://wa.me/6285121558129?text=' + waText + '" target="_blank" rel="noopener">Hubungi via WhatsApp</a>' +
          '<button type="button" class="btn btn--light btn--sm" id="quizLeadRetry">Coba Lagi</button>' +
        '</div>';
      $('#quizLeadRetry', card).addEventListener('click', function () { renderLeadCapture(); });
    }

    // Rekomendasi dihitung di sini (evaluateRecommendations ada di
    // quiz-data.js) tapi SENGAJA gak ditampilkan ke user — cuma di-insert
    // ke tabel `leads` di Supabase biar admin yang follow-up manual &
    // personal (bukan auto-generated). Return Promise<boolean> — true kalau
    // insert-nya sukses.
    function submitLead(contact) {
      var result = evaluateRecommendations(answers);
      var row = {
        nama: contact.nama,
        whatsapp: contact.whatsapp,
        email: contact.email,
        answers: answers,
        recommendations: result.items,
        kbli_matched: result.kbliMatched
      };

      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row)
        }).then(function (r) { return r.ok; }).catch(function () { return false; });
      }

      if (!supabaseClient) {
        console.error('[KarsaBiz] Supabase client belum siap (cek koneksi CDN supabase-js).');
        return Promise.resolve(false);
      }

      return supabaseClient.from('leads').insert(row).then(function (res) {
        if (res.error) {
          console.error('[KarsaBiz] Gagal insert lead ke Supabase:', res.error);
          return false;
        }
        return true;
      }).catch(function (err) {
        console.error('[KarsaBiz] Gagal insert lead ke Supabase:', err);
        return false;
      });
    }

    function goTo(id) {
      if (QUIZ_DATA.questions[id]) {
        var q = QUIZ_DATA.questions[id];
        if (q.type === 'group') renderGroupQuestion(id);
        else renderQuestion(id);
      } else {
        renderLeadCapture();
      }
    }

    function reset() {
      history = [];
      answers = {};
      goTo(QUIZ_DATA.start);
    }

    goTo(QUIZ_DATA.start);
  }

  document.addEventListener('DOMContentLoaded', initQuiz);
})();
