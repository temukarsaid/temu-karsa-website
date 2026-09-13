/* Live preview custom buat CMS — bikin tampilan preview di panel kanan CMS
   PERSIS kayak halaman artikel beneran di website (pakai CSS & font asli
   situs), bukan tampilan generik bawaan Decap CMS. Supaya tim konten nggak
   bingung "nanti tampil kayak apa" pas lagi nulis. */
(function () {
  function slugify(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function md(str) {
    if (!str) return "";
    if (window.marked) return window.marked.parse(String(str));
    return "<p>" + esc(str) + "</p>";
  }

  function splitPipe(str) {
    return String(str || "").split("|").map(function (s) { return s.trim(); });
  }

  function renderSection(s) {
    if (s.type === "quote_section") {
      return (
        '<blockquote class="blog-detail__quote">' + esc(s.quote) + "</blockquote>"
      );
    }

    if (s.type === "table_section") {
      var headers = splitPipe(s.table_headers)
        .map(function (h) { return "<th>" + esc(h) + "</th>"; })
        .join("");
      var rows = (s.table_rows || [])
        .map(function (row) {
          var cells = splitPipe(row)
            .map(function (c) { return "<td>" + esc(c) + "</td>"; })
            .join("");
          return "<tr>" + cells + "</tr>";
        })
        .join("");
      return (
        '<div class="blog-detail__section blog-detail__section--wide">' +
        (s.heading ? "<h2>" + esc(s.heading) + "</h2>" : "") +
        '<div class="blog-table__wrap"><table class="blog-table' +
        (s.table_split ? " blog-table--split" : "") +
        '"><thead><tr>' + headers + "</tr></thead><tbody>" + rows + "</tbody></table></div>" +
        "</div>"
      );
    }

    // type "text" (default)
    return (
      '<div class="blog-detail__section">' +
      (s.heading ? "<h2>" + esc(s.heading) + "</h2>" : "") +
      md(s.body) +
      "</div>"
    );
  }

  function renderToc(sections) {
    var links = (sections || [])
      .filter(function (s) { return s.type !== "quote_section" && s.heading && s.showInToc !== false; })
      .map(function (s) {
        return (
          '<a class="blog-toc__link" href="#">' + esc(s.heading) + "</a>"
        );
      })
      .join("");
    if (!links) return "";
    return (
      '<aside class="blog-toc" style="display:block;position:static;margin-top:32px;">' +
      '<div class="blog-toc__inner"><div class="blog-toc__head">Daftar Isi</div>' +
      '<nav class="blog-toc__nav">' + links + "</nav></div></aside>"
    );
  }

  var PreviewComponent = window.createClass({
    render: function () {
      var entry = this.props.entry;
      var data = entry.get("data") ? entry.get("data").toJS() : {};
      var heroUrl = data.heroImage ? this.props.getAsset(data.heroImage).toString() : "";
      var leads = (data.leadParagraphs || [])
        .map(function (p) { return '<p class="blog-detail__lead">' + esc(p) + "</p>"; })
        .join("");
      var sections = (data.sections || []).map(renderSection).join("");
      var keywords = (data.keywords || [])
        .map(function (k) { return '<span class="keyword-chip">#' + esc(k) + "</span>"; })
        .join(" ");

      var html =
        '<div class="section" id="blog-head"><div class="wrap" style="max-width:760px;margin:0 auto;padding:32px 24px;">' +
        '<span class="blog-detail__eyebrow">' + esc(data.readTime) + "</span>" +
        "<h1 class=\"blog-detail__title\">" + esc(data.title || "(Judul artikel)") + "</h1>" +
        (heroUrl
          ? '<div class="blog-detail__hero" style="margin-top:24px;"><img src="' + heroUrl + '" alt="" style="width:100%;border-radius:18px;display:block;"></div>'
          : "") +
        '<div class="blog-detail__body" style="margin-top:24px;">' + leads + sections + "</div>" +
        renderToc(data.sections) +
        (keywords
          ? '<div style="margin-top:40px;"><h2 class="related-articles__title">Kata Kunci</h2><div class="keyword-list" style="margin-top:12px;">' + keywords + "</div></div>"
          : "") +
        "</div></div>";

      return window.h("div", { dangerouslySetInnerHTML: { __html: html } });
    },
  });

  CMS.registerPreviewStyle("/assets/css/style.css");
  CMS.registerPreviewStyle(
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
  );
  CMS.registerPreviewStyle(
    "body{background:#fff;font-family:'Plus Jakarta Sans',sans-serif;} .blog-toc{width:auto;} " +
    /* #blog-head numpang class ".section" dari style.css asli (biar semua elemen
       lain ikut styling situs), tapi ".section" itu punya padding-block:120px
       (dibikin buat section homepage penuh) — di sini jadi gap putih kosong
       gede banget di atas preview. Ditimpa manual jadi wajar buat konteks
       preview satu artikel. */
    "#blog-head.section{padding-block:0!important;}",
    { raw: true }
  );
  CMS.registerPreviewTemplate("articles", PreviewComponent);
})();
