/* =========================================================
   DRIFT — Shared App Logic
   Cart · cursor · magnetic buttons · parallax · marquee · reveals
   ========================================================= */

const PRODUCTS = {
  'dusk-sub': { id:'dusk-sub', name:'The Dusk',     sub:'Subscription · Monthly',           price:34, compareAt:42, image:'DRIFT' },
  'dusk-one': { id:'dusk-one', name:'The Dusk',     sub:'One-time · 30 sachets',            price:42, compareAt:null, image:'DRIFT' },
  'mix-sub':  { id:'mix-sub',  name:'The Mix Pack', sub:'Subscription · All 5 flavors',     price:36, compareAt:44, image:'MIX' },
  'mix-one':  { id:'mix-one',  name:'The Mix Pack', sub:'One-time · All 5 flavors',         price:44, compareAt:null, image:'MIX' },
  'sampler':  { id:'sampler',  name:'The Sampler',  sub:'7-night trial · 5 flavors',        price:14, compareAt:null, image:'DRIFT 7' },
  'kit':      { id:'kit',      name:'The Wind Down Kit', sub:'Sachets · ceramic mug · candle', price:78, compareAt:96, image:'KIT' }
};

const CART_KEY = 'drift_cart_v1';
const PROMO_CODE = 'DUSK10';
const FREE_SHIP_THRESHOLD = 40;

const Cart = {
  items: [], promo: null,

  load(){
    try{
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : { items:[], promo:null };
      this.items = parsed.items || []; this.promo = parsed.promo || null;
    } catch { this.items = []; this.promo = null; }
  },
  save(){
    localStorage.setItem(CART_KEY, JSON.stringify({ items:this.items, promo:this.promo }));
    this.broadcast();
  },
  broadcast(){ document.dispatchEvent(new CustomEvent('cart:change', { detail: this.summary() })); },

  add(productId, opts = {}){
    const flavor = opts.flavor || 'Honey Lavender';
    const key = `${productId}__${flavor}`;
    const existing = this.items.find(i => i.key === key);
    if(existing){ existing.qty += (opts.qty || 1); }
    else{
      const p = PRODUCTS[productId]; if(!p) return;
      this.items.push({ key, productId, flavor, qty: opts.qty || 1 });
    }
    this.save();
  },
  setQty(key, qty){
    const it = this.items.find(i => i.key === key); if(!it) return;
    if(qty <= 0) this.remove(key); else { it.qty = qty; this.save(); }
  },
  remove(key){ this.items = this.items.filter(i => i.key !== key); this.save(); },
  clear(){ this.items = []; this.promo = null; this.save(); },
  applyPromo(code){
    if((code||'').trim().toUpperCase() === PROMO_CODE){ this.promo = PROMO_CODE; this.save(); return true; }
    return false;
  },
  count(){ return this.items.reduce((s,i)=> s + i.qty, 0); },
  subtotal(){
    return this.items.reduce((s,i)=>{ const p = PRODUCTS[i.productId]; return p ? s + (p.price * i.qty) : s; }, 0);
  },
  discount(){ return this.promo === PROMO_CODE ? Math.round(this.subtotal() * 0.10 * 100)/100 : 0; },
  shipping(){ if(this.items.length === 0) return 0; return this.subtotal() - this.discount() >= FREE_SHIP_THRESHOLD ? 0 : 5; },
  tax(){ return Math.round((this.subtotal() - this.discount()) * 0.085 * 100) / 100; },
  total(){ return Math.max(0, this.subtotal() - this.discount() + this.shipping() + this.tax()); },
  summary(){
    return {
      items: this.items.slice(),
      count: this.count(),
      subtotal: this.subtotal(), discount: this.discount(),
      shipping: this.shipping(), tax: this.tax(), total: this.total(),
      promo: this.promo
    };
  }
};

const fmt = (n) => `$${Number(n).toFixed(2)}`;

/* ----------- Toast ----------- */
function toast(msg, icon = 'check'){
  let wrap = document.querySelector('.toast-wrap');
  if(!wrap){ wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = 'toast';
  const icons = {
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12l5 5L20 7"/></svg>',
    moon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16.5 14.2A7 7 0 0 1 9.8 7.5a7 7 0 1 0 6.7 6.7Z"/></svg>'
  };
  el.innerHTML = `${icons[icon] || icons.check}<span>${msg}</span>`;
  wrap.appendChild(el);
  requestAnimationFrame(()=> el.classList.add('show'));
  setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=> el.remove(), 400); }, 2400);
}

