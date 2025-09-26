// In-memory state (mulai kosong) + optional persist via localStorage
const STORAGE_KEY = 'umkm_admin_state_v1';
let state = { categories: [], products: [], orders: [] };

const $ = (q, s=document)=>s.querySelector(q);
const $$ = (q, s=document)=>Array.from(s.querySelectorAll(q));
const money = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'}).format(n||0);
const today = ()=> new Date().toISOString().slice(0,10);

// ---------- Persistence ----------
const persistToggle = $('#persistToggle');
function load(){
  if(!localStorage.getItem(STORAGE_KEY)) return;
  try{ state = JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch{ state = {categories:[],products:[],orders:[]} }
}
function save(){
  if(!persistToggle.checked) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function resetAll(){
  if(!confirm('Kosongkan semua data?')) return;
  state = {categories:[],products:[],orders:[]};
  localStorage.removeItem(STORAGE_KEY);
  renderAll(); toast('Data dikosongkan');
}
$('#resetBtn').addEventListener('click', resetAll);

// ---------- Toast ----------
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1500); }

// ---------- Nav ----------
$$('.nav-btn').forEach(btn=> btn.addEventListener('click',()=> show(btn.dataset.view)));
function show(name){ $$('.view').forEach(v=>v.classList.add('hidden')); $('#view-'+name).classList.remove('hidden'); }

// ---------- Dashboard ----------
function renderDashboard(){
  $('#kpiProducts').textContent = state.products.filter(p=>p.is_active==1).length;
  $('#kpiLowStock').textContent = state.products.filter(p=> Number(p.stock)<=5).length;
  $('#kpiNewOrders').textContent = state.orders.filter(o=>o.status==='baru').length;
  const revenue = state.orders.reduce((a,b)=>a+(Number(b.total)||0),0);
  $('#kpiRevenue').textContent = money(revenue);
}

// ---------- Categories ----------
function renderCategories(){
  const tbody = $('#categoryTable'); tbody.innerHTML='';
  if(state.categories.length===0){ tbody.innerHTML = `<tr class="empty"><td class="empty" colspan="3">Belum ada kategori.</td></tr>`; return; }
  state.categories.forEach(c=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.name}</td><td>${c.created_at||'-'}</td>
      <td class="table-actions">
        <button class="btn ghost" data-act="edit" data-id="${c.id}">Edit</button>
        <button class="btn ghost" data-act="delete" data-id="${c.id}">Hapus</button>
      </td>`;
    tbody.appendChild(tr);
  });
  fillCategorySelects();
}

function fillCategorySelects(){
  const sel = $('#filterCategory');
  sel.innerHTML = '<option value="all">Semua Kategori</option>' + state.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  const selForm = $('#productForm select[name="category_id"]');
  selForm.innerHTML = state.categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
}

$('#addCategoryBtn').addEventListener('click', ()=>{
  const name = $('#categoryName').value.trim();
  if(!name) return alert('Nama kategori wajib');
  state.categories.unshift({id:Date.now(), name, created_at:today()});
  $('#categoryName').value=''; save(); renderCategories(); toast('Kategori ditambahkan');
});

$('#categoryTable').addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const id = Number(btn.dataset.id); const act = btn.dataset.act;
  if(act==='delete'){
    if(state.products.some(p=>p.category_id===id)) return alert('Kategori dipakai produk. Ganti kategori produk dulu.');
    state.categories = state.categories.filter(c=>c.id!==id); save(); renderCategories(); toast('Kategori dihapus');
  }
  if(act==='edit'){
    const curr = state.categories.find(c=>c.id===id); const val = prompt('Nama kategori baru:', curr.name);
    if(val){ curr.name=val; save(); renderCategories(); toast('Kategori diperbarui'); }
  }
});

// ---------- Products ----------
function renderProducts(){
  const q = $('#searchProduct').value.trim().toLowerCase();
  const cat = $('#filterCategory').value;
  let items = [...state.products];
  if(q) items = items.filter(p=> p.name.toLowerCase().includes(q));
  if(cat!=='all') items = items.filter(p=> String(p.category_id)===cat);

  const tbody = $('#productTable'); tbody.innerHTML='';
  if(items.length===0){ tbody.innerHTML = `<tr class="empty"><td class="empty" colspan="6">Belum ada produk.</td></tr>`; return; }
  items.forEach(p=>{
    const catName = state.categories.find(c=>c.id===p.category_id)?.name || '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>${catName}</td><td>${money(p.price)}</td><td>${p.stock}</td>
      <td>${p.is_active?'<span class="pill ok">Aktif</span>':'<span class="pill bad">Nonaktif</span>'}</td>
      <td class="table-actions">
        <button class="btn ghost" data-act="edit" data-id="${p.id}">Edit</button>
        <button class="btn ghost" data-act="toggle" data-id="${p.id}">${p.is_active?'Nonaktifkan':'Aktifkan'}</button>
        <button class="btn ghost" data-act="delete" data-id="${p.id}">Hapus</button>
      </td>`;
    tbody.appendChild(tr);
  })
}

