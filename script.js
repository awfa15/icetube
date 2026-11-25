/* ==========================================================================
   TEFA Ice Tube (versi Bootstrap) - script.js

   Logika sama seperti versi sebelumnya. Perbedaannya hanya markup yang
   dihasilkan (memakai kelas Bootstrap) dan beberapa tambahan:
   - tema terang/gelap mengikuti perangkat
   - menu HP menutup otomatis setelah dipilih
   - tautan footer bisa menggulung ke bagian tertentu (data-scroll)
   - halaman baru: "syarat"

   Daftar isi:
   1. UMUM     : fungsi bantu, notifikasi, tema, pindah halaman
   2. KATALOG  : data produk, filter, pencarian, kartu produk
   3. KERANJANG: isi keranjang, jumlah, total, penyimpanan, pesan WhatsApp
   4. MULAI    : menampilkan halaman pertama saat dibuka
   ========================================================================== */


/* ==========================================================================
   1. UMUM
   ========================================================================== */

/* rp(n): ubah angka jadi format rupiah. Contoh: rp(17000) -> "Rp17.000" */
var rp = function (n) {
  return "Rp" + n.toLocaleString("id-ID");
};

/* $(id): singkatan untuk document.getElementById */
var $ = function (id) {
  return document.getElementById(id);
};

/* tt: menyimpan timer toast supaya bisa direset kalau toast muncul berturut-turut */
var tt;

/* toast(m): tampilkan notifikasi kecil berisi teks m selama 1,6 detik */
function toast(m) {
  var t = $("toast");
  t.textContent = m;
  t.classList.add("on");
  clearTimeout(tt);
  tt = setTimeout(function () {
    t.classList.remove("on");
  }, 1600);
}

/* Tema: kalau pengaturan terang/gelap perangkat berubah saat halaman terbuka,
   atribut data-bs-theme ikut berubah (nilai awalnya diatur di <head> index.html) */
var mq = window.matchMedia("(prefers-color-scheme: dark)");
if (mq.addEventListener) {
  mq.addEventListener("change", function (e) {
    document.documentElement.setAttribute("data-bs-theme", e.matches ? "dark" : "light");
  });
}

/* show(id): tampilkan satu halaman (home / katalog / pesan / keranjang / syarat)
   dan sembunyikan halaman lainnya.
   - id yang tidak dikenal otomatis diarahkan ke "home"
   - menu navigasi yang aktif diberi tanda aria-current="page"
   - menu di layar HP ditutup otomatis (Bootstrap Collapse)
   - alamat URL diperbarui (#id) dan layar kembali ke atas */
function show(id) {
  var S = ["home", "katalog", "pesan", "keranjang", "syarat"];
  if (S.indexOf(id) < 0) id = "home";

  S.forEach(function (s) {
    $(s).hidden = s !== id;
  });

  document.querySelectorAll("nav button[data-go]").forEach(function (b) {
    if (b.dataset.go === id) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });

  var menu = $("menu");
  if (menu && menu.classList.contains("show") && window.bootstrap) {
    bootstrap.Collapse.getOrCreateInstance(menu).hide();
  }

  try {
    history.replaceState(null, "", "#" + id);
  } catch (e) {}

  window.scrollTo(0, 0);
}

/* Klik pada elemen mana pun yang punya atribut data-go="nama-halaman"
   (logo, menu, tombol, tautan footer) akan membuka halaman tersebut.
   - preventDefault: mencegah tautan <a href="#..."> melompat sendiri
   - data-scroll="id-elemen": setelah pindah halaman, gulung ke elemen itu */
document.addEventListener("click", function (e) {
  var g = e.target.closest("[data-go]");
  if (!g) return;

  e.preventDefault();
  show(g.dataset.go);

  if (g.dataset.scroll) {
    var target = $(g.dataset.scroll);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  }
});


/* ==========================================================================
   2. KATALOG
   ========================================================================== */

/* P: daftar produk. Arti setiap field:
   n = nama, t = jenis (untuk filter), s = bentuk ilustrasi (kelas CSS s-...),
   d = deskripsi, o = pilihan ukuran [[label, harga], ...] */
var P = [
  { n: "Es Kristal Tabung", t: "kristal", s: "kristal", d: "Berlubang di tengah, cepat dingin. Favorit warung minuman dan es teh.", o: [["1 kg", 4000], ["5 kg", 17000], ["10 kg", 32000]] },
  { n: "Es Cube Kotak", t: "cube", s: "cube", d: "Kotak 2,5 cm yang lambat cair. Cocok untuk kafe dan kopi dingin.", o: [["1 kg", 6000], ["5 kg", 26000], ["10 kg", 50000]] },
  { n: "Es Bola Bening", t: "cube", s: "bola", d: "Bola padat dan bening untuk minuman premium dan acara.", o: [["6 pcs", 18000], ["12 pcs", 34000]] },
  { n: "Es Balok", t: "balok", s: "balok", d: "Balok padat untuk pendingin ikan, catering, dan box acara.", o: [["12 kg", 22000], ["25 kg", 40000]] },
  { n: "Es Serut Halus", t: "serut", s: "serut", d: "Butiran halus untuk es campur, es teler, dan display seafood.", o: [["1 kg", 5000], ["5 kg", 22000]] }
];

