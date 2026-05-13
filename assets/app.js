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
  shipping(){
    if(this.items.length === 0) return 0;
    // First-night bonus: DUSK10 also waives shipping on the first box
    if(this.promo === PROMO_CODE) return 0;
    return this.subtotal() - this.discount() >= FREE_SHIP_THRESHOLD ? 0 : 5;
  },
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
        <button class="cart-empty-link" data-dx-open onclick="closeCart()">Not sure which to pick? Take the diagnostic →</button>
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

  const earned = Math.max(0, s.subtotal - s.discount);
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - earned);
  const pct = Math.min(100, Math.round((earned / FREE_SHIP_THRESHOLD) * 100));
  const shipNote = remaining > 0
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16.5 14.2A7 7 0 0 1 9.8 7.5a7 7 0 1 0 6.7 6.7Z"/></svg> Add <strong>${fmt(remaining)}</strong> for free shipping`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg> Free shipping unlocked`;
  const shipBar = `
    <div class="ship-progress">
      <div class="ship-progress-text">${shipNote}</div>
      <div class="ship-progress-bar"><div class="fill" style="width:${pct}%"></div></div>
    </div>`;

  // Smart upsell: if there's a subscription/box but no sampler, offer one.
  const hasSampler = s.items.some(i => i.productId === 'sampler');
  const hasBox = s.items.some(i => i.productId !== 'sampler');
  const upsell = (!hasSampler && hasBox) ? `
    <div class="cart-upsell">
      <div class="cart-upsell-thumb"><span>7</span></div>
      <div class="cart-upsell-info">
        <div class="cart-upsell-name">Add the 7-night sampler</div>
        <div class="cart-upsell-meta">Try all 5 flavors · $14</div>
      </div>
      <button class="cart-upsell-add" data-add-product="sampler">Add</button>
    </div>` : '';

  foot.innerHTML = `
    ${shipBar}
    ${upsell}
    <div class="totals"><span>Subtotal</span><span>${fmt(s.subtotal)}</span></div>
    ${s.discount ? `<div class="totals"><span>Promo (${s.promo})</span><span style="color:var(--ok)">−${fmt(s.discount)}</span></div>` : ''}
    <div class="totals"><span>Shipping</span><span>${s.shipping ? fmt(s.shipping) : 'Free'}</span></div>
    <div class="totals grand"><span>Total</span><span>${fmt(s.total)}</span></div>
    <a href="checkout.html" class="btn btn-primary btn-block">Checkout — ${fmt(s.total)} <span class="arr">→</span></a>
    <p class="legal">Skip · pause · cancel anytime — 30-night guarantee</p>
  `;

  const upsellBtn = foot.querySelector('[data-add-product]');
  if(upsellBtn){
    upsellBtn.addEventListener('click', () => {
      Cart.add(upsellBtn.dataset.addProduct);
      toast('Sampler added · 5 flavors to try', 'moon');
    });
  }
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

