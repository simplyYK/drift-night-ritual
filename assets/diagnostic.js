/* =========================================================
   THE DRIFT DIAGNOSTIC — Conversational Sleep Concierge
   Client-side decision tree styled as an AI consultation
   ========================================================= */

const DX = (() => {
  const QUESTIONS = [
    {
      id: 'lastSleep',
      eyebrow: 'Question 01',
      text: 'When did you last sleep through the night uninterrupted?',
      hint: 'Be honest — there are no wrong answers here.',
      type: 'options',
      options: [
        { v:'rare',   text:"I genuinely can't remember", mono:'Rare',     tags:{ light:2, fatigue:2 } },
        { v:'weekly', text:'Maybe once or twice a week', mono:'Weekly',   tags:{ light:1, fatigue:1 } },
        { v:'often',  text:'Most nights, with some bad ones', mono:'Often', tags:{ light:1 } },
        { v:'last',   text:'Last night, actually',       mono:'Recently', tags:{} },
      ]
    },
    {
      id: 'whatKeeps',
      eyebrow: 'Question 02',
      text: "What's keeping you up at midnight?",
      hint: 'Pick the one that hits closest.',
      type: 'options',
      options: [
        { v:'mind',   text:'My mind keeps re-running the day', mono:'Cortisol',     tags:{ wired:3 } },
        { v:'body',   text:'My body feels tense and wired',    mono:'Tension',      tags:{ restless:3 } },
        { v:'anxious',text:'Anxious or racing thoughts',       mono:'Anxiety',      tags:{ wired:3 } },
        { v:'phone',  text:'Honestly? My phone',                mono:'Stimulation',  tags:{ wired:1, light:1 } },
        { v:'mix',    text:'A bit of all of the above',         mono:'Multifactor',  tags:{ wired:1, restless:1, light:1, fatigue:1 } },
      ]
    },
    {
      id: 'wake',
      eyebrow: 'Question 03',
      text: 'How do you usually wake up?',
      hint: 'Before coffee, before email.',
      type: 'options',
      options: [
        { v:'foggy',   text:'Foggy. It takes hours to feel human.', mono:'Heavy',       tags:{ fatigue:2, light:1 } },
        { v:'tired',   text:'Tired but functional',                  mono:'Lukewarm',    tags:{ fatigue:1 } },
        { v:'depends', text:'Depends entirely on the night',         mono:'Variable',    tags:{ light:2 } },
        { v:'sharp',   text:'Pretty sharp, actually',                 mono:'Restored',    tags:{} },
      ]
    },
    {
      id: 'tried',
      eyebrow: 'Question 04',
      text: "What have you tried before that didn't quite stick?",
      hint: 'Pick the one you used most.',
      type: 'options',
      options: [
        { v:'melatonin', text:'Melatonin gummies — the grogginess wasn\'t worth it', mono:'Melatonin', tags:{ fatigue:2 } },
        { v:'tea',       text:'Chamomile or sleepy tea — too weak',                  mono:'Tea',       tags:{ light:1 } },
        { v:'cbd',       text:'CBD or magnesium pills',                              mono:'Capsules',  tags:{ restless:1 } },
        { v:'apps',      text:'Meditation apps — I fell asleep mid-narration',      mono:'Apps',      tags:{ wired:1 } },
        { v:'nothing',   text:"Nothing serious yet",                                  mono:'New',        tags:{} },
      ]
    },
    {
      id: 'wired',
      eyebrow: 'Question 05',
      text: 'On a scale of 1 to 10, how wired do you feel right now?',
      hint: 'Trust your gut.',
      type: 'slider',
    },
    {
      id: 'goal',
      eyebrow: 'Question 06',
      text: 'And the one thing you most want from a ritual?',
      hint: 'The headline outcome.',
      type: 'options',
      options: [
        { v:'fall',  text:'Fall asleep faster',                  mono:'Onset',     tags:{ wired:2 } },
        { v:'stay',  text:'Stay asleep through the night',       mono:'Continuity',tags:{ light:2 } },
        { v:'wake',  text:'Wake up actually rested',             mono:'Recovery',  tags:{ fatigue:2 } },
        { v:'all',   text:'Honestly — all of it',                mono:'Holistic',  tags:{ wired:1, light:1, fatigue:1, restless:1 } },
      ]
    },
  ];

  const ARCHETYPES = {
    wired: {
      title: 'The Wired Mind',
      flavor: 'Honey Lavender',
      flavorKey: 'lavender',
      sku: 'dusk-sub',
      blurb: ({ wiredScore }) => `Your nervous system is still answering Slack at 11:47pm. The cortisol curve that should be falling is doing the opposite — and your body keeps producing alertness signals when it should be releasing them. <strong>You don't need to be sedated. You need to be unwound.</strong>`,
      explain: 'Honey Lavender pairs L-theanine and reishi to lower mental noise without putting you under. The floral profile triggers the classic relaxation response — Pavlovian, in the best way.',
      ingredients: [
        { name:'L-Theanine', why:'Quiets racing thoughts without sedation', dose:'200 mg' },
        { name:'Reishi',     why:'Lowers cortisol over 7–14 nights of consistent use', dose:'500 mg' },
      ],
    },
    restless: {
      title: 'The Restless Body',
      flavor: 'Vanilla Dusk',
      flavorKey: 'vanilla',
      sku: 'dusk-sub',
      blurb: () => `Your mind clocks out before your body does. Shoulders, jaw, calves — the day's tension is still locked in by the time the lights go off. <strong>This is a muscular signal, not a psychological one.</strong>`,
      explain: 'Vanilla Dusk leads with magnesium glycinate and ashwagandha — the muscle-relaxation backbone — wrapped in a warmer, creamier profile that feels like a deep exhale.',
      ingredients: [
        { name:'Magnesium Glycinate', why:'Releases muscle tension and calms the nervous system', dose:'300 mg' },
        { name:'Ashwagandha KSM-66®', why:'Regulates the cortisol curve so tension actually unwinds', dose:'600 mg' },
      ],
    },
    light: {
      title: 'The Light Sleeper',
      flavor: 'Matcha Midnight',
      flavorKey: 'matcha',
      sku: 'dusk-sub',
      blurb: () => `Falling asleep isn't the problem. Staying asleep is. You wake at 3:14am to a fully formed thought, or to the cat, or to nothing at all — and the rest of the night is patchy. <strong>Your sleep architecture needs depth, not duration.</strong>`,
      explain: 'Matcha Midnight is our lightest-bodied formula — a balanced lift of L-theanine with a higher dose of tart cherry to extend deep-sleep cycles and reduce night-waking.',
      ingredients: [
        { name:'Tart Cherry Extract', why:'Natural source of melatonin — extends deep-sleep windows', dose:'480 mg' },
        { name:'Magnesium Glycinate', why:'Reduces the micro-arousals that fragment the night', dose:'300 mg' },
      ],
    },
    fatigue: {
      title: 'The Burnt Out',
      flavor: 'Cacao Moon',
      flavorKey: 'cacao',
      sku: 'dusk-sub',
      blurb: () => `You're not sleeping badly. You're sleeping <em>insufficiently</em> — and what sleep you do get isn't restoring you. The mornings feel like a hangover you didn't earn. <strong>Recovery, not sedation, is the goal.</strong>`,
      explain: 'Cacao Moon is our most restorative blend — ashwagandha and reishi at full clinical doses, paired with raw cacao for a rich, indulgent ritual that signals "the day is over."',
      ingredients: [
        { name:'Ashwagandha KSM-66®', why:'Restores cortisol balance over weeks of use', dose:'600 mg' },
        { name:'Reishi',              why:'Supports overnight nervous-system recovery', dose:'500 mg' },
      ],
    },
    holistic: {
      title: 'The Multi-Factor',
      flavor: 'Mix Pack',
      flavorKey: 'mix',
      sku: 'mix-sub',
      blurb: () => `Your sleep struggles aren't tidy. Some nights it's the mind, some nights it's the body, some nights both — and a single flavor would feel reductive. <strong>You need range, not repetition.</strong>`,
      explain: 'The Mix Pack rotates all five DRIFT formulas through your month — let your body cue which one each night calls for. Most subscribers find a clear favorite within three weeks.',
      ingredients: [
        { name:'Five formulas',     why:'Honey Lavender · Vanilla Dusk · Cacao Moon · Spiced Chai · Matcha Midnight', dose:'30 sachets' },
        { name:'Full clinical dose', why:'Same therapeutic dosing across every flavor — never reduced', dose:'5 actives' },
      ],
    },
  };

  const THINKING_LINES = [
    'Reading your sleep signal…',
    'Cross-referencing the cortisol curve…',
    'Matching ingredient pairings…',
    'Composing your nightly ritual…',
  ];

  let state = {
    idx: 0,
    answers: {}, // id -> value
    score: { wired:0, restless:0, light:0, fatigue:0 },
    wiredSlider: 5,
    finished: false,
  };

  let stage, progressFill, progressText, nextBtn, backBtn, modal;

  function init(){
    modal = document.getElementById('dx-modal');
    stage = document.getElementById('dx-stage');
    progressFill = document.getElementById('dx-progress-fill');
    progressText = document.getElementById('dx-progress-text');
    nextBtn = document.getElementById('dx-next');
    backBtn = document.getElementById('dx-back');
    const close = document.getElementById('dx-close');

    if(!modal) return;

    // Multiple entry points across the page
    document.querySelectorAll('[data-dx-open]').forEach(btn => {
      btn.addEventListener('click', open);
    });

    close.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

    nextBtn.addEventListener('click', goNext);
    backBtn.addEventListener('click', goBack);

    render();
    initProfileCardCycler();
  }

  /* Live "Profile Card" cycler — rotates archetypes on the §03 section */
  function initProfileCardCycler(){
    const card = document.getElementById('profile-card');
    if(!card) return;

    const ARCH_PREVIEWS = [
      {
        key:'wired',
        title:'The Wired Mind',
        desc:'Mind racing past midnight. Cortisol elevated. Needs unwinding, not sedation.',
        flavor:'Honey Lavender',
        swatch:'#B7A7CB',
        ingreds:[ {n:'L-Theanine', d:'200mg'}, {n:'Reishi', d:'500mg'} ],
        num:'0042',
      },
      {
        key:'restless',
        title:'The Restless Body',
        desc:"Mind clocked out, body still tense. Shoulders, jaw, calves carrying the day.",
        flavor:'Vanilla Dusk',
        swatch:'#E8C58A',
        ingreds:[ {n:'Magnesium', d:'300mg'}, {n:'Ashwagandha', d:'600mg'} ],
        num:'0186',
      },
      {
        key:'light',
        title:'The Light Sleeper',
        desc:'Falls asleep fine. Wakes at 3:14am. Sleep architecture needs depth, not duration.',
        flavor:'Matcha Midnight',
        swatch:'#5A7A4D',
        ingreds:[ {n:'Tart Cherry', d:'480mg'}, {n:'Magnesium', d:'300mg'} ],
        num:'0298',
      },
      {
        key:'fatigue',
        title:'The Burnt Out',
        desc:'Sleeping insufficiently — and what sleep happens isn\'t restoring. Recovery is the goal.',
        flavor:'Cacao Moon',
        swatch:'#6B4226',
        ingreds:[ {n:'Ashwagandha', d:'600mg'}, {n:'Reishi', d:'500mg'} ],
        num:'0411',
      },
      {
        key:'holistic',
        title:'The Multi-Factor',
        desc:'Some nights mind, some nights body, some nights both. Range over repetition.',
        flavor:'Mix Pack — All 5',
        swatch:'conic',
        ingreds:[ {n:'5 formulas', d:'30 sachets'}, {n:'Full clinical dose', d:'every night'} ],
        num:'0573',
      },
    ];

    const titleEl = document.getElementById('pcard-title');
    const descEl = document.getElementById('pcard-desc');
    const flavorEl = document.getElementById('pcard-flavor');
    const swEl = document.getElementById('pcard-sw');
    const ingredsEl = document.getElementById('pcard-ingreds');
    const numEl = document.getElementById('pcard-num');
    const dotsEl = document.getElementById('pcard-dots');
    const tags = document.querySelectorAll('#archetype-tags span');

    let idx = 0;
    let timer = null;
    let paused = false;

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

        // Dots
        dotsEl.querySelectorAll('.d').forEach((d, j) => d.classList.toggle('active', j === i));
        // Archetype tag highlight
        tags.forEach(t => t.classList.toggle('is-active', t.dataset.arch === a.key));

        fades.forEach(f => f.classList.remove('out'));
      }, 460);
    }

    function tick(){
      if(paused) return;
      idx = (idx + 1) % ARCH_PREVIEWS.length;
      paint(idx);
    }

    function start(){
      stop();
      timer = setInterval(tick, 3600);
    }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }

    paint(0);
    // Pause when offscreen, resume when visible
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting) start(); else stop(); });
    }, { threshold: 0.2 });
    io.observe(card);

    // Pause on hover (desktop)
    card.addEventListener('mouseenter', () => { paused = true });
    card.addEventListener('mouseleave', () => { paused = false });

    // Click on archetype tag jumps the card
    tags.forEach((t, i) => {
      t.addEventListener('click', () => {
        const targetIdx = ARCH_PREVIEWS.findIndex(a => a.key === t.dataset.arch);
        if(targetIdx >= 0){ idx = targetIdx; paint(idx); start(); }
      });
      t.style.cursor = 'pointer';
    });
  }

  function open(){
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    if(state.finished){
      // Restart for repeat use
      state = { idx:0, answers:{}, score:{ wired:0, restless:0, light:0, fatigue:0 }, wiredSlider:5, finished:false };
      render();
    }
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  function setProgress(idx, total){
    progressText.textContent = `${String(idx+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
    progressFill.style.right = `${100 - ((idx) / total * 100)}%`;
  }

  function render(){
    const q = QUESTIONS[state.idx];
    setProgress(state.idx, QUESTIONS.length);
    backBtn.disabled = state.idx === 0;

    if(q.type === 'slider') renderSlider(q);
    else renderOptions(q);
  }

  function typewrite(el, text, speed = 22){
    el.innerHTML = '';
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'cursor-blink';
    el.appendChild(document.createTextNode(''));
    el.appendChild(cursor);
    const tick = () => {
      if(i < text.length){
        el.firstChild.nodeValue += text[i];
        i++;
        setTimeout(tick, speed);
      } else {
        cursor.remove();
      }
    };
    tick();
  }

  function renderOptions(q){
    const screen = document.createElement('div');
    screen.className = 'dx-screen';
    screen.innerHTML = `
      <div class="dx-q-eyebrow">${q.eyebrow}</div>
      <h2 class="dx-q-text" id="dx-qt"></h2>
      <p class="dx-q-hint">${q.hint}</p>
      <div class="dx-options" role="radiogroup">
        ${q.options.map((o,i) => `
          <button class="dx-option" role="radio" aria-selected="false" data-v="${o.v}">
            <span class="opt-check"></span>
            <span class="opt-text">${o.text}</span>
            <span class="opt-mono">${o.mono}</span>
          </button>
        `).join('')}
      </div>
    `;
    swap(screen);
    typewrite(screen.querySelector('#dx-qt'), q.text);

    const opts = screen.querySelectorAll('.dx-option');
    const previous = state.answers[q.id];
    opts.forEach(b => {
      if(previous === b.dataset.v) b.setAttribute('aria-selected','true');
      b.addEventListener('click', () => {
        opts.forEach(x => x.setAttribute('aria-selected','false'));
        b.setAttribute('aria-selected','true');
        state.answers[q.id] = b.dataset.v;
        nextBtn.disabled = false;
      });
    });

    nextBtn.disabled = !state.answers[q.id];
    nextBtn.querySelector('.arr')?.parentNode && (nextBtn.innerHTML = state.idx === QUESTIONS.length - 1
      ? `Reveal my profile <span class="arr">→</span>`
      : `Continue <span class="arr">→</span>`);
  }

  function renderSlider(q){
    const screen = document.createElement('div');
    screen.className = 'dx-screen';
    const v = state.wiredSlider;
    screen.innerHTML = `
      <div class="dx-q-eyebrow">${q.eyebrow}</div>
      <h2 class="dx-q-text" id="dx-qt"></h2>
      <p class="dx-q-hint">${q.hint}</p>
      <div class="dx-slider-wrap">
        <div class="dx-slider-value">
          <span class="num" id="dx-slider-num">${v}</span>
          <span class="of">/ 10 — ${describeWired(v)}</span>
        </div>
        <input type="range" min="1" max="10" value="${v}" class="dx-slider" id="dx-slider" />
        <div class="dx-slider-labels">
          <span>Calm</span>
          <span>Buzzing</span>
        </div>
      </div>
    `;
    swap(screen);
    typewrite(screen.querySelector('#dx-qt'), q.text);

    const slider = screen.querySelector('#dx-slider');
    const num = screen.querySelector('#dx-slider-num');
    const of = screen.querySelector('.dx-slider-value .of');
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      state.wiredSlider = val;
      num.textContent = val;
      of.textContent = `/ 10 — ${describeWired(val)}`;
    });
    nextBtn.disabled = false;
    nextBtn.innerHTML = `Continue <span class="arr">→</span>`;
  }

  function describeWired(v){
    if(v <= 3) return 'Settled';
    if(v <= 5) return 'Slightly humming';
    if(v <= 7) return 'Notably wired';
    return 'Fully buzzing';
  }

  function swap(newScreen){
    stage.querySelectorAll('.dx-screen').forEach(s => s.classList.remove('active'));
    stage.innerHTML = '';
    stage.appendChild(newScreen);
    requestAnimationFrame(() => newScreen.classList.add('active'));
  }

  function goNext(){
    const q = QUESTIONS[state.idx];

    if(q.type === 'options'){
      const opt = q.options.find(o => o.v === state.answers[q.id]);
      if(!opt) return;
      Object.entries(opt.tags || {}).forEach(([k,v]) => state.score[k] += v);
    } else if(q.type === 'slider'){
      const v = state.wiredSlider;
      if(v >= 7) state.score.wired += 3;
      else if(v >= 4) state.score.wired += 1;
      state.answers[q.id] = v;
    }

    if(state.idx < QUESTIONS.length - 1){
      state.idx++;
      render();
    } else {
      showThinking();
    }
  }

  function goBack(){
    if(state.idx === 0) return;

    // Roll back the score from the current question if it was already computed (only on next press)
    state.idx--;
    render();
  }

  function showThinking(){
    backBtn.disabled = true;
    nextBtn.disabled = true;
    progressText.textContent = 'SYNTHESIZING';
    progressFill.style.right = '0%';

    const screen = document.createElement('div');
    screen.className = 'dx-screen dx-thinking';
    screen.innerHTML = `
      <div class="moon-spin"></div>
      <p class="think-line" id="dx-think-line">${THINKING_LINES[0]}</p>
      <div class="think-mono"><span>Analyzing</span><span class="dotty"><span></span><span></span><span></span></span></div>
    `;
    swap(screen);

    let li = 0;
    const lineEl = screen.querySelector('#dx-think-line');
    const interval = setInterval(() => {
      li++;
      if(li >= THINKING_LINES.length){ clearInterval(interval); return; }
      lineEl.style.opacity = '0';
      setTimeout(() => { lineEl.textContent = THINKING_LINES[li]; lineEl.style.opacity = '1'; }, 280);
    }, 700);
    lineEl.style.transition = 'opacity .3s ease';

    setTimeout(() => { clearInterval(interval); showResult(); }, 2800);
  }

  function pickArchetype(){
    const s = state.score;
    const max = Math.max(s.wired, s.restless, s.light, s.fatigue);
    const totals = s.wired + s.restless + s.light + s.fatigue;

    // Multi-factor: if no clear winner (top is < 40% of total), recommend Mix
    if(max === 0 || (max / totals) < 0.40){
      return ARCHETYPES.holistic;
    }
    if(s.wired === max) return ARCHETYPES.wired;
    if(s.restless === max) return ARCHETYPES.restless;
    if(s.light === max) return ARCHETYPES.light;
    return ARCHETYPES.fatigue;
  }

  function showResult(){
    state.finished = true;
    const arch = pickArchetype();
    progressText.textContent = 'COMPLETE';
    nextBtn.style.display = 'none';
    backBtn.style.display = 'none';

    const blurb = arch.blurb({ wiredScore: state.wiredSlider });

    const screen = document.createElement('div');
    screen.className = 'dx-screen dx-result';
    screen.innerHTML = `
      <div class="res-eyebrow">Your sleep profile</div>
      <h2>${arch.title}.</h2>
      <p class="res-body">${blurb}</p>
      <p class="res-body" style="margin-top:14px">${arch.explain}</p>

      <div class="dx-rec">
        <div class="rec-thumb"><div class="rec-thumb-mark">${arch.flavorKey === 'mix' ? 'MIX' : 'DRIFT'}</div></div>
        <div class="rec-info">
          <div class="rec-flavor">${arch.flavor}</div>
          <span class="rec-plan">Subscribe · ${arch.flavorKey === 'mix' ? '$36/mo' : '$34/mo'} · Skip anytime</span>
        </div>
        <button class="btn btn-primary rec-cta" id="dx-add">Begin my ritual <span class="arr">→</span></button>
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

      <p class="dx-disclaim">Not medical advice — DRIFT is a dietary supplement. Consult your physician for sleep concerns.</p>
    `;
    swap(screen);

    document.getElementById('dx-add').addEventListener('click', () => {
      Cart.add(arch.sku, { flavor: arch.flavor });
      toast(`${arch.flavor} added — your ritual begins`, 'moon');
      closeModal();
      setTimeout(() => openCart && openCart(), 350);
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('dx-modal')) DX.init();
});
