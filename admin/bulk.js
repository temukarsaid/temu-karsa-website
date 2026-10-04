/* Pilih banyak baris + hapus massal untuk tabel Legal Check & Checklist Dokumen.
   Halaman memanggil Bulk.init({...}) sekali, lalu Bulk.sync(semuaId, idHalamanIni)
   setiap selesai render baris. Pilihan bertahan antar halaman pagination, tapi
   dibuang kalau barisnya hilang dari hasil filter/pencarian — supaya "Hapus
   terpilih" tidak pernah menghapus baris yang sedang tidak terlihat. */
(function () {
  var selected = {};
  var cfg = null;
  var bar, countEl, delBtn, headBox;

  function ids() { return Object.keys(selected); }

  function cell(id) {
    return '<td class="col-check"><input type="checkbox" class="check" data-bulk-id="' + id + '" aria-label="Pilih baris ini"></td>';
  }
  function headCell() {
    return '<th class="col-check"><input type="checkbox" class="check" id="bulkAll" aria-label="Pilih semua baris di halaman ini"></th>';
  }

  function refresh() {
    var boxes = cfg.body.querySelectorAll('[data-bulk-id]');
    var on = 0;
    Array.prototype.forEach.call(boxes, function (b) {
      var is = !!selected[b.dataset.bulkId];
      b.checked = is;
      b.closest('tr').classList.toggle('is-selected', is);
      if (is) on++;
    });
    headBox = document.getElementById('bulkAll');
    if (headBox) {
      headBox.checked = boxes.length > 0 && on === boxes.length;
      headBox.indeterminate = on > 0 && on < boxes.length;
    }
    var n = ids().length;
    bar.hidden = n === 0;
    countEl.textContent = n + ' dipilih';
  }

  function sync(allIds) {
    var keep = {};
    allIds.forEach(function (id) { keep[id] = true; });
    ids().forEach(function (id) { if (!keep[id]) delete selected[id]; });
    refresh();
  }

  function init(opts) {
    cfg = opts; // { body, table, endpoint, noun, onDone }
    bar = document.createElement('div');
    bar.className = 'bulk-bar';
    bar.hidden = true;
    bar.innerHTML =
      '<span class="bulk-bar__count" role="status"></span>' +
      '<span class="bulk-bar__actions">' +
        '<button type="button" class="bulk-bar__btn" data-bulk="clear">Batal pilih</button>' +
        '<button type="button" class="bulk-bar__btn bulk-bar__btn--danger" data-bulk="delete">Hapus terpilih</button>' +
      '</span>';
    cfg.table.closest('.table-scroll').parentNode.insertBefore(bar, cfg.table.closest('.table-scroll'));
    countEl = bar.querySelector('.bulk-bar__count');
    delBtn = bar.querySelector('[data-bulk=delete]');

    cfg.body.addEventListener('change', function (e) {
      var b = e.target.closest('[data-bulk-id]');
      if (!b) return;
      if (b.checked) selected[b.dataset.bulkId] = true; else delete selected[b.dataset.bulkId];
      refresh();
    });
    cfg.table.querySelector('thead').addEventListener('change', function (e) {
      if (e.target.id !== 'bulkAll') return;
      var on = e.target.checked;
      Array.prototype.forEach.call(cfg.body.querySelectorAll('[data-bulk-id]'), function (b) {
        if (on) selected[b.dataset.bulkId] = true; else delete selected[b.dataset.bulkId];
      });
      refresh();
    });
    bar.addEventListener('click', function (e) {
      var act = e.target.closest('[data-bulk]');
      if (!act) return;
      if (act.dataset.bulk === 'clear') { selected = {}; refresh(); return; }
      var list = ids();
      if (!list.length) return;
      if (!window.confirm('Hapus ' + list.length + ' ' + cfg.noun + ' terpilih? Aksi ini gak bisa dibatalkan.')) return;
      delBtn.disabled = true;
      delBtn.textContent = 'Menghapus…';
      fetch(cfg.endpoint + '?ids=' + list.join(','), { method: 'DELETE' })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.data.error || 'Gagal menghapus');
          selected = {};
          cfg.onDone();
        })
        .catch(function (err) { window.alert(err.message); })
        .then(function () { delBtn.disabled = false; delBtn.textContent = 'Hapus terpilih'; });
    });
  }

  window.Bulk = { init: init, sync: sync, cell: cell, headCell: headCell };
})();