/* ----------- Custom cursor — bulletproof ----------- */
function setupCursor(){
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const glow = document.getElementById('candleglow');
  if(!dot || !ring) return;
  if(window.matchMedia('(hover: none)').matches){
    dot.style.display = 'none'; ring.style.display = 'none';
    if(glow) glow.style.display = 'none';
    return;
  }

  // Target (mouse) and follower positions
  let tx = -100, ty = -100;
  let dx = -100, dy = -100;  // dot — tight follow
  let rx = -100, ry = -100;  // ring — lazy follow
  let gx = -100, gy = -100;  // glow — very lazy, atmospheric
  let synced = false;

  // Continuous RAF loop — smoother than starting/stopping
  function loop(){
    dx += (tx - dx) * 0.55;
    dy += (ty - dy) * 0.55;
    rx += (tx - rx) * 0.18;
    ry += (ty - ry) * 0.18;
    gx += (tx - gx) * 0.06;
    gy += (ty - gy) * 0.06;
    dot.style.transform  = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    if(glow) glow.style.transform = `translate3d(${gx}px, ${gy}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  // First touch ever → permanently disable (handles hybrid devices)
  document.addEventListener('touchstart', () => {
    dot.style.display = 'none'; ring.style.display = 'none';
    if(glow) glow.style.display = 'none';
    document.body.style.cursor = 'auto';
  }, { once: true, passive: true });

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if(!synced){
      // Sync immediately on first move so there's no flying-from-corner
      dx = rx = gx = tx; dy = ry = gy = ty;
      synced = true;
      dot.classList.remove('is-hidden');
      ring.classList.remove('is-hidden');
      if(glow) glow.classList.add('is-on');
    }
  }, { passive: true });

  // Hide when cursor leaves window, restore on entry
  document.addEventListener('mouseleave', () => {
    dot.classList.add('is-hidden');
    ring.classList.add('is-hidden');
    if(glow) glow.classList.remove('is-on');
  });
  document.addEventListener('mouseenter', () => {
    dot.classList.remove('is-hidden');
    ring.classList.remove('is-hidden');
    if(glow && synced) glow.classList.add('is-on');
  });

  // Active state on click
  document.addEventListener('mousedown', () => ring.classList.add('is-active'), { passive: true });
  document.addEventListener('mouseup',   () => ring.classList.remove('is-active'), { passive: true });

  // Hover/text states via event delegation — survives DOM changes
  const HOVER_SEL = 'a, button, [role="button"], .plan-opt, .flavor-card, .ing-item, summary, .cart-line, .pillar, .step, .review, .archetype-tags span, .pcard-dots .d, .compare-row.head .compare-cell.is-drift, .pay-btn';
  const TEXT_SEL = 'input[type="text"], input[type="email"], input[type="tel"], input[type="search"], input[type="number"], textarea';

  document.addEventListener('mouseover', (e) => {
    const text = e.target.closest(TEXT_SEL);
    const hover = e.target.closest(HOVER_SEL);
    ring.classList.toggle('is-text', !!text);
    dot.classList.toggle('is-text', !!text);
    ring.classList.toggle('is-hover', !!hover && !text);
    dot.classList.toggle('is-hover', !!hover && !text);
  });
  document.addEventListener('mouseout', (e) => {
    // Only clear when actually leaving an interactive area
    if(!e.relatedTarget || !e.relatedTarget.closest || (!e.relatedTarget.closest(HOVER_SEL) && !e.relatedTarget.closest(TEXT_SEL))){
      ring.classList.remove('is-hover','is-text');
      dot.classList.remove('is-hover','is-text');
    }
  });
}

// No-op kept for backward compat with prior calls
function bindHoverables(){}

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

/* ----------- Tonight's Window — time / moon / drifters ----------- */
function setupTonightRibbon(){
  const root = document.getElementById('tonight-ribbon');
  if(!root) return;

  const $time   = document.getElementById('tr-time');
  const $loc    = document.getElementById('tr-loc');
  const $phase  = document.getElementById('tr-phase');
  const $moon   = document.getElementById('tr-moon-path');
  const $count  = document.getElementById('tr-count');
  const $msg    = document.getElementById('tr-msg');

  // ---- Local city from IANA tz ----
  function getCity(){
    try{
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const last = tz.split('/').pop() || '';
      return last.replace(/_/g, ' ');
    } catch { return ''; }
  }

  // ---- 12-hour local time ----
  function fmtTime(d){
    const h = d.getHours(), m = String(d.getMinutes()).padStart(2,'0');
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
  }

  // ---- Moon phase from synodic month ----
  // Reference new moon: 2000-01-06 18:14 UTC. Period: 29.530588853 days.
  const SYNODIC = 29.530588853 * 86400e3;
  const REF_NEW = Date.UTC(2000, 0, 6, 18, 14, 0);
  function moonPhase(d){
    const age = ((d.getTime() - REF_NEW) % SYNODIC + SYNODIC) % SYNODIC;
    return age / SYNODIC; // 0..1
  }
  function phaseName(p){
    if(p < 0.03 || p > 0.97) return 'New Moon';
    if(p < 0.22) return 'Waxing Crescent';
    if(p < 0.28) return 'First Quarter';
    if(p < 0.47) return 'Waxing Gibbous';
    if(p < 0.53) return 'Full Moon';
    if(p < 0.72) return 'Waning Gibbous';
    if(p < 0.78) return 'Last Quarter';
    return 'Waning Crescent';
  }
  // SVG path for the lit portion at radius r centered at (cx,cy)
  function moonPath(p, cx, cy, r){
    if(p < 0.02 || p > 0.98) return '';                   // new
    if(Math.abs(p - 0.5) < 0.02){                          // full
      return `M ${cx-r},${cy} a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 ${-r*2},0`;
    }
    const waxing = p < 0.5;
    const k = (1 - Math.cos(p * 2 * Math.PI)) / 2;        // illumination 0..1
    const rx = Math.max(0.001, Math.abs(r * (1 - 2*k)));
    const outerSweep = waxing ? 1 : 0;
    const innerSweep = (k > 0.5) ? outerSweep : (1 - outerSweep);
    return `M ${cx},${cy-r} A ${r},${r} 0 1,${outerSweep} ${cx},${cy+r} A ${rx},${r} 0 1,${innerSweep} ${cx},${cy-r} Z`;
  }

  // ---- Drifters count: seed by hour-of-day, drift upward slowly ----
  function baselineCount(d){
    const h = d.getHours() + d.getMinutes()/60;
    // Cosine curve: peaks at 23:00, troughs at 11:00
    const t = Math.cos((h - 23) / 24 * Math.PI * 2);
    return Math.max(180, Math.round(820 + t * 480));
  }

  let currentCount = baselineCount(new Date());

  // ---- Window mode (amber glow between 21:00 → 02:00) ----
  function windowState(d){
    const h = d.getHours();
    if(h >= 21 || h < 2)  return { on:true,  msg:'Perfect time to begin.' };
    if(h < 8)              return { on:false, msg:'Catch dawn instead.' };
    if(h < 18)             return { on:false, msg:'Begin again at dusk.' };
    return { on:false, msg:'Soon. The window opens at nine.' };
  }

  // ---- Render ----
  function render(){
    const now = new Date();
    if($time)  $time.textContent  = fmtTime(now);
    if($loc){
      const c = getCity();
      $loc.textContent = c ? `in ${c}` : 'where you are';
    }
    const phase = moonPhase(now);
    if($phase) $phase.textContent = phaseName(phase);
    if($moon)  $moon.setAttribute('d', moonPath(phase, 6, 6, 5));
    if($count) $count.textContent = currentCount.toLocaleString();
    const ws = windowState(now);
    root.dataset.window = ws.on ? 'on' : 'off';
    if($msg){
      const span = $msg.querySelector('span');
      if(span) span.textContent = ws.msg;
    }
  }

  render();

  // Clock tick — every 20s is enough for minute changes
  setInterval(render, 20000);

  // Drifters ticker — increment 1–3 every 4.5–7.5s
  function tick(){
    currentCount += 1 + Math.floor(Math.random() * 3);
    if($count){
      $count.textContent = currentCount.toLocaleString();
      $count.classList.remove('tick'); void $count.offsetWidth;
      $count.classList.add('tick');
    }
    setTimeout(tick, 4500 + Math.random() * 3000);
  }
  setTimeout(tick, 3500 + Math.random() * 2000);
}

/* ----------- The Ritual — scroll-driven cinema ----------- */
function setupRitualCinema(){
  const stage = document.getElementById('ritual-stage');
  if(!stage) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = window.matchMedia('(max-width: 879px)').matches;
  if(reduce || narrow) return;

  document.body.classList.add('cinema-on');

  let raf = null;
  let inView = false;
  let pSmooth = 0;
  let pTarget = 0;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smoothstep = (t) => t * t * (3 - 2 * t);

  function readTarget(){
    const r = stage.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = Math.max(1, r.height - vh);
    return clamp01(-r.top / total);
  }

  function tick(){
    pTarget = readTarget();
    // Smooth p toward target — gives buttery feel independent of scroll velocity
    pSmooth += (pTarget - pSmooth) * 0.22;
    if(Math.abs(pTarget - pSmooth) < 0.0006) pSmooth = pTarget;
    const p = pSmooth;

    // Tighter phase windows, smoothstep within each → cinematic, not linear
    const p1 = smoothstep(clamp01( p          / 0.34));
    const p2 = smoothstep(clamp01((p - 0.26)  / 0.38));
    const p3 = smoothstep(clamp01((p - 0.60)  / 0.36));

    stage.style.setProperty('--p',  p.toFixed(4));
    stage.style.setProperty('--p1', p1.toFixed(4));
    stage.style.setProperty('--p2', p2.toFixed(4));
    stage.style.setProperty('--p3', p3.toFixed(4));

    // Caption cross-fades: 0.24→0.34 (1→2) and 0.58→0.68 (2→3)
    let c1, c2, c3;
    if(p < 0.24){       c1 = 1; c2 = 0; c3 = 0; }
    else if(p < 0.34){  const t = smoothstep((p - 0.24) / 0.10); c1 = 1 - t; c2 = t;     c3 = 0; }
    else if(p < 0.58){  c1 = 0; c2 = 1; c3 = 0; }
    else if(p < 0.68){  const t = smoothstep((p - 0.58) / 0.10); c1 = 0;     c2 = 1 - t; c3 = t; }
    else {              c1 = 0; c2 = 0; c3 = 1; }
    stage.style.setProperty('--c1', c1.toFixed(3));
    stage.style.setProperty('--c2', c2.toFixed(3));
    stage.style.setProperty('--c3', c3.toFixed(3));

    const phase = (p < 0.30) ? '1' : (p < 0.63 ? '2' : '3');
    if(stage.dataset.phase !== phase) stage.dataset.phase = phase;

    // Continuous rAF while in view → independent of scroll-event throttling
    if(inView){
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
    }
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const wasInView = inView;
      inView = e.isIntersecting;
      if(inView && !wasInView && raf === null){
        // Resync immediately so we don't lerp from stale state
        pSmooth = readTarget();
        raf = requestAnimationFrame(tick);
      }
    });
  }, { rootMargin: '40% 0px 40% 0px' });
  io.observe(stage);

  window.addEventListener('resize', () => {
    const r2 = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const n2 = window.matchMedia('(max-width: 879px)').matches;
    if(r2 || n2){
      document.body.classList.remove('cinema-on');
      if(raf){ cancelAnimationFrame(raf); raf = null; }
    }
  }, { passive: true });

  // Prime initial state so the very first frame is correct, not 0
  pSmooth = readTarget();
  tick();
}

/* ----------- Held for you — slim reservation ribbon + 1-click CTA ----------- */
function setupDuskHour(){
  const root = document.getElementById('dusk-hour');
  if(!root) return;

  const $m    = document.getElementById('dh-m');
  const $s    = document.getElementById('dh-s');
  const $fill = document.getElementById('dh-fill');
  const $mark = document.getElementById('dh-mark-text');
  const $cta  = document.getElementById('dh-cta');

  const HOLD_MIN = 15;
  const HOLD_MS  = HOLD_MIN * 60 * 1000;
  const SS_KEY   = 'drift_first_night_start';
  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

  // Reservation start lives in sessionStorage → fresh per tab, survives refresh.
  function getStart(){
    let start = 0;
    try { start = parseInt(sessionStorage.getItem(SS_KEY) || '0', 10); } catch(e){}
    if(!start || (Date.now() - start) >= HOLD_MS){
      start = Date.now();
      try { sessionStorage.setItem(SS_KEY, String(start)); } catch(e){}
    }
    return start;
  }

  // Mark text escalates subtly as the hold drains.
  function markCopy(remainingMs, state){
    if(state === 'extended') return 'Hold extended';
    const sec = remainingMs / 1000;
    if(sec <= 5 * 60) return 'Final minutes';
    return 'Held for you';
  }

  function tick(){
    const start     = getStart();
    const elapsed   = Date.now() - start;
    const remaining = Math.max(0, HOLD_MS - elapsed);
    const state     = remaining > 0 ? 'active' : 'extended';
    root.dataset.state = state;

    const totalSec = Math.floor(remaining / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    if($m) $m.textContent = pad(mm);
    if($s) $s.textContent = pad(ss);

    if($mark) $mark.textContent = markCopy(remaining, state);
    if($fill) $fill.style.transform = `scaleX(${(remaining / HOLD_MS).toFixed(4)})`;

    // Promo stays applied for the whole session, even after "extended."
    if(typeof Cart !== 'undefined' && Cart.promo !== 'DUSK10'){
      Cart.applyPromo('DUSK10');
    }
  }

  // One-click conversion: apply promo + add subscription + open cart
  if($cta){
    $cta.addEventListener('click', () => {
      if(typeof Cart === 'undefined' || typeof PRODUCTS === 'undefined') return;
      Cart.applyPromo('DUSK10');
      Cart.add('dusk-sub', { flavor: 'Honey Lavender' });
      if(typeof toast === 'function') toast('Reserved · 10% off + free shipping applied', 'moon');
      if(typeof openCart === 'function') openCart();
    });
  }

  tick();
  setInterval(tick, 1000);
}

/* ----------- Sticky mobile add-to-cart ----------- */
function setupStickyCart(){
  const bar = document.getElementById('sticky-cart');
  if(!bar) return;
  const hero = document.getElementById('hero');
  const buy = document.getElementById('buy');
  if(!hero) return;

  // Show after hero scrolls out, hide once user is in/past the buy section
  const heroIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(!e.isIntersecting && window.scrollY > 200){
        bar.classList.add('show');
        bar.setAttribute('aria-hidden','false');
      } else {
        bar.classList.remove('show');
        bar.setAttribute('aria-hidden','true');
      }
    });
  }, { threshold: 0 });
  heroIO.observe(hero);

  if(buy){
    const buyIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          bar.classList.remove('show');
          bar.setAttribute('aria-hidden','true');
        }
      });
    }, { threshold: 0.2 });
    buyIO.observe(buy);
  }

  // Sticky-add click is bound in the buy section script (uses live selection)
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
  setupStickyCart();
  setupRitualCinema();
  setupDuskHour();

  // Cart icon
  const cartBtn = document.getElementById('cart-btn');
  if(cartBtn){
    cartBtn.addEventListener('click', openCart);
    updateCartBadge();
  }
  document.addEventListener('cart:change', () => { updateCartBadge(true); renderCart(); });

  // Smooth-scroll anchor offset to account for sticky nav
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if(!id) return;
      const target = document.getElementById(id);
      if(!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: 'smooth' });
      // Close mobile drawer if open
      const drawer = document.getElementById('drawer');
      if(drawer) drawer.classList.remove('open');
    });
  });

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