$('#addProductBtn').addEventListener('click', ()=>{
  if(state.categories.length===0) return alert('Buat kategori dulu.');
  const f = $('#productForm'); f.reset(); f.classList.remove('hidden'); fillCategorySelects();
});
$('#cancelProduct').addEventListener('click', ()=> $('#productForm').classList.add('hidden'));

$('#productForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const model = {
    id: data.id? Number(data.id) : Date.now(),
    name: data.name.trim(),
    category_id: Number(data.category_id),
    price: Number(data.price),
    stock: Number(data.stock),
    is_active: Number(data.is_active),
    image_url: data.image_url?.trim()||''
  };
  if(!model.name) return alert('Nama wajib');
  const idx = state.products.findIndex(p=>p.id===model.id);
  if(idx>=0){ state.products[idx]=model; toast('Produk diperbarui'); }
  else { state.products.unshift(model); toast('Produk ditambahkan'); }
  save(); e.target.classList.add('hidden'); renderProducts(); renderDashboard();
});

$('#productTable').addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const id = Number(btn.dataset.id); const act = btn.dataset.act;
  if(act==='edit'){
    const p = state.products.find(x=>x.id===id); const f=$('#productForm');
    f.classList.remove('hidden'); fillCategorySelects();
    f.name.value=p.name; f.category_id.value=String(p.category_id); f.price.value=p.price; f.stock.value=p.stock; f.is_active.value=String(p.is_active); f.image_url.value=p.image_url||''; f.id.value=p.id;
  }
  if(act==='toggle'){ const p = state.products.find(x=>x.id===id); p.is_active = p.is_active?0:1; save(); renderProducts(); renderDashboard(); toast('Status diperbarui'); }
  if(act==='delete'){
    if(!confirm('Hapus produk ini?')) return;
    state.products = state.products.filter(x=>x.id!==id); save(); renderProducts(); renderDashboard(); toast('Produk dihapus');
  }
});

$('#searchProduct').addEventListener('input', renderProducts);
$('#filterCategory').addEventListener('change', renderProducts);

// ---------- Orders ----------
function renderOrders(){
  const st = $('#filterStatus').value;
  const tbody = $('#orderTable'); tbody.innerHTML='';
  let items = [...state.orders];
  if(st!=='all') items = items.filter(o=>o.status===st);
  if(items.length===0){ tbody.innerHTML = `<tr class="empty"><td class="empty" colspan="7">Belum ada pesanan.</td></tr>`; return; }
  items.forEach(o=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>#${o.id}</td><td>${o.user}</td><td>${money(o.total)}</td><td>${o.address_text}</td>
      <td><span class="pill ${pillClass(o.status)}">${uc(o.status)}</span></td>
      <td>
        <select data-id="${o.id}" class="input orderStatus">
          ${['baru','diproses','dikirim','selesai','batal'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td class="table-actions">
        <button class="btn ghost" data-act="delete" data-id="${o.id}">Hapus</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

$('#addOrderBtn').addEventListener('click', ()=>{ const f=$('#orderForm'); f.reset(); f.classList.remove('hidden'); });
$('#cancelOrder').addEventListener('click', ()=> $('#orderForm').classList.add('hidden'));

$('#orderForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const model = {
    id: Date.now(),
    user: data.user.trim(),
    total: Number(data.total),
    address_text: data.address_text.trim(),
    status: data.status
  };
  if(!model.user || !model.address_text) return alert('Nama pembeli & alamat wajib');
  state.orders.unshift(model); save(); e.target.classList.add('hidden'); renderOrders(); renderDashboard(); toast('Pesanan ditambahkan');
});

$('#orderTable').addEventListener('change', (e)=>{
  const sel = e.target.closest('select.orderStatus'); if(!sel) return;
  const id = Number(sel.dataset.id); const val = sel.value;
  const o = state.orders.find(x=>x.id===id); if(!o) return; o.status = val; save(); renderOrders(); renderDashboard(); toast('Status diupdate');
});

$('#orderTable').addEventListener('click', (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  if(btn.dataset.act==='delete'){
    const id = Number(btn.dataset.id);
    if(!confirm('Hapus pesanan ini?')) return;
    state.orders = state.orders.filter(o=>o.id!==id); save(); renderOrders(); renderDashboard(); toast('Pesanan dihapus');
  }
});

function pillClass(status){
  const s = String(status).toLowerCase();
  if(['baru'].includes(s)) return 'info';
  if(['diproses','dikirim'].includes(s)) return 'warn';
  if(['selesai'].includes(s)) return 'ok';
  if(['batal'].includes(s)) return 'bad';
  return 'info';
}
const uc = s=> s.charAt(0).toUpperCase()+s.slice(1);

// ---------- Init ----------
function renderAll(){
  renderDashboard();
  renderCategories();
  renderProducts();
  renderOrders();
}

(function init(){
  load();
  renderAll();
  // default view
  show('dashboard');
  // logout (simulasi)
  $('#logoutBtn').addEventListener('click',()=> alert('Anda berhasil Logout'));
})();