/* F: daftar tombol filter [kode jenis, label yang tampil] */
var F = [["semua", "Semua"], ["kristal", "Kristal"], ["cube", "Cube"], ["balok", "Balok"], ["serut", "Serut"]];

/* Status katalog:
   sel = ukuran terpilih tiap produk (indeks produk -> indeks ukuran),
   cur = filter yang aktif,
   qry = kata kunci pencarian (huruf kecil) */
var sel = {}, cur = "semua", qry = "";

/* draw(): gambar ulang filter dan kartu produk di halaman katalog.
   Produk disaring berdasarkan filter (cur) dan kata kunci (qry).
   Kalau tidak ada yang cocok, tampil pesan "Tidak ada es yang cocok".
   Kelas "active" (Bootstrap) menandai filter dan ukuran yang sedang dipilih. */
function draw() {
  /* tombol filter */
  $("filters").innerHTML = F.map(function (x) {
    return '<button class="btn btn-sm btn-chip rounded-pill' + (x[0] === cur ? ' active' : '') + '" aria-pressed="' + (x[0] === cur) + '" data-f="' + x[0] + '">' + x[1] + '</button>';
  }).join("");

  /* kartu produk (satu kolom grid Bootstrap per produk) */
  var h = P.map(function (p, i) {
    if (cur !== "semua" && p.t !== cur) return "";
    if (qry && (p.n + " " + p.t).toLowerCase().indexOf(qry) < 0) return "";

    var k = sel[i] || 0; /* ukuran yang sedang dipilih (bawaan: yang pertama) */

    return '<div class="col"><article class="card h-100" data-i="' + i + '"><div class="card-body d-flex flex-column">' +
      '<div class="shape s-' + p.s + '" aria-hidden="true"></div><h3>' + p.n + '</h3><p>' + p.d + '</p>' +
      '<div class="chips d-flex flex-wrap gap-2 mb-3">' +
      p.o.map(function (o, j) {
        return '<button class="btn btn-sm btn-chip rounded-pill chip' + (j === k ? ' active' : '') + '" data-j="' + j + '">' + o[0] + '</button>';
      }).join("") +
      '</div><div class="buy mt-auto d-flex align-items-center justify-content-between gap-2"><strong>' + rp(p.o[k][1]) + '</strong><button class="btn btn-primary rounded-pill" data-add>Tambah</button></div>' +
      '</div></article></div>';
  }).join("");

  $("grid").innerHTML = h || '<div class="col-12"><p class="lead">Tidak ada es yang cocok. Coba kata kunci lain atau pilih Semua.</p></div>';
}

/* Penanganan klik di katalog (satu listener untuk semua tombol):
   - tombol filter [data-f]   -> ganti filter lalu gambar ulang
   - chip ukuran .chip        -> simpan ukuran pilihan lalu gambar ulang (harga ikut berubah)
   - tombol Tambah [data-add] -> masukkan produk + ukuran terpilih ke keranjang */
document.addEventListener("click", function (e) {
  var f = e.target.closest("[data-f]");
  if (f) { cur = f.dataset.f; draw(); return; }

  var c = e.target.closest(".chip");
  if (c) { sel[c.closest(".card").dataset.i] = +c.dataset.j; draw(); return; }

  var a = e.target.closest("[data-add]");
  if (a) {
    var i = +a.closest(".card").dataset.i, j = sel[i] || 0;
    tambah(i, j);
  }
});

/* Kolom pencarian: setiap ketikan memperbarui kata kunci lalu menggambar ulang katalog */
$("q").addEventListener("input", function (e) {
  qry = e.target.value.trim().toLowerCase();
  draw();
});


/* ==========================================================================
   3. KERANJANG
   ========================================================================== */

/* cart: isi keranjang. Setiap item berbentuk {i: indeks produk, j: indeks ukuran, q: jumlah}.
   Dimuat dari localStorage supaya isi keranjang tetap ada setelah halaman dibuka ulang. */
var cart = [];
try {
  cart = JSON.parse(localStorage.getItem("bb-cart") || "[]");
} catch (e) {
  cart = [];
}

/* save(): simpan isi keranjang ke localStorage */
function save() {
  try {
    localStorage.setItem("bb-cart", JSON.stringify(cart));
  } catch (e) {}
}

