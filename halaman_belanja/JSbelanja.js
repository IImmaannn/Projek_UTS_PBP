// --- Simulasi Keranjang Belanja ---
let cartCount = 0;
const cartIcon = document.querySelector(".cart");

// Ambil semua tombol "Beli"
const buyButtons = document.querySelectorAll(".product-card button");

buyButtons.forEach(button => {
  button.addEventListener("click", () => {
    cartCount++;
    cartIcon.textContent = "🛒 (" + cartCount + ")";
    alert("Produk berhasil ditambahkan ke keranjang!");
  });
});

// --- Navigasi User Menu ---
const daftarLink = document.querySelector(".user-menu a:nth-child(1)");
const masukLink = document.querySelector(".user-menu a:nth-child(2)");

daftarLink.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "../halaman_login/daftar.html"; // arahkan ke halaman login/daftar
});

masukLink.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "../halaman_login/coba.html"; // arahkan ke halaman login/daftar
});

// --- Fungsi Pencarian ---
const searchInput = document.querySelector("header nav input");
const searchButton = document.querySelector("header nav button");
const products = document.querySelectorAll(".product-card");

searchButton.addEventListener("click", () => {
  const keyword = searchInput.value.toLowerCase();
  products.forEach(product => {
    const name = product.querySelector("h4").textContent.toLowerCase();
    if (name.includes(keyword)) {
      product.style.display = "block";
    } else {
      product.style.display = "none";
    }
  });
});
