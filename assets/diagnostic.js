/* =========================================================
   THE DRIFT DIAGNOSTIC — Sleep profile quiz
   Simple, robust, no decorative animation theatre
   ========================================================= */

const DX = (() => {
  const QUESTIONS = [
    {
      id: 'lastSleep',
      text: 'When did you last sleep through the night uninterrupted?',
      hint: 'Be honest — there are no wrong answers.',
      type: 'options',
      options: [
        { v:'rare',   text:"I genuinely can't remember",        tags:{ light:2, fatigue:2 } },
        { v:'weekly', text:'Maybe once or twice a week',         tags:{ light:1, fatigue:1 } },
        { v:'often',  text:'Most nights, with some bad ones',    tags:{ light:1 } },
        { v:'last',   text:'Last night, actually',               tags:{} },
      ]
    },
    {
      id: 'whatKeeps',
      text: "What's keeping you up at midnight?",
      hint: 'Pick the one that hits closest.',
      type: 'options',
      options: [
        { v:'mind',    text:'My mind keeps re-running the day', tags:{ wired:3 } },
        { v:'body',    text:'My body feels tense and wired',    tags:{ restless:3 } },
        { v:'anxious', text:'Anxious or racing thoughts',       tags:{ wired:3 } },
        { v:'phone',   text:'Honestly? My phone',                tags:{ wired:1, light:1 } },
        { v:'mix',     text:'A bit of all of the above',         tags:{ wired:1, restless:1, light:1, fatigue:1 } },
      ]
    },
    {
      id: 'wake',
      text: 'How do you usually wake up?',
      hint: 'Before coffee, before email.',
      type: 'options',
      options: [
        { v:'foggy',   text:'Foggy. It takes hours to feel human.', tags:{ fatigue:2, light:1 } },
        { v:'tired',   text:'Tired but functional',                  tags:{ fatigue:1 } },
        { v:'depends', text:'Depends entirely on the night',         tags:{ light:2 } },
        { v:'sharp',   text:'Pretty sharp, actually',                 tags:{} },
      ]
    },
    {
      id: 'tried',
      text: "What have you tried before that didn't quite stick?",
      hint: 'Pick the one you used most.',
      type: 'options',
      options: [
        { v:'melatonin', text:"Melatonin gummies — the grogginess wasn't worth it", tags:{ fatigue:2 } },
        { v:'tea',       text:'Chamomile or sleepy tea — too weak',                  tags:{ light:1 } },
        { v:'cbd',       text:'CBD or magnesium pills',                              tags:{ restless:1 } },
        { v:'apps',      text:'Meditation apps — I fell asleep mid-narration',      tags:{ wired:1 } },
        { v:'nothing',   text:'Nothing serious yet',                                  tags:{} },
      ]
    },
    {
      id: 'wired',
      text: 'On a scale of 1 to 10, how wired do you feel right now?',
      hint: 'Trust your gut.',
      type: 'slider',
    },
    {
      id: 'goal',
      text: 'And the one thing you most want from a ritual?',
      hint: 'The headline outcome.',
      type: 'options',
      options: [
        { v:'fall', text:'Fall asleep faster',             tags:{ wired:2 } },
        { v:'stay', text:'Stay asleep through the night',  tags:{ light:2 } },
        { v:'wake', text:'Wake up actually rested',        tags:{ fatigue:2 } },
        { v:'all',  text:'Honestly — all of it',           tags:{ wired:1, light:1, fatigue:1, restless:1 } },
      ]
    },
  ];

  const ARCHETYPES = {
    wired: {
      title: 'The Wired Mind',
      flavor: 'Honey Lavender',
      sku: 'dusk-sub',
      blurb: "Your nervous system is still answering Slack at 11:47pm. The cortisol curve that should be falling is doing the opposite. You don't need to be sedated — you need to be unwound.",
      ingredients: [
        { name:'L-Theanine', why:'Quiets racing thoughts without sedation', dose:'200 mg' },
        { name:'Reishi',     why:'Lowers cortisol over 7–14 nights of consistent use', dose:'500 mg' },
      ],
    },
    restless: {
      title: 'The Restless Body',
      flavor: 'Vanilla Dusk',
      sku: 'dusk-sub',
      blurb: "Your mind clocks out before your body does. Shoulders, jaw, calves — the day's tension is still locked in by the time the lights go off.",
      ingredients: [
        { name:'Magnesium Glycinate', why:'Releases muscle tension and calms the nervous system', dose:'300 mg' },
        { name:'Ashwagandha KSM-66', why:'Regulates the cortisol curve so tension actually unwinds', dose:'600 mg' },
      ],
    },
    light: {
      title: 'The Light Sleeper',
      flavor: 'Matcha Midnight',
      sku: 'dusk-sub',
      blurb: "Falling asleep isn't the problem — staying asleep is. You wake at 3:14am to a fully formed thought, or to nothing at all. Your sleep architecture needs depth, not duration.",
      ingredients: [
        { name:'Tart Cherry Extract', why:'Natural source of melatonin — extends deep-sleep windows', dose:'480 mg' },
        { name:'Magnesium Glycinate', why:'Reduces the micro-arousals that fragment the night', dose:'300 mg' },
      ],
    },
    fatigue: {
      title: 'The Burnt Out',
      flavor: 'Cacao Moon',
      sku: 'dusk-sub',
      blurb: "You're not sleeping badly — you're sleeping insufficiently. What sleep you do get isn't restoring you. The mornings feel like a hangover you didn't earn.",
      ingredients: [
        { name:'Ashwagandha KSM-66', why:'Restores cortisol balance over weeks of use', dose:'600 mg' },
        { name:'Reishi',              why:'Supports overnight nervous-system recovery', dose:'500 mg' },
      ],
    },
    holistic: {
      title: 'The Multi-Factor',
      flavor: 'Mix Pack',
      sku: 'mix-sub',
      blurb: "Some nights it's the mind, some nights it's the body, some nights both. A single flavor would feel reductive — you need range, not repetition.",
      ingredients: [
        { name:'Five formulas',      why:'Honey Lavender · Vanilla Dusk · Cacao Moon · Spiced Chai · Matcha Midnight', dose:'30 sachets' },
        { name:'Full clinical dose', why:'Same therapeutic dosing across every flavor', dose:'5 actives' },
      ],
    },
  };

  let state = newState();
  let stage, progressFill, progressText, nextBtn, backBtn, modal;

  function newState(){
    return { idx: 0, answers: {}, wiredSlider: 5, finished: false };
  }

  function init(){
    modal = document.getElementById('dx-modal');
    if(!modal) return;
    stage = document.getElementById('dx-stage');
    progressFill = document.getElementById('dx-progress-fill');
    progressText = document.getElementById('dx-progress-text');
    nextBtn = document.getElementById('dx-next');
    backBtn = document.getElementById('dx-back');
    const close = document.getElementById('dx-close');

    document.querySelectorAll('[data-dx-open]').forEach(btn => btn.addEventListener('click', open));
    close.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

    nextBtn.addEventListener('click', goNext);
    backBtn.addEventListener('click', goBack);

    render();
    initProfileCardCycler();
  }

  function open(){
    if(state.finished) state = newState();
    state.idx = 0;
    nextBtn.style.display = '';
    backBtn.style.display = '';
    render();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  function setProgress(idx, total){
    progressText.textContent = `${String(idx+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
    const pct = ((idx + 1) / total) * 100;
    progressFill.style.width = `${pct}%`;
  }

  function render(){
    const q = QUESTIONS[state.idx];
    setProgress(state.idx, QUESTIONS.length);
    backBtn.disabled = state.idx === 0;
    nextBtn.innerHTML = state.idx === QUESTIONS.length - 1
      ? 'Reveal my profile <span class="arr">→</span>'
      : 'Continue <span class="arr">→</span>';

    if(q.type === 'slider') renderSlider(q);
    else renderOptions(q);
  }

  function renderOptions(q){
    const screen = document.createElement('div');
    screen.className = 'dx-screen';
    screen.innerHTML = `
      <div class="dx-q-eyebrow">Question ${state.idx + 1} of ${QUESTIONS.length}</div>
      <h2 class="dx-q-text">${q.text}</h2>
      <p class="dx-q-hint">${q.hint}</p>
      <div class="dx-options" role="radiogroup">
        ${q.options.map(o => `
          <button class="dx-option" role="radio" aria-checked="false" data-v="${o.v}">
            <span class="opt-check" aria-hidden="true"></span>
            <span class="opt-text">${o.text}</span>
          </button>
        `).join('')}
      </div>
    `;
    swap(screen);

    const opts = screen.querySelectorAll('.dx-option');
    opts.forEach(b => {
      if(state.answers[q.id] === b.dataset.v) b.setAttribute('aria-checked','true');
      b.addEventListener('click', () => {
        opts.forEach(x => x.setAttribute('aria-checked','false'));
        b.setAttribute('aria-checked','true');
        state.answers[q.id] = b.dataset.v;
        nextBtn.disabled = false;
      });
    });
    nextBtn.disabled = !state.answers[q.id];
  }

  function renderSlider(q){
    const screen = document.createElement('div');
    screen.className = 'dx-screen';
    const v = state.wiredSlider;
    screen.innerHTML = `
      <div class="dx-q-eyebrow">Question ${state.idx + 1} of ${QUESTIONS.length}</div>
      <h2 class="dx-q-text">${q.text}</h2>
      <p class="dx-q-hint">${q.hint}</p>
      <div class="dx-slider-wrap">
        <div class="dx-slider-value">
          <span class="num" id="dx-slider-num">${v}</span>
          <span class="of">/ 10 — <span id="dx-slider-desc">${describeWired(v)}</span></span>
        </div>
        <input type="range" min="1" max="10" value="${v}" class="dx-slider" id="dx-slider" aria-label="How wired do you feel" />
        <div class="dx-slider-labels">
          <span>Calm</span>
          <span>Buzzing</span>
        </div>
      </div>
    `;
    swap(screen);

    const slider = screen.querySelector('#dx-slider');
    const num = screen.querySelector('#dx-slider-num');
    const desc = screen.querySelector('#dx-slider-desc');
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      state.wiredSlider = val;
      num.textContent = val;
      desc.textContent = describeWired(val);
    });
    nextBtn.disabled = false;
  }

  function describeWired(v){
    if(v <= 3) return 'Settled';
    if(v <= 5) return 'Slightly humming';
    if(v <= 7) return 'Notably wired';
    return 'Fully buzzing';
  }

  function swap(newScreen){
    stage.innerHTML = '';
    stage.appendChild(newScreen);
    requestAnimationFrame(() => newScreen.classList.add('active'));
  }

  function goNext(){
    const q = QUESTIONS[state.idx];
    if(q.type === 'options' && !state.answers[q.id]) return;

    if(state.idx < QUESTIONS.length - 1){
      state.idx++;
      render();
    } else {
      showResult();
    }
  }

  function goBack(){
    if(state.idx === 0) return;
    state.idx--;
    render();
  }

  function computeScore(){
    const score = { wired:0, restless:0, light:0, fatigue:0 };
    QUESTIONS.forEach(q => {
      if(q.type === 'options'){
        const v = state.answers[q.id];
        if(!v) return;
        const opt = q.options.find(o => o.v === v);
        if(opt) Object.entries(opt.tags || {}).forEach(([k, n]) => { score[k] += n; });
      } else if(q.type === 'slider'){
        const v = state.wiredSlider;
        if(v >= 7) score.wired += 3;
        else if(v >= 4) score.wired += 1;
      }
    });
    return score;
  }

  function pickArchetype(){
    const s = computeScore();
    const total = s.wired + s.restless + s.light + s.fatigue;
    const max = Math.max(s.wired, s.restless, s.light, s.fatigue);
    if(max === 0 || max / total < 0.40) return ARCHETYPES.holistic;
    if(s.wired === max) return ARCHETYPES.wired;
    if(s.restless === max) return ARCHETYPES.restless;
    if(s.light === max) return ARCHETYPES.light;
    return ARCHETYPES.fatigue;
  }

  function showResult(){
    state.finished = true;
    const arch = pickArchetype();
    progressText.textContent = 'COMPLETE';
    progressFill.style.width = '100%';
    nextBtn.style.display = 'none';
    backBtn.style.display = 'none';

    const screen = document.createElement('div');
    screen.className = 'dx-screen dx-result';
    const price = arch.sku === 'mix-sub' ? '$36/mo' : '$34/mo';
    screen.innerHTML = `
      <div class="dx-q-eyebrow">Your sleep profile</div>
      <h2 class="dx-result-title">${arch.title}</h2>
      <p class="dx-result-blurb">${arch.blurb}</p>

      <div class="dx-ingreds">
        ${arch.ingredients.map(i => `
          <div class="dx-ingred">
            <div class="ig-name">${i.name}</div>
            <div class="ig-why">${i.why}</div>
            <div class="ig-dose">${i.dose}</div>
          </div>
        `).join('')}
      </div>

      <div class="dx-rec">
        <div class="rec-info">
          <span class="rec-label">Recommended</span>
          <div class="rec-flavor">${arch.flavor}</div>
          <span class="rec-plan">Subscribe · ${price} · Skip anytime</span>
        </div>
        <div class="dx-result-actions">
          <button class="btn btn-primary" id="dx-add">Begin my ritual <span class="arr">→</span></button>
          <button class="dx-restart" id="dx-restart">Retake the diagnostic</button>
        </div>
      </div>

      <p class="dx-disclaim">Not medical advice — DRIFT is a dietary supplement. Consult your physician for sleep concerns.</p>
    `;
    swap(screen);

    document.getElementById('dx-add').addEventListener('click', () => {
      Cart.add(arch.sku, { flavor: arch.flavor });
      toast(`${arch.flavor} added — your ritual begins`, 'moon');
      closeModal();
      setTimeout(() => openCart && openCart(), 350);
    });
    document.getElementById('dx-restart').addEventListener('click', () => {
      state = newState();
      nextBtn.style.display = '';
      backBtn.style.display = '';
      render();
    });
  }

  /* Live "Profile Card" cycler — rotates archetypes on the §03 section */
  function initProfileCardCycler(){
    const card = document.getElementById('profile-card');
    if(!card) return;

    const ARCH_PREVIEWS = [
      { key:'wired',    title:'The Wired Mind',    desc:'Mind racing past midnight. Cortisol elevated. Needs unwinding, not sedation.', flavor:'Honey Lavender', swatch:'#B7A7CB', ingreds:[ {n:'L-Theanine', d:'200mg'}, {n:'Reishi', d:'500mg'} ], num:'0042' },
      { key:'restless', title:'The Restless Body', desc:"Mind clocked out, body still tense. Shoulders, jaw, calves carrying the day.", flavor:'Vanilla Dusk',   swatch:'#E8C58A', ingreds:[ {n:'Magnesium', d:'300mg'}, {n:'Ashwagandha', d:'600mg'} ], num:'0186' },
      { key:'light',    title:'The Light Sleeper', desc:'Falls asleep fine. Wakes at 3:14am. Sleep architecture needs depth, not duration.', flavor:'Matcha Midnight', swatch:'#5A7A4D', ingreds:[ {n:'Tart Cherry', d:'480mg'}, {n:'Magnesium', d:'300mg'} ], num:'0298' },
      { key:'fatigue',  title:'The Burnt Out',     desc:"Sleeping insufficiently — and what sleep happens isn't restoring. Recovery is the goal.", flavor:'Cacao Moon', swatch:'#6B4226', ingreds:[ {n:'Ashwagandha', d:'600mg'}, {n:'Reishi', d:'500mg'} ], num:'0411' },
      { key:'holistic', title:'The Multi-Factor',  desc:'Some nights mind, some nights body, some nights both. Range over repetition.', flavor:'Mix Pack — All 5', swatch:'conic', ingreds:[ {n:'5 formulas', d:'30 sachets'}, {n:'Full clinical dose', d:'every night'} ], num:'0573' },
    ];

    const titleEl = document.getElementById('pcard-title');
    const descEl = document.getElementById('pcard-desc');
    const flavorEl = document.getElementById('pcard-flavor');
    const swEl = document.getElementById('pcard-sw');
    const ingredsEl = document.getElementById('pcard-ingreds');
    const numEl = document.getElementById('pcard-num');
    const dotsEl = document.getElementById('pcard-dots');
    const tags = document.querySelectorAll('#archetype-tags span');

    let idx = 0, timer = null, paused = false;

    function paint(i){
      const a = ARCH_PREVIEWS[i];
      const fades = card.querySelectorAll('.pcard-fade');
      fades.forEach(f => f.classList.add('out'));
      setTimeout(() => {
        titleEl.textContent = a.title;
        descEl.textContent = a.desc;
        flavorEl.textContent = a.flavor;
        if(a.swatch === 'conic'){
          swEl.style.background = 'conic-gradient(#B7A7CB 0 20%, #E8C58A 20% 40%, #6B4226 40% 60%, #C8753A 60% 80%, #5A7A4D 80% 100%)';
        } else {
          swEl.style.background = a.swatch;
        }
        ingredsEl.innerHTML = a.ingreds.map(g => `
          <div class="ig-pill"><span class="ig-name">${g.n}</span><span class="ig-dose">${g.d}</span></div>
        `).join('');
        numEl.textContent = `PROFILE NO. ${a.num}`;
        dotsEl.querySelectorAll('.d').forEach((d, j) => d.classList.toggle('active', j === i));
        tags.forEach(t => t.classList.toggle('is-active', t.dataset.arch === a.key));
        fades.forEach(f => f.classList.remove('out'));
      }, 460);
    }

    function tick(){ if(paused) return; idx = (idx + 1) % ARCH_PREVIEWS.length; paint(idx); }
    function start(){ stop(); timer = setInterval(tick, 3600); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }

    paint(0);
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting) start(); else stop(); });
    }, { threshold: 0.2 });
    io.observe(card);

    card.addEventListener('mouseenter', () => { paused = true });
    card.addEventListener('mouseleave', () => { paused = false });

    tags.forEach((t) => {
      t.addEventListener('click', () => {
        const targetIdx = ARCH_PREVIEWS.findIndex(a => a.key === t.dataset.arch);
        if(targetIdx >= 0){ idx = targetIdx; paint(idx); start(); }
      });
      t.style.cursor = 'pointer';
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('dx-modal')) DX.init();
});