/* line(c): hitung rincian satu item keranjang.
   Mengembalikan {n: nama + ukuran, u: harga per paket, s: subtotal (harga x jumlah)} */
function line(c) {
  var p = P[c.i], o = p.o[c.j];
  return { n: p.n + " " + o[0], u: o[1], s: o[1] * c.q };
}

/* link(): susun pesan pesanan lalu pasang ke tombol "Kirim pesanan via WhatsApp".
   Isi pesan: daftar item, total, nama, alamat, dan catatan.
   Kalau keranjang kosong, tombol dinonaktifkan. Dipanggil lagi setiap data form berubah. */
function link() {
  var t = 0, l = cart.map(function (c) {
    var x = line(c);
    t += x.s;
    return "- " + x.n + " x" + c.q + " = " + rp(x.s);
  });

  var m = "Halo TEFA Ice Tube, saya mau pesan:\n" + l.join("\n") + "\nTotal: " + rp(t) + "\nNama: " + $("nm").value + "\nAlamat: " + $("ad").value + "\nCatatan: " + $("nt").value;

  var a = $("send");
  a.href = cart.length ? "https://wa.me/6281234567890?text=" + encodeURIComponent(m) : "#";
  a.setAttribute("aria-disabled", cart.length ? "false" : "true");
}

/* drawCart(): gambar ulang halaman keranjang.
   - menampilkan tiap item (nama, harga, tombol +/-, subtotal, tombol Hapus)
   - menampilkan pesan kosong + tombol "Buka katalog" kalau keranjang kosong
   - memperbarui total, lencana jumlah di menu, tautan WhatsApp, dan penyimpanan */
function drawCart() {
  var t = 0, n = 0;

  $("cl").innerHTML = cart.length ? cart.map(function (c, k) {
    var x = line(c);
    t += x.s;
    n += c.q;
    return '<div class="cart-row d-flex align-items-center flex-wrap gap-3 py-3 border-bottom">' +
      '<div class="nm"><strong>' + x.n + '</strong><br><span class="text-mut">' + rp(x.u) + ' per paket</span></div>' +
      '<div class="qty d-flex align-items-center gap-2">' +
      '<button class="btn btn-chip btn-sm rounded-circle" data-q="-1" data-k="' + k + '" aria-label="Kurangi">−</button>' +
      '<span>' + c.q + '</span>' +
      '<button class="btn btn-chip btn-sm rounded-circle" data-q="1" data-k="' + k + '" aria-label="Tambah">+</button></div>' +
      '<strong>' + rp(x.s) + '</strong>' +
      '<button class="btn btn-link rm text-decoration-underline" data-rm="' + k + '">Hapus</button></div>';
  }).join("") :
    '<p class="lead">Keranjang masih kosong. Pilih es di katalog untuk mulai.</p><button class="btn btn-primary rounded-pill" data-go="katalog">Buka katalog</button>';

  $("cf").hidden = !cart.length; /* form data pemesan hanya tampil kalau ada item */
  $("ct").textContent = rp(t);   /* total harga */
  $("cc").textContent = n;       /* jumlah item di tombol menu Keranjang */

  link();
  save();
}

/* tambah(i, j): masukkan produk i dengan ukuran j ke keranjang.
   Kalau sudah ada, jumlahnya ditambah 1; kalau belum, dibuat item baru. Lalu tampilkan notifikasi. */
function tambah(i, j) {
  var x = cart.filter(function (c) {
    return c.i === i && c.j === j;
  })[0];

  if (x) x.q++;
  else cart.push({ i: i, j: j, q: 1 });

  drawCart();
  toast(P[i].n + " " + P[i].o[j][0] + " ditambahkan");
}

/* Penanganan klik di keranjang:
   - tombol +/- [data-q] -> ubah jumlah item; kalau jumlah kurang dari 1, item dihapus
   - tombol Hapus [data-rm] -> hapus item dari keranjang */
document.addEventListener("click", function (e) {
  var q = e.target.closest("[data-q]");
  if (q) {
    var k = +q.dataset.k;
    cart[k].q += +q.dataset.q;
    if (cart[k].q < 1) cart.splice(k, 1);
    drawCart();
    return;
  }

  var r = e.target.closest("[data-rm]");
  if (r) {
    cart.splice(+r.dataset.rm, 1);
    drawCart();
  }
});

/* Kolom nama, alamat, dan catatan: setiap ketikan memperbarui isi pesan WhatsApp */
["nm", "ad", "nt"].forEach(function (id) {
  $(id).addEventListener("input", link);
});


/* ==========================================================================
   4. MULAI
   Dijalankan sekali saat halaman dibuka:
   gambar katalog dan keranjang, lalu tampilkan halaman sesuai alamat (#...),
   atau "home" kalau tidak ada.
   ========================================================================== */
draw();
drawCart();
show(location.hash.slice(1) || "home");