/* ----------- Cart Drawer ----------- */
function buildCartDrawer(){
  if(document.getElementById('cart-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay'; overlay.id = 'cart-overlay';
  overlay.addEventListener('click', closeCart);

  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer'; drawer.id = 'cart-drawer';
  drawer.setAttribute('aria-hidden','true');
  drawer.setAttribute('role','dialog');
  drawer.setAttribute('aria-label','Shopping cart');
  drawer.innerHTML = `
    <header class="cart-head">
      <div><span class="title">Your Ritual</span><span class="count" id="cart-count-text"></span></div>
      <button class="close-btn" id="cart-close" aria-label="Close cart">✕</button>
    </header>
    <div class="cart-body" id="cart-body"></div>
    <footer class="cart-foot" id="cart-foot"></footer>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeCart(); });
  renderCart();
}
function openCart(){
  buildCartDrawer();
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-drawer').setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  bindHoverables();
}
function closeCart(){
  const o = document.getElementById('cart-overlay');
  const d = document.getElementById('cart-drawer');
  if(o) o.classList.remove('open');
  if(d){ d.classList.remove('open'); d.setAttribute('aria-hidden','true'); }
  document.body.style.overflow = '';
}

function renderCart(){
  const body = document.getElementById('cart-body');
  const foot = document.getElementById('cart-foot');
  const countText = document.getElementById('cart-count-text');
  if(!body || !foot) return;

  const s = Cart.summary();
  countText.textContent = s.count ? `· ${s.count} ${s.count === 1 ? 'item' : 'items'}` : '';

  if(s.items.length === 0){
    body.innerHTML = `
      <div class="cart-empty">
        <svg class="moon-rule" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M16.5 14.2A7 7 0 0 1 9.8 7.5a7 7 0 1 0 6.7 6.7Z"/>
          <circle cx="18.5" cy="6.5" r="0.9" fill="currentColor"/>
        </svg>
        <h3 style="font-size:24px; margin:0; font-family:var(--serif)">Your nightstand is empty.</h3>
        <p>Add a box of The Dusk and we'll send your first ritual within 2 business days.</p>
        <a href="index.html#buy" class="btn btn-primary" onclick="closeCart()">Shop The Dusk →</a>
      </div>
    `;
    foot.innerHTML = '';
    return;
  }

  body.innerHTML = s.items.map(i => {
    const p = PRODUCTS[i.productId];
    return `
      <div class="cart-line" data-key="${i.key}">
        <div class="cart-thumb"><div class="cart-thumb-mark">${p.image}</div></div>
        <div class="cart-info">
          <div class="name">${p.name}</div>
          <span class="opt">${p.sub} · ${i.flavor}</span>
          <div class="qty-control" role="group" aria-label="Quantity">
            <button data-act="dec" aria-label="Decrease">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
            </button>
            <span class="q">${i.qty}</span>
            <button data-act="inc" aria-label="Increase">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>
        <div class="right">
          <div class="price">${fmt(p.price * i.qty)}</div>
          <button class="remove" data-act="remove">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  body.querySelectorAll('.cart-line').forEach(line => {
    const key = line.dataset.key;
    const item = s.items.find(i => i.key === key);
    line.querySelector('[data-act="inc"]').addEventListener('click', ()=> Cart.setQty(key, item.qty + 1));
    line.querySelector('[data-act="dec"]').addEventListener('click', ()=> Cart.setQty(key, item.qty - 1));
    line.querySelector('[data-act="remove"]').addEventListener('click', ()=> { Cart.remove(key); toast('Removed from cart'); });
  });

  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - (s.subtotal - s.discount));
  const shipNote = remaining > 0
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16.5 14.2A7 7 0 0 1 9.8 7.5a7 7 0 1 0 6.7 6.7Z"/></svg> Add ${fmt(remaining)} for free shipping`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg> Free shipping unlocked`;

  foot.innerHTML = `
    <div class="ship-note">${shipNote}</div>
    <div class="totals"><span>Subtotal</span><span>${fmt(s.subtotal)}</span></div>
    ${s.discount ? `<div class="totals"><span>Promo (${s.promo})</span><span style="color:var(--ok)">−${fmt(s.discount)}</span></div>` : ''}
    <div class="totals"><span>Shipping</span><span>${s.shipping ? fmt(s.shipping) : 'Free'}</span></div>
    <div class="totals grand"><span>Total</span><span>${fmt(s.total)}</span></div>
    <a href="checkout.html" class="btn btn-primary btn-block">Checkout — ${fmt(s.total)} <span class="arr">→</span></a>
    <p class="legal">Skip · pause · cancel anytime — 30-night guarantee</p>
  `;
}

/* ----------- Cart badge in nav ----------- */
function updateCartBadge(bump = false){
  const badge = document.getElementById('cart-badge');
  if(!badge) return;
  const c = Cart.count();
  badge.textContent = c;
  badge.classList.toggle('show', c > 0);
  if(bump && c > 0){
    badge.classList.remove('bump');
    void badge.offsetWidth;
    badge.classList.add('bump');
  }
}

/* ----------- Reveal on scroll ----------- */
function setupReveal(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));

  // Hero split-line words — reveal immediately on load
  setTimeout(() => {
    document.querySelectorAll('.hero .split-line .word').forEach(w => w.classList.add('in'));
  }, 200);
}

