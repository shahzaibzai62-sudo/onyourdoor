/* =========================================================
   ON YOUR DOOR — store logic
   Products are stored in localStorage under "oyd_products" so
   the admin page (admin.html) can add/edit/remove them and the
   storefront updates automatically on next load.
   ========================================================= */

const WHATSAPP_NUMBER = "923000000000"; // TODO: replace with the real WhatsApp number, digits only, country code first (no +)

/* ---------- Default catalog (seeded once, editable via admin.html) ---------- */
const DEFAULT_PRODUCTS = [
  {
    id: "p1",
    name: "Men's Premium Biker Leather Jacket",
    category: "Jackets",
    price: 4500,
    oldPrice: 5500,
    badge: "Best Seller",
    icon: "🧥",
    img: "",
    desc: "Genuine-look faux leather biker jacket with zip high collar, built for cool Pakistani winters. Available in M, L, XL."
  },
  {
    id: "p2",
    name: "Women's Fashion Leather Jacket",
    category: "Jackets",
    price: 4200,
    oldPrice: 5000,
    badge: "New",
    icon: "🧥",
    img: "",
    desc: "Soft-touch leather jacket for women, tailored fit with a modern silhouette. Perfect for the winter season."
  },
  {
    id: "p3",
    name: "Manfinity LEGND Zip High-Collar Biker Jacket",
    category: "Jackets",
    price: 3800,
    oldPrice: null,
    badge: "Trending",
    icon: "🧥",
    img: "",
    desc: "Fashionable zip high-collar biker jacket, suitable for spring and autumn. Trendy streetwear cut."
  },
  {
    id: "p4",
    name: "Premium Travel Luggage Bag (Large)",
    category: "Bags & Luggage",
    price: 5500,
    oldPrice: 6500,
    badge: "Best Seller",
    icon: "🧳",
    img: "",
    desc: "Durable hard-shell luggage with smooth spinner wheels, built for frequent travellers."
  },
  {
    id: "p5",
    name: "Women's Premium Handbag",
    category: "Bags & Luggage",
    price: 2800,
    oldPrice: 3400,
    badge: "New",
    icon: "👜",
    img: "",
    desc: "Elegant everyday handbag with a spacious compartment and premium stitching."
  },
  {
    id: "p6",
    name: "Men's Casual Backpack",
    category: "Bags & Luggage",
    price: 2000,
    oldPrice: null,
    badge: "",
    icon: "🎒",
    img: "",
    desc: "Water-resistant backpack with laptop sleeve, ideal for university, office or short trips."
  },
  {
    id: "p7",
    name: "Duffel Travel Bag",
    category: "Bags & Luggage",
    price: 2500,
    oldPrice: 3000,
    badge: "",
    icon: "🎒",
    img: "",
    desc: "Spacious duffel bag with reinforced handles — great for gym or weekend travel."
  },
  {
    id: "p8",
    name: "S9 Ultra 2 Smart Watch",
    category: "Watches",
    price: 2200,
    oldPrice: 2800,
    badge: "Hot",
    icon: "⌚",
    img: "",
    desc: "2.09\" infinity display, wireless charging, Bluetooth calling, comes with double strap set."
  },
  {
    id: "p9",
    name: "Fortune Times Ladies Quartz Wrist Watch",
    category: "Watches",
    price: 1500,
    oldPrice: 1900,
    badge: "",
    icon: "⌚",
    img: "",
    desc: "Elegant quartz analog wrist watch for girls & women, clean minimal dial design."
  },
  {
    id: "p10",
    name: "Unisex Crossbody Sling Bag",
    category: "Bags & Luggage",
    price: 1800,
    oldPrice: null,
    badge: "New",
    icon: "👝",
    img: "",
    desc: "Compact crossbody bag for daily essentials, adjustable strap, unisex design."
  }
];

