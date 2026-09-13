/* Terjemahan bahasa Indonesia buat UI Decap CMS (tombol, label, notifikasi).
   Decap gak nyediain locale "id" resmi (cek katalognya: decap-cms-locales
   cuma sampai ~35 bahasa, Indonesia gak ada), jadi ini didaftarin manual
   lewat CMS.registerLocale — HARUS dipanggil sebelum CMS auto-init jalan,
   makanya file ini ditaruh sebagai <script> biasa persis sebelum
   preview.js, sama-sama sesudah <script decap-cms.js>.

   Ini terjemahan SEBAGIAN — cuma string yang paling sering keliatan
   (toolbar editor, sidebar, tombol gambar, dsb). String yang gak didaftarin
   di sini otomatis balik ke bahasa Inggris bawaan Decap (registerLocale
   nge-merge sama locale "en", bukan replace total), jadi aman kalau ada
   yang kelewat. */
(function () {
  if (!window.CMS || !CMS.registerLocale) return;

  CMS.registerLocale('id', {
    auth: {
      login: 'Masuk',
      loggingIn: 'Sedang masuk...',
      loginWithGitHub: 'Masuk dengan GitHub',
      errors: {
        email: 'Pastikan email sudah diisi.',
        password: 'Masukkan password.',
      },
    },
    app: {
      header: {
        content: 'Konten',
        media: 'Media',
        quickAdd: 'Tambah cepat',
      },
      app: {
        errorHeader: 'Gagal memuat konfigurasi CMS',
        configErrors: 'Config Errors',
        checkConfigYml: 'Periksa file config.yml.',
        loadingConfig: 'Memuat konfigurasi...',
        waitingBackend: 'Menunggu backend...',
      },
      notFoundPage: { header: 'Tidak Ditemukan' },
    },
    collection: {
      sidebar: {
        collections: 'Koleksi',
        allCollections: 'Semua Koleksi',
        searchAll: 'Cari semua',
        searchIn: 'Cari di',
      },
      collectionTop: {
        sortBy: 'Urutkan',
        viewAs: 'Tampilkan sebagai',
        viewAsList: 'Tampilan daftar',
        viewAsGrid: 'Tampilan grid',
        ascending: 'A ke Z',
        descending: 'Z ke A',
        searchResults: 'Hasil pencarian untuk "%{searchTerm}"',
        searchResultsInCollection: 'Hasil pencarian untuk "%{searchTerm}" di %{collection}',
        filterBy: 'Filter',
        groupBy: 'Kelompokkan',
      },
      entries: {
        loadingEntries: 'Memuat data...',
        cachingEntries: 'Menyiapkan data...',
        longerLoading: 'Mungkin perlu waktu beberapa menit',
        noEntries: 'Belum ada data',
        unpublishedHeader: 'Belum Dipublikasikan',
      },
    },
    editor: {
      editor: {
        onLeavePage: 'Yakin mau tinggalkan halaman ini?',
        onUpdatingWithUnsavedChanges: 'Ada perubahan belum disimpan, simpan dulu sebelum ubah status.',
        onPublishingNotReady: 'Ubah status ke "Siap" dulu sebelum publish.',
        onPublishingWithUnsavedChanges: 'Ada perubahan belum disimpan, simpan dulu sebelum publish.',
        onPublishing: 'Yakin mau publish artikel ini?',
        onUnpublishing: 'Yakin mau batalkan publish artikel ini?',
        onDeleteWithUnsavedChanges: 'Yakin mau hapus artikel yang sudah dipublikasikan ini, termasuk perubahan yang belum disimpan?',
        onDeletePublishedEntry: 'Yakin mau hapus artikel yang sudah dipublikasikan ini?',
        onDeleteUnpublishedChangesWithUnsavedChanges: 'Ini akan menghapus semua perubahan yang belum dipublikasikan, termasuk yang belum disimpan di sesi ini. Tetap lanjutkan?',
        onDeleteUnpublishedChanges: 'Semua perubahan yang belum dipublikasikan akan dihapus. Tetap lanjutkan?',
        loadingEntry: 'Memuat artikel...',
        confirmLoadBackup: 'Ada draft lokal buat artikel ini yang berhasil dipulihkan, mau dipakai?',
      },
      editorInterface: {
        togglePreview: 'Tampilkan/sembunyikan preview',
        toggleScrollSync: 'Sinkronkan scroll',
      },
      editorToolbar: {
        publishing: 'Mempublikasikan...',
        publish: 'Publish artikel',
        published: 'Publish artikel',
        unpublish: 'Batalkan publish',
        duplicate: 'Duplikat',
        unpublishing: 'Membatalkan publish...',
        publishAndCreateNew: 'Publish & buat baru',
        publishAndDuplicate: 'Publish & duplikat',
        deleteUnpublishedChanges: 'Hapus perubahan belum dipublikasikan',
        deleteUnpublishedEntry: 'Hapus artikel belum dipublikasikan',
        deletePublishedEntry: 'Hapus artikel',
        deleteEntry: 'Hapus artikel',
        saving: 'Menyimpan...',
        save: 'Simpan',
        deleting: 'Menghapus...',
        updating: 'Memperbarui...',
        status: 'Status: %{status}',
        backCollection: '%{collectionLabel}',
        unsavedChanges: 'Ada Perubahan Belum Disimpan',
        changesSaved: 'Tersimpan',
        draft: 'Draft',
        inReview: 'Sedang direview',
        ready: 'Siap',
        publishNow: 'Publish sekarang',
        deployPreviewPendingButtonLabel: 'Cek Preview',
        deployPreviewButtonLabel: 'Lihat Preview',
        deployButtonLabel: 'Lihat Halaman Live',
      },
      editorWidgets: {
        image: {
          choose: 'Pilih gambar',
          chooseMultiple: 'Pilih gambar',
          chooseUrl: 'Masukkan dari URL',
          replaceUrl: 'Ganti dengan URL',
          promptUrl: 'Masukkan URL gambar',
          chooseDifferent: 'Ganti gambar',
          addMore: 'Tambah gambar lagi',
          remove: 'Hapus gambar',
          removeAll: 'Hapus semua gambar',
        },
        file: {
          choose: 'Pilih file',
          chooseUrl: 'Masukkan dari URL',
          chooseMultiple: 'Pilih file',
          replaceUrl: 'Ganti dengan URL',
          promptUrl: 'Masukkan URL file',
          chooseDifferent: 'Ganti file',
          addMore: 'Tambah file lagi',
          remove: 'Hapus file',
          removeAll: 'Hapus semua file',
        },
        datetime: { now: 'Sekarang', clear: 'Kosongkan', setToNow: 'Set %{fieldLabel} ke sekarang' },
        list: { add: 'Tambah %{item}', addType: 'Tambah %{item}' },
        object: { expand: 'Perluas', collapse: 'Ciutkan' },
      },
    },
    mediaLibrary: {
      mediaLibraryCard: {
        copy: 'Salin', copyUrl: 'Salin URL', copyPath: 'Salin Path', copyName: 'Salin Nama', copied: 'Tersalin',
      },
      mediaLibrary: {
        onDelete: 'Yakin mau hapus media yang dipilih?',
        fileTooLarge: 'File kegedean.\nMaksimal ukuran file %{size} kB.',
      },
      mediaLibraryModal: {
        loading: 'Memuat...',
        close: 'Tutup',
        noResults: 'Tidak ada hasil.',
        noAssetsFound: 'Tidak ada file ditemukan.',
        noImagesFound: 'Tidak ada gambar ditemukan.',
        images: 'Gambar',
        mediaAssets: 'File Media',
        search: 'Cari...',
        uploading: 'Mengunggah...',
        upload: 'Unggah',
        download: 'Unduh',
        deleting: 'Menghapus...',
        deleteSelected: 'Hapus yang dipilih',
        chooseSelected: 'Pilih yang ditandai',
      },
    },
    ui: {
      default: { goBackToSite: 'Kembali ke situs' },
      settingsDropdown: { logOut: 'Keluar', account: 'Menu akun' },
      toast: {
        missingRequiredField: 'Ada kolom wajib yang belum diisi. Lengkapi dulu sebelum menyimpan.',
        entrySaved: 'Tersimpan',
        entryPublished: 'Berhasil dipublikasikan',
        entryUnpublished: 'Publikasi dibatalkan',
        entryUpdated: 'Status diperbarui',
        onLoggedOut: 'Sesi berakhir, silakan login lagi.',
      },
    },
  });
})();
