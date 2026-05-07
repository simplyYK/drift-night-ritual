/* =========================================================
   THE DRIFT DIAGNOSTIC v2 — Sleep Signal Engine
   Live archetype meter, ranked flavor matches, keyboard,
   profile recall, single-tap add-to-cart.
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
      key: 'wired',
      title: 'The Wired Mind',
      label: 'Wired',
      blurb: "Your nervous system is still answering Slack at 11:47pm. The cortisol curve that should be falling is doing the opposite. You don't need to be sedated — you need to be unwound.",
      ingredients: [
        { name:'L-Theanine', why:'Quiets racing thoughts without sedation', dose:'200 mg' },
        { name:'Reishi',     why:'Lowers cortisol over 7–14 nights of consistent use', dose:'500 mg' },
      ],
      flavors: ['lavender','matcha','vanilla'],
    },
    restless: {
      key: 'restless',
      title: 'The Restless Body',
      label: 'Restless',
      blurb: "Your mind clocks out before your body does. Shoulders, jaw, calves — the day's tension is still locked in by the time the lights go off.",
      ingredients: [
        { name:'Magnesium Glycinate', why:'Releases muscle tension and calms the nervous system', dose:'300 mg' },
        { name:'Ashwagandha KSM-66', why:'Regulates the cortisol curve so tension actually unwinds', dose:'600 mg' },
      ],
      flavors: ['vanilla','chai','cacao'],
    },
    light: {
      key: 'light',
      title: 'The Light Sleeper',
      label: 'Light',
      blurb: "Falling asleep isn't the problem — staying asleep is. You wake at 3:14am to a fully formed thought, or to nothing at all. Your sleep architecture needs depth, not duration.",
      ingredients: [
        { name:'Tart Cherry Extract', why:'Natural source of melatonin — extends deep-sleep windows', dose:'480 mg' },
        { name:'Magnesium Glycinate', why:'Reduces the micro-arousals that fragment the night', dose:'300 mg' },
      ],
      flavors: ['matcha','lavender','vanilla'],
    },
    fatigue: {
      key: 'fatigue',
      title: 'The Burnt Out',
      label: 'Burnt out',
      blurb: "You're not sleeping badly — you're sleeping insufficiently. What sleep you do get isn't restoring you. The mornings feel like a hangover you didn't earn.",
      ingredients: [
        { name:'Ashwagandha KSM-66', why:'Restores cortisol balance over weeks of use', dose:'600 mg' },
        { name:'Reishi',              why:'Supports overnight nervous-system recovery', dose:'500 mg' },
      ],
      flavors: ['cacao','chai','vanilla'],
    },
    holistic: {
      key: 'holistic',
      title: 'The Multi-Factor',
      label: 'Multi-factor',
      blurb: "Some nights it's the mind, some nights it's the body, some nights both. A single flavor would feel reductive — you need range, not repetition.",
      ingredients: [
        { name:'Five formulas',      why:'Honey Lavender · Vanilla Dusk · Cacao Moon · Spiced Chai · Matcha Midnight', dose:'30 sachets' },
        { name:'Full clinical dose', why:'Same therapeutic dosing across every flavor', dose:'5 actives' },
      ],
      flavors: ['mix','vanilla','lavender'],
    },
  };

  const FLAVORS = {
    lavender: { name:'Honey Lavender',  swatch:'#B7A7CB', desc:'Floral · Calming',     sku:{ sub:'dusk-sub', one:'dusk-one' } },
    vanilla:  { name:'Vanilla Dusk',    swatch:'#E8C58A', desc:'Warm · Creamy',         sku:{ sub:'dusk-sub', one:'dusk-one' } },
    cacao:    { name:'Cacao Moon',      swatch:'#C68A5A', desc:'Rich · Restorative',    sku:{ sub:'dusk-sub', one:'dusk-one' } },
    chai:     { name:'Spiced Chai',     swatch:'#C8753A', desc:'Aromatic · Cosy',       sku:{ sub:'dusk-sub', one:'dusk-one' } },
    matcha:   { name:'Matcha Midnight', swatch:'#7A9D6E', desc:'Earthy · Light',        sku:{ sub:'dusk-sub', one:'dusk-one' } },
    mix:      { name:'Mix Pack',        swatch:'conic',   desc:'All 5 · Rotate nightly',sku:{ sub:'mix-sub',  one:'mix-one'  } },
  };

  const PROFILE_KEY = 'drift_dx_profile_v2';

  let state = newState();
  let stage, progressFill, progressText, nextBtn, backBtn, modal, signalEls;

  function newState(){
    return {
      step: 'welcome',           // 'welcome' | 'q' | 'thinking' | 'result'
      idx: 0,
      answers: {},               // qid -> value
      wiredSlider: 5,
      flavor: null,              // chosen flavor key in result
      plan: 'sub',               // 'sub' | 'one'
    };
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
    document.addEventListener('keydown', onKey);

    nextBtn.addEventListener('click', goNext);
    backBtn.addEventListener('click', goBack);

    renderWelcome();
    initProfileCardCycler();
  }

  /* ----------- Profile persistence ----------- */
  function loadProfile(){
    try{ return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch{ return null; }
  }
  function saveProfile(){
    const arch = pickArchetype();
    const ranked = rankedFlavors();
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      answers: state.answers,
      wiredSlider: state.wiredSlider,
      archetype: arch.key,
      archetypeTitle: arch.title,
      flavor: state.flavor,
      plan: state.plan,
      matchPct: matchPct(arch.key),
      ranked,
      ts: Date.now(),
    }));
    document.dispatchEvent(new CustomEvent('dx:profile-saved'));
  }

  /* ----------- Modal lifecycle ----------- */
  function open(){
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    // Reset; renderWelcome handles "resume" UX
    state = newState();
    renderWelcome();
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  /* ----------- Keyboard ----------- */
  function onKey(e){
    if(!modal.classList.contains('open')) return;
    if(e.key === 'Escape'){ closeModal(); return; }

    if(state.step === 'q'){
      const q = QUESTIONS[state.idx];
      if(q.type === 'options' && /^[1-9]$/.test(e.key)){
        const i = parseInt(e.key, 10) - 1;
        const opts = stage.querySelectorAll('.dx-option');
        if(opts[i]){ opts[i].click(); e.preventDefault(); }
        return;
      }
      if(q.type === 'slider' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){
        const slider = stage.querySelector('#dx-slider');
        if(slider){
          const v = parseInt(slider.value, 10) + (e.key === 'ArrowRight' ? 1 : -1);
          slider.value = Math.max(1, Math.min(10, v));
          slider.dispatchEvent(new Event('input', { bubbles:true }));
          e.preventDefault();
        }
        return;
      }
      if(e.key === 'Enter' && !nextBtn.disabled){ goNext(); e.preventDefault(); }
      if(e.key === 'Backspace' && !backBtn.disabled){ goBack(); e.preventDefault(); }
    } else if(state.step === 'welcome' && e.key === 'Enter'){
      const start = stage.querySelector('#dx-start');
      if(start) start.click();
    }
  }

  /* ----------- Scoring ----------- */
  function computeScore(){
    const score = { wired:0, restless:0, light:0, fatigue:0 };
    QUESTIONS.forEach(q => {
      if(q.type === 'options'){
        const v = state.answers[q.id];
        if(!v) return;
        const opt = q.options.find(o => o.v === v);
        if(opt) Object.entries(opt.tags || {}).forEach(([k, n]) => { score[k] += n; });
      } else if(q.type === 'slider' && state.answers[q.id] != null){
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
    if(max === 0) return ARCHETYPES.holistic;
    if(max / total < 0.40) return ARCHETYPES.holistic;
    if(s.wired === max) return ARCHETYPES.wired;
    if(s.restless === max) return ARCHETYPES.restless;
    if(s.light === max) return ARCHETYPES.light;
    return ARCHETYPES.fatigue;
  }

  function matchPct(key){
    const s = computeScore();
    const total = s.wired + s.restless + s.light + s.fatigue;
    if(total === 0) return 0;
    if(key === 'holistic'){
      // Holistic = even spread; "match" = 100 - spread
      const avg = total / 4;
      const variance = ['wired','restless','light','fatigue']
        .reduce((acc, k) => acc + Math.abs(s[k] - avg), 0) / total;
      return Math.round(Math.max(70, 100 - variance * 50));
    }
    return Math.round(Math.min(99, 60 + (s[key] / total) * 50));
  }

  /* Rank all 6 flavors by fit to the dominant archetype + secondary factors */
  function rankedFlavors(){
    const arch = pickArchetype();
    const order = arch.flavors.slice();
    // Ensure all flavors appear
    Object.keys(FLAVORS).forEach(k => { if(!order.includes(k)) order.push(k); });
    return order;
  }

  /* ----------- Progress + signal ----------- */
  function setProgress(){
    const total = QUESTIONS.length;
    if(state.step === 'q'){
      const p = ((state.idx + 1) / total) * 100;
      progressFill.style.width = `${p}%`;
      progressText.textContent = `${String(state.idx+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
    } else if(state.step === 'thinking'){
      progressFill.style.width = '100%';
      progressText.textContent = 'SYNTHESIZING';
    } else if(state.step === 'result'){
      progressFill.style.width = '100%';
      progressText.textContent = 'COMPLETE';
    } else {
      progressFill.style.width = '0%';
      progressText.textContent = '';
    }
  }

  const SIG_KEYS = ['wired','restless','light','fatigue'];

  function buildSignal(container){
    const wrap = document.createElement('div');
    wrap.className = 'dx-signal';
    wrap.innerHTML = `
      <div class="dx-signal-head">
        <span class="lbl">Sleep signal</span>
        <span class="reading" data-reading>Awaiting input…</span>
      </div>
      <div class="dx-signal-bars">
        ${SIG_KEYS.map(k => `
          <div class="dx-sig" data-k="${k}">
            <div class="bar"><div class="fill" style="width:0%"></div></div>
            <div class="cap"><span>${ARCHETYPES[k].label}</span><span class="pct" data-pct>0%</span></div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(wrap);
    updateSignal(container);
    return wrap;
  }

  function updateSignal(container){
    const s = computeScore();
    const total = s.wired + s.restless + s.light + s.fatigue;
    const max = Math.max(...SIG_KEYS.map(k => s[k]));
    let reading = 'Awaiting input…';
    if(total > 0){
      const dominant = (max / total < 0.40)
        ? ARCHETYPES.holistic
        : ARCHETYPES[SIG_KEYS.find(k => s[k] === max)];
      reading = `Reading: ${dominant.label}`;
    }
    const readEl = container.querySelector('[data-reading]');
    if(readEl) readEl.textContent = reading;
    SIG_KEYS.forEach(k => {
      const pct = total === 0 ? 0 : Math.round((s[k] / total) * 100);
      const fill = container.querySelector(`.dx-sig[data-k="${k}"] .fill`);
      const pctEl = container.querySelector(`.dx-sig[data-k="${k}"] [data-pct]`);
      if(fill) fill.style.width = pct + '%';
      if(pctEl) pctEl.textContent = pct + '%';
    });
  }

  /* ----------- Welcome ----------- */
  function renderWelcome(){
    state.step = 'welcome';
    setProgress();
    backBtn.style.display = 'none';
    nextBtn.style.display = 'none';

    const profile = loadProfile();
    const screen = document.createElement('div');
    screen.className = 'dx-screen dx-welcome';
    screen.innerHTML = `
      <div class="dx-welcome-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
          <path d="M16.5 14.2A7 7 0 0 1 9.8 7.5a7 7 0 1 0 6.7 6.7Z"/>
          <circle cx="18.5" cy="6.5" r="0.9" fill="currentColor"/>
        </svg>
      </div>
      <div class="dx-q-eyebrow">A 60-second consultation</div>
      <h2 class="dx-welcome-h">Find your DRIFT match.</h2>
      <p class="dx-welcome-p">
        Six questions, one quiet conversation. We'll read your sleep signal,
        name your archetype, and rank the flavors most likely to fit your nights.
      </p>
      <ul class="dx-welcome-list">
        <li><span class="dot"></span>Real-time archetype meter — watch your profile build</li>
        <li><span class="dot"></span>Top three flavor matches with a confidence score</li>
        <li><span class="dot"></span>One tap to add the right SKU to your cart</li>
      </ul>
      <div class="dx-welcome-actions">
        <button class="btn btn-primary" id="dx-start">Begin the diagnostic <span class="arr">→</span></button>
        ${profile ? `<button class="dx-link" id="dx-resume">Resume · ${ARCHETYPES[profile.archetype].title} · ${profile.matchPct || 0}% match</button>` : ''}
      </div>
    `;
    swap(screen);

    document.getElementById('dx-start').addEventListener('click', () => {
      state.step = 'q';
      state.idx = 0;
      renderQuestion();
    });
    const resume = document.getElementById('dx-resume');
    if(resume){
      resume.addEventListener('click', () => {
        const p = loadProfile();
        if(!p) return;
        state.answers = p.answers || {};
        state.wiredSlider = p.wiredSlider || 5;
        state.flavor = p.flavor;
        state.plan = p.plan || 'sub';
        renderResult();
      });
    }
  }

  /* ----------- Question screens ----------- */
  function renderQuestion(){
    state.step = 'q';
    setProgress();
    backBtn.style.display = '';
    nextBtn.style.display = '';
    backBtn.disabled = state.idx === 0;
    nextBtn.innerHTML = state.idx === QUESTIONS.length - 1
      ? 'Reveal my profile <span class="arr">→</span>'
      : 'Continue <span class="arr">→</span>';

    const q = QUESTIONS[state.idx];
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
        ${q.options.map((o, i) => `
          <button class="dx-option" role="radio" aria-checked="false" data-v="${o.v}">
            <span class="opt-key">${i + 1}</span>
            <span class="opt-text">${o.text}</span>
            <span class="opt-check" aria-hidden="true"></span>
          </button>
        `).join('')}
      </div>
    `;
    buildSignal(screen);
    swap(screen);

    const opts = screen.querySelectorAll('.dx-option');
    opts.forEach(b => {
      if(state.answers[q.id] === b.dataset.v) b.setAttribute('aria-checked','true');
      b.addEventListener('click', () => {
        opts.forEach(x => x.setAttribute('aria-checked','false'));
        b.setAttribute('aria-checked','true');
        state.answers[q.id] = b.dataset.v;
        nextBtn.disabled = false;
        updateSignal(screen);
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
        <div class="dx-slider-labels"><span>Calm</span><span>Buzzing</span></div>
      </div>
    `;
    buildSignal(screen);
    swap(screen);

    state.answers[q.id] = state.wiredSlider; // record initial
    const slider = screen.querySelector('#dx-slider');
    const num = screen.querySelector('#dx-slider-num');
    const desc = screen.querySelector('#dx-slider-desc');
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      state.wiredSlider = val;
      state.answers[q.id] = val;
      num.textContent = val;
      desc.textContent = describeWired(val);
      updateSignal(screen);
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
    if(state.step !== 'q') return;
    const q = QUESTIONS[state.idx];
    if(q.type === 'options' && !state.answers[q.id]) return;
    if(state.idx < QUESTIONS.length - 1){
      state.idx++;
      renderQuestion();
    } else {
      renderThinking();
    }
  }
  function goBack(){
    if(state.step !== 'q' || state.idx === 0) return;
    state.idx--;
    renderQuestion();
  }

  /* ----------- Thinking ----------- */
  function renderThinking(){
    state.step = 'thinking';
    setProgress();
    backBtn.style.display = 'none';
    nextBtn.style.display = 'none';

    const screen = document.createElement('div');
    screen.className = 'dx-screen dx-thinking';
    screen.innerHTML = `
      <div class="dx-think-orb" aria-hidden="true"></div>
      <p class="dx-think-line" id="dx-think-line">Reading your sleep signal…</p>
    `;
    swap(screen);

    const lines = [
      'Reading your sleep signal…',
      'Cross-referencing the cortisol curve…',
      'Matching ingredient pairings…',
      'Composing your nightly ritual…',
    ];
    let i = 0;
    const lineEl = screen.querySelector('#dx-think-line');
    const interval = setInterval(() => {
      i++;
      if(i >= lines.length){ clearInterval(interval); return; }
      lineEl.style.opacity = '0';
      setTimeout(() => { lineEl.textContent = lines[i]; lineEl.style.opacity = '1'; }, 220);
    }, 480);
    setTimeout(() => { clearInterval(interval); renderResult(); }, 1900);
  }

  /* ----------- Result ----------- */
  function renderResult(){
    state.step = 'result';
    setProgress();
    backBtn.style.display = 'none';
    nextBtn.style.display = 'none';

    const arch = pickArchetype();
    const pct = matchPct(arch.key);
    const ranked = rankedFlavors();
    if(!state.flavor) state.flavor = ranked[0];

    const screen = document.createElement('div');
    screen.className = 'dx-screen dx-result';
    screen.innerHTML = `
      <div class="dx-result-head">
        <div class="dx-q-eyebrow">Your sleep profile</div>
        <h2 class="dx-result-title">${arch.title}</h2>
        <div class="dx-match-row">
          <div class="dx-match-meter"><div class="fill" style="width:${pct}%"></div></div>
          <span class="dx-match-pct">${pct}% match</span>
        </div>
      </div>

      <p class="dx-result-blurb">${arch.blurb}</p>

      <div class="dx-ranked-head">
        <span class="dx-q-eyebrow">Top flavor matches</span>
        <span class="dx-ranked-hint">Tap to switch</span>
      </div>
      <div class="dx-ranked" id="dx-ranked">
        ${ranked.slice(0, 3).map((k, i) => {
          const f = FLAVORS[k];
          const tag = i === 0 ? 'Primary' : (i === 1 ? 'Strong alt' : 'Wildcard');
          return `
            <button class="dx-flavor" data-flavor="${k}" aria-checked="${k === state.flavor}">
              <span class="dx-flavor-rank">${i + 1}</span>
              <span class="dx-flavor-sw" style="${swatchStyle(f)}"></span>
              <span class="dx-flavor-info">
                <span class="dx-flavor-name">${f.name}</span>
                <span class="dx-flavor-desc">${f.desc}</span>
              </span>
              <span class="dx-flavor-tag">${tag}</span>
            </button>
          `;
        }).join('')}
      </div>

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
          <span class="rec-label">Your ritual</span>
          <div class="rec-flavor" id="dx-rec-flavor">${FLAVORS[state.flavor].name}</div>
          <div class="dx-plan-toggle" role="radiogroup" aria-label="Plan">
            <button class="dx-plan" data-plan="sub" aria-checked="${state.plan === 'sub'}">Subscribe <span class="dx-plan-price" id="dx-plan-sub-price"></span></button>
            <button class="dx-plan" data-plan="one" aria-checked="${state.plan === 'one'}">One-time <span class="dx-plan-price" id="dx-plan-one-price"></span></button>
          </div>
        </div>
        <div class="dx-result-actions">
          <button class="btn btn-primary" id="dx-add">Begin my ritual <span class="arr">→</span></button>
          <button class="dx-link" id="dx-restart">Adjust answers</button>
        </div>
      </div>

      <p class="dx-disclaim">Not medical advice — DRIFT is a dietary supplement. Consult your physician for sleep concerns.</p>
    `;
    swap(screen);

    // Bind ranked-flavor switching
    screen.querySelectorAll('.dx-flavor').forEach(b => {
      b.addEventListener('click', () => {
        screen.querySelectorAll('.dx-flavor').forEach(x => x.setAttribute('aria-checked','false'));
        b.setAttribute('aria-checked','true');
        state.flavor = b.dataset.flavor;
        document.getElementById('dx-rec-flavor').textContent = FLAVORS[state.flavor].name;
        updatePlanPrices();
      });
    });
    screen.querySelectorAll('.dx-plan').forEach(b => {
      b.addEventListener('click', () => {
        screen.querySelectorAll('.dx-plan').forEach(x => x.setAttribute('aria-checked','false'));
        b.setAttribute('aria-checked','true');
        state.plan = b.dataset.plan;
        updatePlanPrices();
      });
    });

    document.getElementById('dx-add').addEventListener('click', () => {
      const sku = FLAVORS[state.flavor].sku[state.plan];
      Cart.add(sku, { flavor: FLAVORS[state.flavor].name });
      saveProfile();
      toast(`${FLAVORS[state.flavor].name} added — your ritual begins`, 'moon');
      closeModal();
      setTimeout(() => openCart && openCart(), 300);
    });
    document.getElementById('dx-restart').addEventListener('click', () => {
      state = newState();
      renderWelcome();
    });

    saveProfile();
    updatePlanPrices();
  }

  function updatePlanPrices(){
    const f = FLAVORS[state.flavor];
    const subSku = f.sku.sub;
    const oneSku = f.sku.one;
    const subEl = document.getElementById('dx-plan-sub-price');
    const oneEl = document.getElementById('dx-plan-one-price');
    if(subEl && PRODUCTS[subSku]) subEl.textContent = `$${PRODUCTS[subSku].price}/mo`;
    if(oneEl && PRODUCTS[oneSku]) oneEl.textContent = `$${PRODUCTS[oneSku].price}`;
  }

  function swatchStyle(f){
    if(f.swatch === 'conic'){
      return 'background: conic-gradient(#B7A7CB 0 20%, #E8C58A 20% 40%, #6B4226 40% 60%, #C8753A 60% 80%, #5A7A4D 80% 100%)';
    }
    return `background:${f.swatch}`;
  }

  /* ----------- Profile-card cycler on §03 (homepage) ----------- */
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