/* ---------- Storage helpers ---------- */
function loadProducts(){
  const raw = localStorage.getItem("oyd_products");
  if(!raw){
    localStorage.setItem("oyd_products", JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS.slice();
  }
  try{
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_PRODUCTS.slice();
  }catch(e){
    return DEFAULT_PRODUCTS.slice();
  }
}
function loadCart(){
  try{ return JSON.parse(localStorage.getItem("oyd_cart")) || []; }catch(e){ return []; }
}
function saveCart(cart){ localStorage.setItem("oyd_cart", JSON.stringify(cart)); }

let PRODUCTS = loadProducts();
let CART = loadCart();
let activeFilter = "all";
let searchTerm = "";

/* ---------- Category setup ---------- */
function getCategories(){
  const cats = {};
  PRODUCTS.forEach(p => { cats[p.category] = (cats[p.category]||0) + 1; });
  return cats;
}
const CATEGORY_ICONS = {
  "Jackets":"🧥",
  "Bags & Luggage":"🧳",
  "Watches":"⌚",
  "Accessories":"👝"
};

function renderCategories(){
  const grid = document.getElementById("catGrid");
  const cats = getCategories();
  grid.innerHTML = Object.keys(cats).map(cat => `
    <button class="cat-card" data-cat="${cat}">
      <span class="cat-icon">${CATEGORY_ICONS[cat] || "🛍️"}</span>
      <span class="cat-name">${cat}</span>
      <span class="cat-count">${cats[cat]} items</span>
    </button>
  `).join("");

  grid.querySelectorAll(".cat-card").forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.cat;
      syncFilterChips();
      renderProducts();
      document.getElementById("shop").scrollIntoView({behavior:"smooth"});
    });
  });
}

function renderFilterChips(){
  const row = document.getElementById("filterRow");
  const cats = Object.keys(getCategories());
  row.innerHTML = `<button class="filter-chip active" data-filter="all">All</button>` +
    cats.map(c => `<button class="filter-chip" data-filter="${c}">${c}</button>`).join("");
  row.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter;
      syncFilterChips();
      renderProducts();
    });
  });
}
function syncFilterChips(){
  document.querySelectorAll(".filter-chip").forEach(c => {
    c.classList.toggle("active", c.dataset.filter === activeFilter);
  });
}

/* ---------- Product rendering ---------- */
function money(n){
  return "Rs " + Number(n).toLocaleString("en-PK");
}

function productThumb(p){
  if(p.img){
    return `<img src="${p.img}" alt="${p.name}" loading="lazy">`;
  }
  return p.icon || "🛍️";
}

