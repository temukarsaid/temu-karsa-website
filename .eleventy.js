/* Config Eleventy — HANYA generate halaman artikel dari eleventy/articles/*.json.
   19 halaman lain (index.html, layanan, dll) TIDAK disentuh sama sekali —
   itu tetap file HTML statis biasa, dilayani apa adanya oleh server.js/Vercel.
   Input scope-nya sengaja dipersempit ke folder eleventy/ doang (bukan root
   project) supaya Eleventy nggak pernah nyoba baca/proses file lain. */
module.exports = function (eleventyConfig) {
  // filter kecil: ubah "Judul Section" jadi "judul-section" buat id/slug
  eleventyConfig.addFilter("slugify", (str) =>
    String(str)
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );

  // isi section ditulis Markdown di CMS (paragraf, list, **bold**) — ini
  // yang ngerender jadi HTML pas build. `inline:true` khusus buat teks
  // pendek 1-baris (mis. bio) yg ga perlu dibungkus <p>.
  const md = require("markdown-it")({ html: false, linkify: true });
  eleventyConfig.addFilter("markdownify", (str) => md.render(String(str || "")));
  eleventyConfig.addFilter("markdownifyInline", (str) => md.renderInline(String(str || "")));

  // "Artikel Terbaru Lainnya" — otomatis: artikel TERBARU lain (exclude
  // artikel yang lagi dibuka), bukan pilihan manual lagi. `articles` (data
  // global, lihat eleventy/_data/articles.js) udah keurut terbaru-duluan,
  // jadi tinggal buang artikel ini sendiri terus ambil N teratas.
  eleventyConfig.addFilter("latestArticlesExcept", (allArticles, currentSlug, limit) =>
    (allArticles || []).filter((a) => a.slug !== currentSlug).slice(0, limit || 3)
  );

  // Tabel di CMS diisi 1 baris = 1 kolom teks dipisah "|" (biar tim nggak
  // perlu klik "tambah sel" berkali-kali) — filter ini yang mecahnya jadi
  // array sel pas render.
  eleventyConfig.addFilter("splitPipe", (str) =>
    String(str || "").split("|").map((s) => s.trim())
  );

  return {
    dir: {
      input: "eleventy",
      output: ".",
      includes: "_includes",
      data: "_data",
    },
    htmlOutputSuffix: "",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