/* ----------- Scroll progress ----------- */
function setupScrollProgress(){
  const bar = document.querySelector('.scroll-progress');
  if(!bar) return;
  const onScroll = () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = pct + '%';
  };
  document.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
}

/* ----------- Sticky nav state ----------- */
function setupNavStuck(){
  const nav = document.getElementById('nav');
  if(!nav) return;
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 12);
  document.addEventListener('scroll', onScroll, { passive:true }); onScroll();
}

/* ----------- Custom cursor ----------- */
function setupCursor(){
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if(!dot || !ring) return;
  if(window.matchMedia('(hover: none)').matches) return;

  let mx = -100, my = -100, rx = -100, ry = -100;
  let ticking = false;

  const onMove = (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    if(!ticking){
      ticking = true;
      requestAnimationFrame(animate);
    }
  };
  function animate(){
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    if(Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1){
      requestAnimationFrame(animate);
    } else {
      ticking = false;
    }
  }

  document.addEventListener('mousemove', onMove, { passive:true });
  document.addEventListener('mouseleave', () => {
    dot.classList.add('is-hidden'); ring.classList.add('is-hidden');
  });
  document.addEventListener('mouseenter', () => {
    dot.classList.remove('is-hidden'); ring.classList.remove('is-hidden');
  });
}

function bindHoverables(){
  const ring = document.getElementById('cursor-ring');
  const dot = document.getElementById('cursor-dot');
  if(!ring || !dot) return;
  const items = document.querySelectorAll('a, button, [role="button"], .plan-opt, .flavor, .ing-item, summary, .cart-line, .pillar, .step, .review');
  items.forEach(el => {
    if(el._driftCursor) return;
    el._driftCursor = true;
    el.addEventListener('mouseenter', () => { ring.classList.add('is-over'); dot.classList.add('is-over'); });
    el.addEventListener('mouseleave', () => { ring.classList.remove('is-over'); dot.classList.remove('is-over'); });
  });
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="search"], textarea');
  inputs.forEach(el => {
    if(el._driftCursor2) return;
    el._driftCursor2 = true;
    el.addEventListener('mouseenter', () => ring.classList.add('is-text'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-text'));
  });
}

/* ----------- Magnetic buttons ----------- */
function setupMagnetic(){
  if(window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.magnetic').forEach(btn => {
    let raf = null;
    const tx = { x:0, y:0 };
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      tx.x = x * 0.25; tx.y = y * 0.4;
      if(!raf) raf = requestAnimationFrame(apply);
    });
    btn.addEventListener('mouseleave', () => {
      tx.x = 0; tx.y = 0;
      if(!raf) raf = requestAnimationFrame(apply);
    });
    function apply(){
      btn.style.transform = `translate(${tx.x}px, ${tx.y}px)`;
      raf = null;
    }
  });
}

/* ----------- Hero parallax ----------- */
function setupParallax(){
  const els = document.querySelectorAll('[data-parallax]');
  if(!els.length) return;
  const onScroll = () => {
    const y = window.scrollY;
    els.forEach(el => {
      const f = parseFloat(el.dataset.parallax) || 0.2;
      el.style.transform = `translate3d(0, ${-(y * f)}px, 0)`;
    });
  };
  document.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
}

/* ----------- Marquee infinite loop ----------- */
function setupMarquee(){
  const m = document.getElementById('marquee');
  if(!m) return;
  // Duplicate the content once for seamless loop
  m.innerHTML = m.innerHTML + m.innerHTML;
}

/* ----------- Init on every page ----------- */
function init(){
  Cart.load();
  setupNavStuck();
  setupScrollProgress();
  setupReveal();
  setupCursor();
  setupMagnetic();
  setupParallax();
  setupMarquee();
  bindHoverables();

  // Cart icon
  const cartBtn = document.getElementById('cart-btn');
  if(cartBtn){
    cartBtn.addEventListener('click', openCart);
    updateCartBadge();
  }
  document.addEventListener('cart:change', () => { updateCartBadge(true); renderCart(); });

  // Mobile menu drawer
  const openMenu = document.getElementById('openMenu');
  const closeMenu = document.getElementById('closeMenu');
  const drawer = document.getElementById('drawer');
  if(openMenu && drawer){
    openMenu.addEventListener('click', () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); });
    closeMenu && closeMenu.addEventListener('click', () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); });
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));
  }
}

document.addEventListener('DOMContentLoaded', init);