function renderProducts(){
  const grid = document.getElementById("productGrid");
  let list = PRODUCTS.filter(p => activeFilter === "all" || p.category === activeFilter);
  if(searchTerm){
    const t = searchTerm.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(t) || p.category.toLowerCase().includes(t));
  }
  if(!list.length){
    grid.innerHTML = `<div class="empty-state">No products match — try a different search or category.</div>`;
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-thumb">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        ${productThumb(p)}
      </div>
      <div class="product-info">
        <span class="product-cat">${p.category}</span>
        <span class="product-name">${p.name}</span>
        <div class="product-price-row">
          <span class="price-now">${money(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${money(p.oldPrice)}</span>` : ""}
        </div>
      </div>
      <div class="product-actions">
        <button class="add-btn" data-add="${p.id}">Add to cart</button>
        <button class="view-btn" data-view="${p.id}">View</button>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });
  grid.querySelectorAll("[data-view]").forEach(btn=>{
    btn.addEventListener("click", () => openModal(btn.dataset.view));
  });
}

/* ---------- Cart logic ---------- */
function addToCart(id){
  const existing = CART.find(i => i.id === id);
  if(existing){ existing.qty += 1; }
  else{ CART.push({id, qty:1}); }
  saveCart(CART);
  updateCartUI();
  openCart();
}
function changeQty(id, delta){
  const item = CART.find(i => i.id === id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){ CART = CART.filter(i => i.id !== id); }
  saveCart(CART);
  updateCartUI();
}
function removeFromCart(id){
  CART = CART.filter(i => i.id !== id);
  saveCart(CART);
  updateCartUI();
}
function cartTotal(){
  return CART.reduce((sum, item) => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}
function cartCount(){
  return CART.reduce((sum, item) => sum + item.qty, 0);
}
function updateCartUI(){
  document.getElementById("cartCount").textContent = cartCount();
  document.getElementById("cartTotal").textContent = money(cartTotal());

  const wrap = document.getElementById("cartItems");
  if(!CART.length){
    wrap.innerHTML = `<div class="empty-cart">Your cart is empty. Add something you like!</div>`;
    return;
  }
  wrap.innerHTML = CART.map(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if(!p) return "";
    return `
      <div class="cart-item">
        <div class="product-thumb" style="border-radius:10px; font-size:1.4rem;">${productThumb(p)}</div>
        <div>
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${money(p.price)} × ${item.qty}</div>
          <div class="qty-row">
            <button class="qty-btn" data-minus="${p.id}">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-plus="${p.id}">+</button>
          </div>
        </div>
        <button class="remove-btn" data-remove="${p.id}">Remove</button>
      </div>
    `;
  }).join("");

  wrap.querySelectorAll("[data-plus]").forEach(b=>b.addEventListener("click",()=>changeQty(b.dataset.plus,1)));
  wrap.querySelectorAll("[data-minus]").forEach(b=>b.addEventListener("click",()=>changeQty(b.dataset.minus,-1)));
  wrap.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>removeFromCart(b.dataset.remove)));
}

/* ---------- WhatsApp checkout ---------- */
function buildOrderMessage(){
  if(!CART.length) return "";
  let lines = ["Assalam-o-Alaikum, mujhe ye order karna hai:", ""];
  CART.forEach(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if(p) lines.push(`• ${p.name} × ${item.qty} — ${money(p.price * item.qty)}`);
  });
  lines.push("", `Total: ${money(cartTotal())}`, "", "Naam: ", "Address: ", "Contact number: ");
  return lines.join("\n");
}
function checkoutViaWhatsApp(){
  if(!CART.length){
    alert("Cart khali hai — pehle koi product add karein.");
    return;
  }
  const msg = encodeURIComponent(buildOrderMessage());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}

/* ---------- Product modal ---------- */
function openModal(id){
  const p = PRODUCTS.find(pr => pr.id === id);
  if(!p) return;
  const modal = document.getElementById("productModal");
  modal.innerHTML = `
    <button class="modal-close" id="modalClose">✕</button>
    <div class="product-thumb modal-img" style="font-size:5rem;">${productThumb(p)}</div>
    <div class="modal-body">
      <span class="product-cat">${p.category}</span>
      <h3>${p.name}</h3>
      <p>${p.desc || ""}</p>
      <div class="modal-price">
        <span class="price-now">${money(p.price)}</span>
        ${p.oldPrice ? `<span class="price-old">${money(p.oldPrice)}</span>` : ""}
      </div>
      <div class="modal-actions">
        <button class="add-btn" id="modalAdd">Add to cart</button>
        <a class="btn btn-whatsapp" target="_blank" rel="noopener"
           href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Assalam-o-Alaikum, mujhe is product ke baare mein poochna hai: ' + p.name)}">
          Ask on WhatsApp
        </a>
      </div>
    </div>
  `;
  document.getElementById("modalAdd").addEventListener("click", () => { addToCart(p.id); closeModal(); });
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").classList.add("show");
  modal.classList.add("open");
}
function closeModal(){
  document.getElementById("modalOverlay").classList.remove("show");
  document.getElementById("productModal").classList.remove("open");
}

/* ---------- Cart drawer open/close ---------- */
function openCart(){
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}
function closeCart(){
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  renderCategories();
  renderFilterChips();
  renderProducts();
  updateCartUI();

  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);
  document.getElementById("overlay").addEventListener("click", () => { closeCart(); closeModal(); });
  document.getElementById("modalOverlay").addEventListener("click", closeModal);
  document.getElementById("checkoutBtn").addEventListener("click", checkoutViaWhatsApp);

  document.getElementById("searchToggle").addEventListener("click", () => {
    document.getElementById("searchBar").classList.toggle("open");
    document.getElementById("searchInput").focus();
  });
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderProducts();
  });

  document.getElementById("navBurger").addEventListener("click", () => {
    document.getElementById("mainNav").classList.toggle("open");
  });
  document.querySelectorAll(".main-nav a").forEach(a=>{
    a.addEventListener("click", () => document.getElementById("mainNav").classList.remove("open"));
  });
});
