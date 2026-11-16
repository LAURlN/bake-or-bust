/* Bake or Bust! — screens, input and presentation. Rules live in rules.js. */
(function () {
  'use strict';
  const BB = window.BB, ART = window.ART, FX = window.FX, SFX = window.SFX;

  // ---------------------------------------------------------------- persistence
  const SAVE = Object.assign({ best: 0, spiceUnlocked: 0, wins: 0, runs: 0, spice: 0, tutorialDone: false }, loadSave());
  function loadSave() { try { return JSON.parse(localStorage.getItem('bb_save') || '{}') || {}; } catch (e) { return {}; } }
  function persist() { try { localStorage.setItem('bb_save', JSON.stringify(SAVE)); } catch (e) { /* ignore */ } }

  SAVE.lifetime = Object.assign({served:0,exactLimitWins:0,maxBasket:0,phoenixSaves:0,act3:SAVE.wins>0,act2Boss:SAVE.wins>0,spiceWin:SAVE.spiceUnlocked>=2}, SAVE.lifetime);
  SAVE.unlockedSpells = [...new Set(['fan','eye','cluck'].concat((SAVE.unlockedSpells||[]).filter(id=>BB.SPELLS[id])))];
  SAVE.loadout = [...new Set((SAVE.loadout||['fan','eye','cluck']).filter(id=>SAVE.unlockedSpells.includes(id)))];
  ['fan','eye','cluck'].forEach(id=>{if(SAVE.loadout.length<3&&!SAVE.loadout.includes(id)) SAVE.loadout.push(id);});
  SAVE.loadout=SAVE.loadout.slice(0,3);
  SAVE.spiceUnlocked=Math.max(0,Math.min(9,Number(SAVE.spiceUnlocked)||0));
  SAVE.spice=Math.max(0,Math.min(SAVE.spiceUnlocked,Number(SAVE.spice)||0));
  function unlockSpells() {
    const l=SAVE.lifetime;
    const earned={baste:l.served>=25,chill:l.exactLimitWins>0,swap:l.act3||SAVE.wins>0,surge:l.spiceWin,wish:l.maxBasket>=16,ward:l.phoenixSaves>0||l.act2Boss};
    Object.keys(earned).forEach(id=>{if(earned[id]&&!SAVE.unlockedSpells.includes(id)) {SAVE.unlockedSpells.push(id); if(G.run) FX.float(640,130,'Spell unlocked: '+BB.SPELLS[id].name,'gold');}});
    persist();
  }
  function trackUnlocks() {
    const r=G.run;if(!r) return;
    SAVE.lifetime.maxBasket=Math.max(SAVE.lifetime.maxBasket,r.basket.length);
    SAVE.lifetime.act3=SAVE.lifetime.act3||r.act>=2; unlockSpells();
  }
  function spellbook(swap) {
    let selected=swap?G.run.spells.slice():SAVE.loadout.slice();let slot=0;
    const draw=()=>{
      openModal(box=>{
        box.append(h('h2',null,swap?'Preen: swap one spell':'Spellbook · choose 3'),
          h('p',{class:'muted'},swap?'Choose a slot, then an unlocked replacement. Gain +1 feather when confirmed.':'Click a selected spell to free a slot, then pick a replacement. F / E / C follow slot order.'),
          h('p',{class:'spell-slots'},selected.map((id,i)=>'['+['F','E','C'][i]+'] '+BB.SPELLS[id].name).join(' · ')));
        const grid=h('div',{class:'spell-grid'});
        if(swap)box.appendChild(h('p',{class:'muted'},'Replacing slot '+(slot+1)+' · '+BB.SPELLS[G.run.spells[slot]].name));
        if(swap) box.appendChild(h('div',{class:'row-center'},selected.map((id,i)=>btn('Slot '+(i+1)+': '+BB.SPELLS[id].name,{onClick:()=>{slot=i;selected=G.run.spells.slice();closeModal(true);draw();}}))));
        Object.entries(BB.SPELLS).forEach(([id,sp])=>{
          const unlocked=SAVE.unlockedSpells.includes(id),active=selected.includes(id);
          grid.appendChild(btn([pic(ART.spell(id),'charm-art'),h('b',null,sp.name),h('small',null,sp.cost+' feathers · '+(unlocked?sp.text:sp.hint||'Starter'))],{
            cls:'spell-choice'+(active?' picked':''),disabled:!unlocked,title:sp.text,onClick:()=>{
              if(swap) {if(active)return;selected=G.run.spells.slice();selected[slot]=id;}
              else if(active) selected=selected.filter(t=>t!==id);else if(selected.length<3)selected.push(id);else return;
              closeModal(true);draw();
            }}));
        });
        box.append(grid,btn(swap?'Confirm swap (+1 feather)':'Ready · '+selected.length+'/3', {cls:'primary',disabled:selected.length!==3||(swap&&selected.filter((id,i)=>id!==G.run.spells[i]).length!==1),onClick:()=>{
          if(swap){const changed=selected.filter((id,i)=>id!==G.run.spells[i]).length;if(changed!==1)return;G.run.spells=selected;G.run.feathers=Math.min(G.run.maxFeathers,G.run.feathers+1);closeModal(true);advance();}
          else {SAVE.loadout=selected;persist();closeModal();}
        }}));
      },{closable:true,cls:'wide'});
    };draw();
  }

  // ---------------------------------------------------------------- state
  const G = { run: null, scope: {}, building: null, modals: [], busy: false, scale: 1, scene: null, sceneSeed: 1, bake: null, hudPrev: {} };
  window.__BB = G; // handy for debugging / automated playtests

  const stage = document.getElementById('stage');
  const screenEl = document.getElementById('screen');
  const shakeEl = document.getElementById('shake');
  const hudEl = document.getElementById('hud');
  const bgCanvas = document.getElementById('bg');
  const fxCanvas = document.getElementById('fx');
  const sceneCache = document.createElement('canvas');
  FX.attach(fxCanvas);

  // ---------------------------------------------------------------- DOM helpers
  function h(tag, props) {
    const el = document.createElement(tag);
    if (props) for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach((k) => add(el, k)); return; }
    el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  const pic = (html, cls) => h('div', { class: cls || '', html });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const icon = (name, cls) => h('span', { class: 'ico ' + (cls || ''), html: ART.icon(name) });

  function normKey(k) {
    if (k === ' ' || k === 'Spacebar') return 'space';
    return k.toLowerCase();
  }
  function bindKey(keys, fn) {
    const scope = G.building || G.scope;
    keys.split(' ').forEach((k) => { scope[k] = fn; });
  }
  function keyLabel(k) {
    const map = { space: 'Space', enter: 'Enter', escape: 'Esc', arrowleft: '←', arrowright: '→' };
    return map[k] || k.toUpperCase();
  }

  function btn(label, o) {
    o = o || {};
    const el = h('button', { class: 'btn ' + (o.cls || ''), type: 'button', title: o.title });
    if (typeof label === 'string') el.innerHTML = label; else add(el, label);
    if (o.title && (o.cls || '').includes('hud-btn')) el.setAttribute('aria-label', o.title);
    if (o.key) el.appendChild(h('span', { class: 'key' }, keyLabel(o.key.split(' ')[0])));
    el.addEventListener('click', (e) => {
      if (el.disabled || (G.busy && !o.always)) return;
      if (e.detail > 0) el.blur();
      SFX.init();
      if (!o.silent) SFX.play('click');
      o.onClick && o.onClick(e);
    });
    if (o.key) bindKey(o.key, () => { if (!el.disabled && el.isConnected) el.click(); });
    if (o.disabled) el.disabled = true;
    return el;
  }

  function stagePos(el) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - s.left) / G.scale, y: (r.top + r.height / 2 - s.top) / G.scale, w: r.width / G.scale, h: r.height / G.scale };
  }

  // ---------------------------------------------------------------- input
  document.addEventListener('keydown', (e) => {
    SFX.init();
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const k = normKey(e.key);
    if (e.repeat) { if (k === 'space' || k === 'enter') e.preventDefault(); return; }
    const ae = document.activeElement;
    if (ae && ae.tagName === 'BUTTON' && (k === 'enter' || k === 'space')) return; // let the focused button act natively
    if (k === 'm') { toggleMute(); return; }
    if (k === 'n') { toggleMusic(); return; }
    const top = G.modals[G.modals.length - 1];
    const scope = top ? top.scope : G.scope;
    if (scope[k]) { e.preventDefault(); scope[k](); return; }
    if (top && top.closable && (k === 'escape' || k === top.closeKey)) { e.preventDefault(); closeModal(); return; }
    if (!top && k === 'b' && G.run && hudEl.classList.contains('show') && !G.busy) { openBasket(); return; }
  });
  document.addEventListener('pointerdown', () => SFX.init(), { capture: true });
  document.addEventListener('touchend', () => SFX.init(), { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => SFX.setHidden(document.hidden));
  SFX.setHidden(document.hidden);
  // A tap inspects passive info; a hold inspects actionable/disabled cards
  // without also buying, drawing or casting. Mouse/keyboard actions stay native.
  const tip = h('div', { id: 'touch-tip', role: 'status', hidden: true });
  document.body.appendChild(tip);
  let holdTimer, held = null, origin = null;
  const hideTip = () => { tip.hidden = true; };
  function showTip(el) {
    tip.textContent = el.title;
    tip.hidden = false;
  }
  document.addEventListener('pointerdown', e => {
    clearTimeout(holdTimer); held = null; hideTip();
    if (e.pointerType === 'mouse') return;
    const el = e.target.closest('[title]');
    if (!el || !el.title) return;
    origin = { x: e.clientX, y: e.clientY };
    if (!el.closest('button')) showTip(el);
    else holdTimer = setTimeout(() => { held = el.closest('button'); showTip(el); }, 500);
  }, { capture: true });
  document.addEventListener('pointermove', e => {
    if (origin && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 10) {
      clearTimeout(holdTimer); held = null; hideTip();
    }
  }, { passive: true });
  for (const name of ['pointerup', 'pointercancel']) document.addEventListener(name, () => {
    clearTimeout(holdTimer); origin = null;
  }, { capture: true });
  document.addEventListener('click', e => {
    if (held && held.contains(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); held = null; }
  }, { capture: true });
  document.addEventListener('contextmenu', e => {
    if (G.compact || held) e.preventDefault();
  });
  document.addEventListener('keydown', hideTip);
  document.addEventListener('focusin', e => {
    const el = e.target.closest('[title]');
    if (el && el.title && !el.closest('button')) showTip(el);
  });
  let lastHover = -Infinity;
  function hoverCue(e) {
    const target = e.target.closest('button');
    if (!target || target.disabled || G.busy || (e.relatedTarget && target.contains(e.relatedTarget))) return;
    if (performance.now() - lastHover < 100) return;
    lastHover = performance.now();
    SFX.play('hover');
  }
  document.addEventListener('pointerover', hoverCue);
  document.addEventListener('focusin', hoverCue);

  function toggleMute() { SFX.setMuted(!SFX.isMuted()); renderHudButtons(); }
  function toggleMusic() { SFX.setMusic(!SFX.isMusicOn()); renderHudButtons(); }

  // ---------------------------------------------------------------- layout / scaling
  function fit() {
    G.compact = window.matchMedia('(max-width: 1100px), (pointer: coarse)').matches;
    document.documentElement.classList.toggle('compact-ui', G.compact);
    hideTip();
    const s = G.compact ? 1 : Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    G.scale = s;
    stage.style.transform = G.compact ? 'none' : 'translate(-50%, -50%) scale(' + s + ')';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // Background art can stretch; text stays native CSS. Avoid repainting a
    // desktop-sized bitmap every frame on a phone's GPU.
    const bgScale = G.compact ? Math.min(1, stage.clientWidth / 1280) : s;
    bgCanvas.width = Math.round(1280 * bgScale * dpr); bgCanvas.height = Math.round(720 * bgScale * dpr);
    sceneCache.width = bgCanvas.width; sceneCache.height = bgCanvas.height;
    FX.resize(s, G.compact ? stage.clientWidth : 1280, G.compact ? stage.clientHeight : 720);
    if (G.scene) ART.paintScene(sceneCache, G.scene, G.sceneSeed);
  }
  window.addEventListener('resize', fit);

  function setScene(key) {
    if (key === G.scene) return;
    G.scene = key;
    ART.paintScene(sceneCache, key, G.sceneSeed);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const c = bgCanvas.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(sceneCache, 0, 0);
    ART.ambient(c, G.scene, now / 1000, bgCanvas.width / 1280);
    FX.update(dt, shakeEl);
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- screens & modals
  function setScreen(name, build, opts) {
    opts = opts || {};
    while (G.modals.length) closeModal(true);
    G.scope = {};
    G.building = G.scope;
    G.busy = false;
    screenEl.innerHTML = '';
    screenEl.dataset.screen = name;
    screenEl.scrollTop = 0;
    hideTip();
    stage.classList.toggle('has-hud', !!opts.hud);
    SFX.setHeat(0);
    screenEl.classList.remove('enter'); void screenEl.offsetWidth; screenEl.classList.add('enter');
    build(screenEl);
    G.building = null;
    hudEl.classList.toggle('show', !!opts.hud);
    if (opts.hud) updateHud(); else renderCharms();
    if (opts.scene) setScene(opts.scene);
    if (opts.music) SFX.music(opts.music);
  }

  function openModal(build, o) {
    o = o || {};
    const m = { scope: {}, closable: !!o.closable, closeKey: o.closeKey, onClose: o.onClose };
    const prev = G.building;
    G.building = m.scope;
    const box = h('div', { class: 'modal-box ' + (o.cls || ''), role: 'dialog', 'aria-modal': 'true' });
    m.el = h('div', { class: 'modal' }, box);
    if (o.closable) box.appendChild(btn('✕', { cls: 'close-x', key: 'escape', always: true, onClick: () => closeModal() }));
    build(box, m);
    G.building = prev;
    stage.appendChild(m.el);
    G.modals.push(m);
    return m;
  }
  function closeModal(silent) {
    const m = G.modals.pop();
    if (!m) return;
    m.el.classList.add('out');
    setTimeout(() => m.el.remove(), 180);
    if (!silent && m.onClose) m.onClose();
  }

  // ---------------------------------------------------------------- HUD
  function updateHud() {
    const r = G.run;
    if (!r) return;
    const prev = G.hudPrev;
    hudEl.innerHTML = '';
    const hearts = h('div', { class: 'hud-hearts', id: 'hud-hearts' });
    for (let i = 0; i < r.maxHearts; i++) hearts.appendChild(icon(i < r.hearts ? 'heart' : 'heartEmpty', 'heart-ico'));
    const stat = (id, ic, val, tip) => h('div', { class: 'hud-stat', id, title: tip }, icon(ic), h('b', null, val));
    const act = BB.ACTS[Math.min(r.act, 2)];
    const where = h('div', { class: 'hud-where' }, h('b', null, act.name), h('span', null, r.step >= BB.STEPS_PER_ACT ? ' · Boss' : ' · Stop ' + (r.step + 1) + ' of ' + BB.STEPS_PER_ACT));
    const left = h('div', { class: 'hud-left' }, hearts,
      stat('hud-corn', 'corn', r.corn, 'Corn — money for the market'),
      stat('hud-feathers', 'feather', r.feathers + '/' + r.maxFeathers, 'Magic feathers — spend on spells while baking'),
      stat('hud-limit', 'thermo', r.limit, 'Oven heat limit — above this the bake burns'));
    const basketBtn = btn([icon('basket'), h('b', null, String(r.basket.length))], { cls: 'hud-btn', title: 'View your egg basket (B)', onClick: () => openBasket() });
    basketBtn.appendChild(h('span', { class: 'key' }, 'B'));
    const right = h('div', { class: 'hud-right' }, basketBtn, h('span', { id: 'hud-sound' }));
    hudEl.append(left, where, right);
    renderCharms(); trackUnlocks();
    renderHudButtons();
    // bump animations
    const bump = (id, v) => { if (prev[id] != null && prev[id] !== v) { const el = document.getElementById(id); if (el) { el.classList.add(v > prev[id] ? 'bump-up' : 'bump-down'); } } prev[id] = v; };
    bump('hud-corn', r.corn); bump('hud-feathers', r.feathers); bump('hud-hearts', r.hearts); bump('hud-limit', r.limit);
  }
  function renderCharms() {
    let ribbon=document.getElementById('charm-ribbon');
    if(!ribbon){ribbon=h('div',{id:'charm-ribbon'});stage.appendChild(ribbon);}
    const visible=G.run&&['road','order','bake','market','nest','act','boss','mystery','dessert'].includes(screenEl.dataset.screen);
    ribbon.hidden=!visible;
    if(!visible)return;
    ribbon.replaceChildren(h('small',null,'Kitchen Charms'));
    G.run.charms.forEach(id=>ribbon.appendChild(h('div',{class:'charm-badge','data-charm':id,tabindex:0,title:BB.CHARMS[id].name+' · '+BB.CHARMS[id].text},pic(ART.charm(id),'charm-art'))));
    if(!G.run.charms.length)ribbon.appendChild(h('small',null,'Find charms at markets and bosses.'));
  }
  function showTriggers() {
    const b=G.bake;if(!b)return;
    const events=b.triggers.splice(0);const ids=[...new Set(events.map(e=>e.id).filter(Boolean))];
    ids.forEach(id=>{const badge=document.querySelector('[data-charm="'+id+'"]');if(badge){badge.classList.remove('proc');void badge.offsetWidth;badge.classList.add('proc');}});
    events.forEach((ev,i)=>{G.run.stats.charmTriggers+=ev.id?1:0;setTimeout(()=>FX.float(640,310+(i%4)*30,ev.text,'gold'),i*120);});
    if(events.length)SFX.play('magic');
  }
  function bossAhead(compact) {
    const r=G.run,key=r.actBosses[r.act],b=BB.BOSSES[key];
    return h('div',{class:'boss-ahead'+(compact?' compact':''),title:BB.bossRule(r,key)},pic(ART.critter(b.look),'ahead-portrait'),
      h('div',null,h('b',null,'Boss Ahead · '+b.name),h('small',null,b.title),h('small',null,BB.bossRule(r,key))));
  }
  function orderRule(opt) {
    const c=BB.CUSTOMERS[opt.customer],q=opt.quirk?BB.QUIRKS[opt.quirk]:null;
    return [opt.signature&&c.signature?c.signature.name+': '+c.signature.text:null,q?q.name+': '+q.text:null].filter(Boolean).join(' · ');
  }
  function renderHudButtons() {
    const holder = document.getElementById('hud-sound');
    const mk = () => [
      btn([icon(SFX.isMusicOn() ? 'music' : 'musicOff')], { cls: 'hud-btn icon-only', title: 'Music on/off (N)', always: true, onClick: toggleMusic }),
      btn([icon(SFX.isMuted() ? 'soundOff' : 'soundOn')], { cls: 'hud-btn icon-only', title: 'Mute all sound (M)', always: true, onClick: toggleMute }),
    ];
    if (holder) { holder.innerHTML = ''; mk().forEach((b) => holder.appendChild(b)); }
    const t = document.getElementById('title-sound');
    if (t) { t.innerHTML = ''; mk().forEach((b) => t.appendChild(b)); }
  }

  function flyCorn(fromEl, n) {
    const target = document.getElementById('hud-corn');
    if (!target || !fromEl) return;
    const a = stagePos(fromEl), b = stagePos(target);
    const count = Math.min(12, Math.max(1, Math.round(n / 2)));
    for (let i = 0; i < count; i++) {
      const el = h('div', { class: 'fly-corn', html: ART.icon('corn') });
      el.style.left = a.x - 12 + (Math.random() - 0.5) * 60 + 'px';
      el.style.top = a.y - 12 + (Math.random() - 0.5) * 40 + 'px';
      document.getElementById('flyers').appendChild(el);
      const dx = b.x - parseFloat(el.style.left) - 12, dy = b.y - parseFloat(el.style.top) - 12;
      const anim = el.animate([
        { transform: 'translate(0,0) scale(.6)', opacity: 0 },
        { transform: 'translate(' + dx * 0.3 + 'px,' + (dy * 0.3 - 60) + 'px) scale(1.1)', opacity: 1, offset: 0.35 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.7)', opacity: 1 },
      ], { duration: 650 + i * 45, easing: 'cubic-bezier(.5,0,.6,1)', delay: i * 40, fill: 'both' });
      anim.onfinish = () => { el.remove(); SFX.play('coin', 0); };
    }
  }

  // ---------------------------------------------------------------- shared widgets
  function eggChip(type, extra) {
    return h('div', { class: 'egg-chip ' + (extra || '') }, pic(ART.egg(type), 'egg-pic'));
  }
  function eggStats(type, mods) {
    const E = BB.EGGS[type];
    const puff = type === 'thunder' ? 'X' : (E.puff >= 0 ? '+' + E.puff : String(E.puff));
    const heat = E.heat > 0 ? '+' + E.heat : String(E.heat);
    return h('span', { class: 'egg-stats' }, h('span', { class: 'st-puff' }, puff + ' puff'), h('span', { class: 'st-heat' + (E.heat < 0 ? ' cool' : E.heat === 0 ? ' zero' : '') }, heat + ' heat'));
  }
  function bubble(text, cls) { return h('div', { class: 'bubble ' + (cls || ''), html: text }); }

  function openBasket(mode) {
    const r = G.run;
    openModal((box, m) => {
      const crack = mode && mode.crack;
      box.appendChild(h('h2', null, crack ? 'Crack which egg?' : 'Your Egg Basket'));
      const counts = BB.countBasket(r.basket);
      let heat = 0; for (const t of r.basket) heat += BB.EGGS[t].heat;
      box.appendChild(h('p', { class: 'muted' }, crack ? 'Pay ' + mode.price + ' corn to remove one egg for good.' : r.basket.length + ' eggs · total heat ' + heat + ' · oven limit ' + r.limit + '. Every bake draws from a freshly shuffled basket.'));
      const grid = h('div', { class: 'basket-grid' });
      BB.EGG_ORDER.forEach((t) => {
        if (!counts[t]) return;
        const row = h(crack ? 'button' : 'div', { class: 'basket-row' + (BB.EGGS[t].curse ? ' curse' : ''), type: crack ? 'button' : null },
          eggChip(t), h('div', { class: 'br-text' }, h('div', { class: 'br-name' }, BB.EGGS[t].name, h('span', { class: 'br-count' }, '×' + counts[t])), eggStats(t), h('div', { class: 'br-desc' }, BB.EGGS[t].desc)));
        if (crack) row.addEventListener('click', () => { closeModal(true); mode.onPick(t); });
        grid.appendChild(row);
      });
      box.appendChild(grid);
      if (crack) box.appendChild(btn('Never mind', { cls: 'ghost', key: 'escape', always: true, onClick: () => closeModal() }));
    }, { closable: !mode, closeKey: 'b', cls: 'wide' });
  }

  function openHowTo() {
    openModal((box) => {
      box.appendChild(h('h2', null, 'How to Bake (and not Bust)'));
      const li = (html) => h('li', { html });
      box.appendChild(h('div', { class: 'howto' },
        h('ul', null,
          li('<b>Goal:</b> travel through three lands, bake for the creatures you meet, and beat <b>Baron Velvetpaw</b> in his Grand Bake to win back the Golden Egg.'),
          li('<b>Baking is a gamble.</b> Draw eggs one at a time from your shuffled basket. Each egg adds <span class="t-puff">puff</span> (score) and most add <span class="t-heat">heat</span>.'),
          li('Reach the customer\'s <b>target puff</b>, then <b>Serve</b>. Every puff above the target is paid as a tip.'),
          li('If heat goes <b>above your oven\'s limit</b>, the bake <b>BURNS</b>: you lose a heart and a Rotten Egg joins your basket. Stopping short also costs a heart, but nothing rots.'),
          li('The panel on the right shows exactly which eggs are left and your <b>burn chance</b> for the next draw.'),
          li('Spend <b>magic feathers</b> on spells (Wing Fan, Hen\'s Eye, Golden Cluck — plus 6 more unlockable spells in your Spellbook) and collect passive <b>Kitchen Charms</b> at markets, bosses, and mysteries.'),
          li('On the road, pick your path: orders, markets (buy eggs, charms, upgrade the oven, temper or crack eggs), Sizzle Dice (burn on 1 or over 21°, up to 3 hands, +30 corn cap), nests and mysteries. Lose all hearts and the adventure ends.'),
          li('Win to unlock a hotter <b>Spice level</b> (0–9) for the next run.')),
        h('div', { class: 'controls' }, h('h3', null, 'Controls'),
          h('p', { html: '<b>Touch</b>: tap to play. Tap eggs, charms or stats for info; hold a card for info without choosing it. Scroll panels for more.<br><br><b>Mouse</b>: click everything.<br><b>Space</b> draw an egg · <b>Enter</b> serve / continue<br><b>F / E / C</b> cast your three equipped spells · <b>T</b> toss a peeked egg<br><b>1–4</b> pick options · <b>B</b> basket · <b>Esc</b> close<br><b>M</b> mute · <b>N</b> music on/off' }))));
      box.appendChild(btn('Got it', { cls: 'primary', key: 'enter', always: true, onClick: () => closeModal() }));
    }, { closable: true, cls: 'wide' });
  }

  // ---------------------------------------------------------------- Title
  function showTitle() {
    G.run = null;
    G.sceneSeed = 5;
    setScreen('title', (s) => {
      const spiceRow = h('div', { class: 'spice-row' });
      const renderSpice = () => {
        spiceRow.innerHTML = '';
        const lv = SAVE.spice;
        const prevB = btn('‹', { cls: 'arrow', always: true, onClick: () => { if (SAVE.spice > 0) { SAVE.spice--; persist(); renderSpice(); } } });
        const nextB = btn('›', { cls: 'arrow', always: true, onClick: () => { if (SAVE.spice < SAVE.spiceUnlocked) { SAVE.spice++; persist(); renderSpice(); } } });
        prevB.disabled = lv <= 0; nextB.disabled = lv >= SAVE.spiceUnlocked;
        const peppers = h('span', { class: 'peppers' });
        for (let i = 0; i < 9; i++) peppers.appendChild(h('span', { class: 'pep' + (i < lv ? ' on' : '') }, '●'));
        spiceRow.append(prevB, h('div', { class: 'spice-label',title:BB.SPICE.slice(0,lv+1).map(x=>x.text).join(' ') }, h('b', null, 'Spice: ' + BB.SPICE[lv].name), peppers, h('small', null, BB.SPICE[lv].text + (SAVE.spiceUnlocked < 9 ? ' (Win to unlock ' + BB.SPICE[SAVE.spiceUnlocked + 1].name + ')' : ''))), nextB);
      };
      G.building = G.scope;
      bindKey('arrowleft', () => spiceRow.querySelector('.arrow').click());
      bindKey('arrowright', () => spiceRow.querySelectorAll('.arrow')[1].click());
      renderSpice();
      s.append(
        h('div', { class: 'title-art' },
          pic(ART.oven(), 'title-oven'),
          pic(ART.hen({ mood: 'happy' }), 'title-hen bob'),
          h('div', { class: 'title-eggs' }, ['yolk', 'pepper', 'moon', 'frost', 'thunder'].map((t, i) => pic(ART.egg(t), 'title-egg te' + i)))),
        h('div', { class: 'title-panel' },
          h('div', { class: 'logo' }, h('span', { class: 'l1' }, 'Bake'), h('span', { class: 'l2' }, 'or'), h('span', { class: 'l3' }, 'Bust!')),
          h('div', { class: 'tagline' }, 'a magic chicken bake gamble adventure'),
          h('div', { class: 'menu' },
            btn('Begin the Adventure', { cls: 'primary big', key: 'enter', onClick: startRun }),
            btn('How to Play', { cls: 'ghost', key: 'h', always: true, onClick: openHowTo }),
            spiceRow,
            SAVE.unlockedSpells.length>=4?h('div',{class:'row-center spell-menu'},btn('Spellbook (3/3)',{onClick:()=>spellbook(false)}),btn('Randomize',{onClick:()=>{SAVE.loadout=BB.makeRng(Date.now()).shuffle(SAVE.unlockedSpells.slice()).slice(0,3);persist();spellbook(false);}})):null),
          h('div', { class: 'title-foot' },
            h('span', null, 'Best score ' + SAVE.best + ' · Wins ' + SAVE.wins + ' · Runs ' + SAVE.runs),
            h('span', { id: 'title-sound' }))));
      renderHudButtons();
    }, { scene: 'title', music: 'title', hud: false });
  }

  // ---------------------------------------------------------------- Run flow
  function startRun() {
    const seed = (Math.random() * 1e9) | 0;
    G.run = BB.newRun(seed, SAVE.spice);
    G.run.spells = SAVE.loadout.slice();
    G.hudPrev = {};
    G.sceneSeed = seed % 1000;
    SAVE.runs++; persist();
    showIntro();
  }

  function showIntro() {
    setScreen('intro', (s) => {
      s.append(h('div', { class: 'story' },
        h('div', { class: 'story-art' }, pic(ART.critter(BB.BOSSES.fox.look), 'story-fox'), pic(ART.goldenEgg(), 'story-egg glow'), pic(ART.hen({ mood: 'shock' }), 'story-hen')),
        h('div', { class: 'story-text' },
          h('h2', null, 'The Golden Egg is gone!'),
          h('p', null, 'Baron Velvetpaw, the slyest fox in the land, has stolen Clover Meadow\'s Golden Egg — and he will only give it back to a baker who can win his Grand Bake.'),
          h('p', null, 'Marigold is a hen with a wizard\'s hat and a Wishing Oven that bakes eggs into pure magic. The oven is temperamental. Every bake is a gamble.'),
          h('p', null, 'Travel to his keep. Bake for the creatures on the road. Gather corn and stranger eggs. Then out-bake a fox.'),
          btn('Set off down the road', { cls: 'primary big', key: 'enter space', onClick: () => showActIntro() }))));
    }, { scene: 'meadow', music: 'road', hud: false });
  }

  const ACT_TEXT = [
    'Rolling hills, hungry neighbours — and a stern judge waiting at the meadow gate.',
    'The trees here whisper recipes. A strange host waits beneath their branches.',
    'Golden windows, silver forks, and one stolen egg. The Baron is waiting.',
  ];
  function actScene() { return BB.ACTS[G.run.act].key; }
  function actMusic() { return ['road', 'woods', 'castle'][G.run.act]; }

  function showActIntro() {
    const r = G.run;
    setScreen('act', (s) => {
      s.append(h('div', { class: 'act-card' },
        h('div', { class: 'act-num' }, 'Act ' + ['I', 'II', 'III'][r.act]),
        h('h1', null, BB.ACTS[r.act].name),
        h('p', null, ACT_TEXT[r.act]), bossAhead(false),
        btn('Onward', { cls: 'primary big', key: 'enter space', onClick: showRoad })));
      SFX.play('whoosh');
    }, { scene: actScene(), music: actMusic(), hud: true });
  }

  function advance() {
    const r = G.run;
    if (r.hearts <= 0) { showEnd(false); return; }
    r.step++;
    r.choices = null;
    if (r.step > BB.STEPS_PER_ACT) {
      r.act++; r.step = 0;
      if (r.act >= 3) { showEnd(true); return; }
      if(BB.hasCharm(r,'brooch')){r.feathers=Math.min(r.maxFeathers,r.feathers+1);FX.float(640,130,'Quill Brooch · +1 feather for the new act!','gold');}
      showActIntro();
      return;
    }
    showRoad();
  }

  // ---------------------------------------------------------------- Road
  const KIND_INFO = {
    market: { title: 'Market', sub: 'Buy eggs, upgrade your oven, crack bad eggs.', icon: 'market' },
    den: { title: 'Gambling Den', sub: 'Sizzle Dice: push to 21°. Three hands, +30 corn profit cap.', icon: 'den' },
    nest: { title: 'Cozy Nest', sub: 'Rest, preen, or hatch a better egg.', icon: 'nest' },
    mystery: { title: 'Mystery', sub: 'Something strange is on the road ahead…', icon: 'mystery' },
  };

  function showRoad() {
    const r = G.run;
    if (!r.choices) r.choices = BB.genChoices(r);
    setScreen('road', (s) => {
      s.appendChild(bossAhead(true));
      // progress trail
      const trail = h('div', { class: 'trail' });
      for (let i = 0; i <= BB.STEPS_PER_ACT; i++) {
        trail.appendChild(h('div', { title:i===BB.STEPS_PER_ACT?BB.bossRule(r,r.actBosses[r.act]):'', class: 'trail-dot' + (i < r.step ? ' done' : i === r.step ? ' here' : '') + (i === BB.STEPS_PER_ACT ? ' boss' : '') }, i === BB.STEPS_PER_ACT ? '★' : String(i + 1)));
        if (i < BB.STEPS_PER_ACT) trail.appendChild(h('div', { class: 'trail-line' + (i < r.step ? ' done' : '') }));
      }
      const isBoss = r.choices[0].kind === 'boss';
      s.append(h('div', { class: 'road-head' },
        h('h2', null, isBoss ? 'The road ends at a showdown…' : 'A fork in the road'),
        h('p', { class: 'muted' }, isBoss ? 'There is only one way forward.' : 'Choose where Marigold goes next.'),
        trail));
      const cards = h('div', { class: 'road-cards n' + r.choices.length });
      r.choices.forEach((opt, i) => {
        let art, title, sub, tag = null, foot = null;
        if (opt.kind === 'order') {
          const c = BB.CUSTOMERS[opt.customer];
          art = pic(ART.critter(c.look), 'card-portrait');
          title = c.name;
          tag = opt.quirk ? h('div', { class: 'quirk-tag', title: BB.QUIRKS[opt.quirk].text }, BB.QUIRKS[opt.quirk].name) : h('div', { class: 'quirk-tag plain' }, 'Order');
          sub = [h('div', null, 'Wants a ' + opt.pastry + '.'), orderRule(opt)?h('div',{class:'card-quirk'},orderRule(opt)):null];
          foot = h('div', { class: 'card-targets' }, 'Targets ' + BB.orderTiers(r, opt).map((t) => t.target).join(' · ') + ' puff');
        } else if (opt.kind === 'boss') {
          const b = BB.BOSSES[opt.boss];
          art = pic(ART.critter(b.look), 'card-portrait');
          title = b.name; sub = b.title; tag = h('div', { class: 'quirk-tag boss' }, 'Boss');
        } else {
          const k = KIND_INFO[opt.kind];
          art = pic(ART.place(k.icon), 'card-portrait place');
          title = k.title; sub = k.sub;
        }
        const card = btn([h('div', { class: 'sign-post' }), art, tag, h('div', { class: 'card-title' }, title), h('div', { class: 'card-sub' }, sub), foot], {
          cls: 'road-card kind-' + opt.kind, key: String(i + 1), onClick: () => chooseRoad(opt, card),
        });
        card.style.animationDelay = (i * 0.08) + 's';
        cards.appendChild(card);
      });
      s.appendChild(cards);
      s.appendChild(pic(ART.hen(), 'road-hen walk'));
      if (r.step === 0 && r.act === 0 && !SAVE.tutorialDone) s.appendChild(h('div', { class: 'hint-pill' }, 'Tip: click a card or press its number key. Press B any time to look in your basket.'));
    }, { scene: actScene(), music: actMusic(), hud: true });
  }

  function chooseRoad(opt, card) {
    G.busy = true;
    card.classList.add('chosen');
    SFX.play('step');
    setTimeout(() => {
      G.busy = false;
      if (opt.kind === 'order') showOrder(opt);
      else if (opt.kind === 'market') showMarket();
      else if (opt.kind === 'den') showDen();
      else if (opt.kind === 'nest') showNest();
      else if (opt.kind === 'mystery') showMystery();
      else if (opt.kind === 'boss') showBossIntro(opt.boss, 0);
    }, 260);
  }

  // ---------------------------------------------------------------- Order
  function showOrder(opt) {
    const r = G.run;
    const c = BB.CUSTOMERS[opt.customer];
    const tiers = BB.orderTiers(r, opt);
    setScreen('order', (s) => {
      const q = opt.quirk ? BB.QUIRKS[opt.quirk] : null;
      s.append(h('div', { class: 'order-left' },
        pic(ART.critter(c.look), 'big-portrait pop-in'),
        h('div', { class: 'nameplate' }, c.name)));
      s.append(h('div', { class: 'order-right' },
        bubble('“' + c.line + ' Could you bake me a <b>' + opt.pastry + '</b>?”', 'speech'),
        orderRule(opt) ? h('div', { class: 'quirk-box' }, orderRule(opt)) : h('div', { class: 'quirk-box plain' }, 'No special wishes. Just make it puffy.'),
        h('h3', { class: 'pick-title' }, 'How ambitious will you be?'),
        h('div', { class: 'tier-cards' }, tiers.filter(t=>!(opt.signature&&opt.customer==='lynx'&&t.tier===0)).map((t) => {
          const i=t.tier;
          const order = BB.makeOrder(r, opt, i);
          const odds = BB.estimateOdds(r, order, 500);
          const pct = Math.round(odds * 100);
          const bonus = t.feathers ? '+1 magic feather' : t.eggPrize ? '+ pick a rare egg' : 'No bonus';
          return btn([
            h('div', { class: 'tier-name' }, BB.TIERS[i].name),
            h('div', { class: 'tier-target' }, h('span', { class: 'big-num' }, String(t.target)), h('span', null, ' puff')),
            h('div', { class: 'tier-reward' }, icon('corn'), ' ' + t.reward + ' corn + tips'),
            h('div', { class: 'tier-bonus' }, bonus),
            h('div', { class: 'odds', title: BB.ODDS_POLICY }, h('div', { class: 'odds-bar' }, h('i', { style: 'width:' + pct + '%;background:' + oddsColor(odds) })), h('span', null, 'Est. odds ≈' + pct + '% · no spells')),
          ], { cls: 'tier-card t' + i, key: String(i + 1), onClick: () => startBake(order, (sum) => advance()) });
        })),
        h('div', { class: 'order-note' }, 'Failing costs 1 heart. ' + BB.ODDS_POLICY)));
      SFX.play('cluck');
    }, { scene: actScene(), music: actMusic(), hud: true });
  }
  function oddsColor(p) { return p >= 0.7 ? '#5fae55' : p >= 0.45 ? '#f0b43a' : '#e8403a'; }

  // ---------------------------------------------------------------- Bake
  const BK = {}; // element refs for the bake screen

  function startBake(order, after) {
    const r = G.run;
    const bake = BB.newBake(r, order);
    G.bake = bake;
    G.bakeAfter = after;
    const boss = order.kind === 'boss' ? BB.BOSSES[order.boss] : null;
    const who = boss ? boss : BB.CUSTOMERS[order.customer];
    setScreen('bake', (s) => {
      const content = h('div', { class: 'bake-content' });
      s.appendChild(content);
      // left: customer
      const rule = [(boss?order.rule:orderRule(order)),r.spice>=7&&r.act>=1?'Spice: start +1° hotter.':'',r.spice>=8?(boss?'Spice: Rotten Eggs add +3°.':'Spice: at most 8 oven eggs; Rotten Eggs add +3°.'):'' ].filter(Boolean).join(' · ');
      const courseRow = boss && !!boss.courses ? h('div', { class: 'courses' }, [0, 1, 2].map((i) => h('span', { class: 'course' + (i === order.course ? ' now' : '') + (G.run.courses[i] === true ? ' won' : G.run.courses[i] === false ? ' lost' : '') }, boss.courses[i].name))) : null;
      BK.portrait = pic(ART.critter(who.look), 'bake-portrait');
      content.appendChild(h('div', { class: 'bake-left panel' },
        BK.portrait,
        h('div', { class: 'bl-name' }, who.name),
        h('div', { class: 'bl-wants' }, order.courseName ? 'Course: ' + order.courseName : 'wants a ' + order.pastry),
        courseRow,
        h('div', { class: 'target-box' }, h('small', null, 'TARGET'), h('span', { class: 'big-num' }, String(order.target)), h('small', null, 'puff')),
        h('div', { class: 'bl-pay' }, icon('corn'), ' Pays ' + order.reward + ' + tips'),
        rule ? h('div', { class: 'bl-rule', html: rule }) : null,
        h('div', { class: 'bl-risk' }, 'Fail: −' + order.heartLoss + ' heart' + (order.heartLoss > 1 ? 's' : ''))));
      // center: tray, puff bar, oven, heat meter
      BK.tray = h('div', { class: 'tray', tabindex: '0', 'aria-label': 'Oven egg tray. Scroll for more eggs.' });
      for (let i = 0; i < 16; i++) BK.tray.appendChild(h('div', { class: 'slot' }));
      BK.puffFill = h('div', { class: 'pb-fill' });
      BK.puffMark = h('div', { class: 'pb-mark' }, h('span', null, 'target'));
      BK.puffText = h('div', { class: 'pb-text' });
      BK.oven = pic(ART.oven(), 'oven-wrap');
      BK.heat = h('div', { class: 'heat-meter' });
      BK.heatText = h('div', { class: 'heat-text' });
      BK.status = h('div', { class: 'bake-status' });
      BK.buff=h('div',{class:'next-buff'});
      content.appendChild(h('div', { class: 'bake-center' },
        h('div', { class: 'tray-wrap' }, h('div', { class: 'tray-label' }, 'In the oven'), BK.tray),
        h('div', { class: 'puff-bar' }, icon('puff'), h('div', { class: 'pb-track' }, BK.puffFill, BK.puffMark), BK.puffText),
        h('div', { class: 'oven-row' }, h('div', { class: 'heat-col' }, BK.heatText, BK.heat, h('div', { class: 'heat-label' }, 'HEAT')), BK.oven),
        BK.buff, BK.status));
      // right: basket & magic
      BK.bagCount = h('b');
      BK.bagList = h('div', { class: 'bag-list' });
      BK.burn = h('div', { class: 'burn-box' });
      BK.peek = h('div', { class: 'peek-box' });
      BK.basketIcon = icon('basket', 'bag-ico');
      BK.spells = h('div', { class: 'spells' });
      content.appendChild(h('div', { class: 'bake-right panel' },
        h('div', { class: 'br-head' }, BK.basketIcon, h('span', null, 'Basket: '), BK.bagCount, h('span', null, ' eggs left')),
        BK.bagList, BK.burn, BK.peek,
        h('div', { class: 'spell-head' }, icon('feather'), ' Magic'), BK.spells));
      // actions
      BK.drawBtn = btn('Draw an Egg', { cls: 'primary huge draw', key: 'space d', onClick: doDraw });
      BK.serveBtn = btn('Serve!', { cls: 'go huge serve', key: 'enter s', onClick: doServe });
      BK.readout = h('div', { class: 'bake-readout', 'aria-live': 'polite' });
      s.appendChild(h('div', { class: 'bake-actions' }, BK.readout, BK.drawBtn, BK.serveBtn));
      BK.hint = h('div', { class: 'tut hidden' });
      content.appendChild(BK.hint);
    }, { scene: actScene(), music: boss ? 'boss' : 'bake', hud: true });
    // spells (bound in the screen scope)
    G.building = G.scope;
    BK.spellBtns = {};
    r.spells.forEach((id,i) => {
      const k=['f','e','c'][i];
      const sp = BB.SPELLS[id];
      const b = btn([h('span', { class: 'sp-name' }, pic(ART.spell(id),'spell-icon'), sp.name), h('span', { class: 'sp-cost' }, sp.cost + '', icon('feather')), h('span', { class: 'sp-text' }, sp.text)], { cls: 'spell', key: k, onClick: () => doCast(id) });
      BK.spellBtns[id] = b;
      BK.spells.appendChild(b);
    });
    G.building = null;
    refreshBake();
    if (boss) SFX.play('boss');
  }

  function refreshBake(fresh) {
    const b = G.bake, r = G.run;
    if (!b) return;
    const puff = BB.bakePuff(b);
    BK.buff.textContent=[b.nextMult>1?'×'+b.nextMult+' puff':'',b.nextBonus?'+'+b.nextBonus+' puff':'',b.ward?'Phoenix Plume guarding next draw':''].filter(Boolean).join(' · ');
    if(b.nextMult>1||b.nextBonus)BK.buff.textContent='Next egg: '+BK.buff.textContent;
    // tray
    ensureTraySlots(b.oven.length);
    const slots = BK.tray.children;
    for (let i = 0; i < slots.length; i++) {
      const e = b.oven[i];
      const slot = slots[i];
      slot.classList.toggle('chaos', !!b.mods.fizzChaos&&(i+1)%3===0);
      slot.title=b.mods.fizzChaos&&(i+1)%3===0?'Chaos: this egg gets ×2 puff and +1°':'';
      if (!e) { if (slot.dataset.t) { slot.innerHTML = ''; delete slot.dataset.t; } continue; }
      slot.title=BB.EGGS[e.type].name+' · '+e.puff+' final puff · '+e.heat+'° heat. '+BB.EGGS[e.type].desc+(e.spent?' Guard spent.':'')+(slot.classList.contains('chaos')?' Chaos slot: ×2 puff / +1°.':'');
      const key = e.type + ':' + e.puff + ':' + (e.spent ? 1 : 0) + (e.burner ? 'b' : '');
      if (slot.dataset.t === key) continue;
      const isNew = !slot.dataset.t;
      slot.dataset.t = key;
      slot.innerHTML = '';
      slot.appendChild(h('div', { class: 'slot-egg' + (isNew && !fresh ? ' land' : '') + (e.spent ? ' spent' : '') + (e.burner ? ' burner' : '') + (e.clucked ? ' clucked' : '') },
        pic(ART.egg(e.type), 'egg-pic'),
        h('span', { class: 'sl-puff' + (e.puff < 0 ? ' neg' : '') }, (e.puff >= 0 ? '+' : '') + e.puff),
        e.heat ? h('span', { class: 'sl-heat' + (e.heat < 0 ? ' cool' : '') }, (e.heat > 0 ? '+' : '') + e.heat + '°') : null));
    }
    // puff bar
    const max = Math.max(b.order.target * 1.5, puff + 3);
    BK.puffFill.style.width = Math.min(100, (puff / max) * 100) + '%';
    BK.puffFill.classList.toggle('met', puff >= b.order.target);
    BK.puffMark.style.left = (b.order.target / max) * 100 + '%';
    BK.puffText.innerHTML = '<b>' + puff + '</b> / ' + b.order.target + ' puff' + (puff > b.order.target ? ' <span class="tips">+' + BB.tips(b) + ' tips</span>' : '');
    // heat meter: one segment per heat point, plus 3 burn segments
    BK.heat.innerHTML = '';
    const segs = b.limit + 3;
    for (let i = segs; i >= 1; i--) {
      const over = i > b.limit;
      BK.heat.appendChild(h('div', { class: 'hseg' + (over ? ' over' : '') + (i <= b.heat ? ' lit' : '') + (i === b.limit ? ' limit' : '') }, i === b.limit ? h('span', { class: 'limit-tag' }, 'limit ' + b.limit) : null));
    }
    BK.heatText.innerHTML = '<b>' + b.heat + '</b>/' + b.limit;
    const ratio = b.heat / b.limit;
    SFX.setHeat(b.state === 'baking' ? ratio : 0);
    const ovenEl = BK.oven;
    ovenEl.classList.toggle('warm', ratio >= 0.4);
    ovenEl.classList.toggle('hot', ratio >= 0.7);
    ovenEl.classList.toggle('scorch', b.heat >= b.limit);
    ovenEl.classList.toggle('burnt', b.state === 'burnt');
    ovenEl.classList.toggle('happy', b.state === 'served');
    ovenEl.style.setProperty('--glow', String(0.35 + Math.min(1, ratio) * 0.65));
    // basket list
    BK.bagCount.textContent = b.bag.length;
    BK.bagList.innerHTML = '';
    const counts = BB.countBasket(b.bag);
    BB.EGG_ORDER.forEach((t) => {
      if (!counts[t]) return;
      const E = BB.EGGS[t];
      const danger = b.state === 'baking' && BB.drawBurns(b,t);
      const pv = BB.eggPuff(b, t);
      const eh = BB.eggHeat(b, t);
      BK.bagList.appendChild(h('div', { class: 'bag-row' + (danger ? ' danger' : ''), title: E.name + ' — ' + E.desc },
        pic(ART.egg(t), 'egg-pic'), h('span', { class: 'bag-n' }, '×' + counts[t]),
        h('span', { class: 'bag-p' }, (t === 'thunder' ? '+' + pv : (pv >= 0 ? '+' : '') + pv)),
        h('span', { class: 'bag-h' + (eh < 0 ? ' cool' : eh === 0 ? ' zero' : '') }, (eh > 0 ? '+' : '') + eh + '°'),
        danger ? h('span', { class: 'bag-x' }, 'BURNS') : null));
    });
    if (b.aside.length) BK.bagList.appendChild(h('div', { class: 'aside-note' }, b.aside.length + ' tossed aside'));
    // burn chance
    const bc = BB.burnChance(b);
    BK.readout.replaceChildren(
      h('span', null, 'Puff ', h('b', null, puff + '/' + b.order.target)),
      h('span', null, 'Heat ', h('b', null, b.heat + '/' + b.limit + '°')),
      h('span', null, 'Burn ', h('b', null, Math.round(bc * 100) + '%')));
    const pct = Math.round(bc * 100);
    BK.burn.className = 'burn-box' + (bc >= 0.5 ? ' high' : bc >= 0.2 ? ' mid' : '');
    BK.burn.innerHTML = '';
    if (b.state === 'baking') {
      if (BB.phoenixReady(b)) BK.burn.append(h('small', null, 'Burn chance'), h('b', null, '0%'), h('em', null, b.ward?'Phoenix Plume guards next draw!':'Phoenix is guarding!'));
      else if (!b.bag.length) BK.burn.append(h('small', null, 'Basket empty'), h('b', null, '—'));
      else BK.burn.append(h('small', null, 'Burn chance next draw'), h('b', {title:'Exact fraction of remaining possible draws; '+(b.mittReady?'Mitt can save exactly limit +1°.':'all house rules included.')}, (bc*100).toFixed(1) + '%'), h('em',null,(b.peek?'Known next egg':Math.round(bc*b.bag.length)+' / '+b.bag.length+' eggs burn')+(b.mittReady?' · Mitt ready':'')));
    }
    // peek
    BK.peek.innerHTML = '';
    BK.peek.classList.toggle('show', !!(b.peek && b.bag.length && b.state === 'baking'));
    if (b.peek && b.bag.length && b.state === 'baking') {
      const t = b.bag[b.bag.length - 1];
      const prev = G.scope.t;
      G.building = G.scope;
      BK.peek.append(h('small', null, 'Next egg:'), pic(ART.egg(t), 'egg-pic'), h('span', { class: 'pk-name' }, BB.EGGS[t].name),
        btn('Toss it', { cls: 'small-btn', key: 't', onClick: doToss }));
      G.building = null;
      void prev;
    } else delete G.scope.t;
    // buttons
    BK.drawBtn.disabled = !BB.canDraw(b);
    BK.serveBtn.disabled = !BB.canServe(b);
    BK.serveBtn.classList.toggle('ready', b.state === 'baking' && puff >= b.order.target);
    if (b.state !== 'baking') BK.status.textContent = '';
    else if (b.oven.length < b.minDraws && BB.canDraw(b)) BK.status.textContent = 'Slow Rise: ' + b.oven.length + '/' + b.minDraws + ' eggs required before serving.';
    else if (b.oven.length >= b.maxDraws) BK.status.textContent = 'The oven is full — serve it!';
    else if (!b.bag.length) BK.status.textContent = 'Your basket is empty — serve it!';
    else if (b.heat >= b.limit && !BB.phoenixReady(b)) {
      BK.status.textContent = b.mittReady
        ? 'At the limit! Mitt guards one +1° over; cooling/zero-heat eggs are safe.'
        : (b.mods.zeroToOne ? 'At the limit! Only cooling eggs are safe.' : 'At the limit! Only cooling or zero-heat eggs are safe.');
    } else BK.status.textContent = '';
    for (const id in BK.spellBtns) {BK.spellBtns[id].disabled = !BB.canCast(r, b, id);BK.spellBtns[id].querySelector('.sp-cost').replaceChildren(String(BB.spellCost(b,id)),icon('feather'));BK.spellBtns[id].title=BB.SPELLS[id].text+' · Spells cast: '+b.spellsCast+'/'+b.maxSpells;}
    BK.serveBtn.childNodes[0].textContent=(b.oven.length<b.minDraws||!b.oven.length)&&!BB.canDraw(b)?'Underbake (no draws left)':'Serve!';
    showTriggers();
    updateTutorial();
  }

  function updateTutorial() {
    if (SAVE.tutorialDone || !BK.hint) return;
    const b = G.bake;
    const puff = BB.bakePuff(b);
    let text = null, cls = '';
    if (b.state !== 'baking') text = null;
    else if (b.oven.length === 0) { text = 'Press <b>Draw</b> (Space) to pull a random egg from your basket into the oven.'; cls = 'at-draw'; }
    else if (puff < b.order.target && b.oven.length < 3) { text = 'Each egg adds <span class="t-puff">puff</span> and usually <span class="t-heat">heat</span>. If heat goes past the <b>limit</b>, the bake burns!'; cls = 'at-heat'; }
    else if (puff >= b.order.target) { text = 'Target reached! <b>Serve</b> (Enter) now — or keep drawing for tips, if you dare.'; cls = 'at-serve'; }
    else { text = 'Watch the <b>burn chance</b> on the right. It counts exactly which eggs are left.'; cls = 'at-burn'; }
    BK.hint.className = 'tut ' + (text ? cls : 'hidden');
    if (G.compact && text) text = text.replace('Press <b>Draw</b> (Space)', 'Tap <b>Draw</b>').replace(' (Enter)', '').replace('on the right', 'below');
    BK.hint.innerHTML = text || '';
  }

  function ensureTraySlots(count) {
    BK.tray.classList.toggle('deep',count>=16);
    while (BK.tray.children.length < Math.max(16, count)) BK.tray.appendChild(h('div', { class: 'slot' }));
  }

  async function doDraw() {
    const b = G.bake;
    if (G.busy || !BB.canDraw(b)) return;
    G.busy = true;
    BK.drawBtn.disabled = true;
    if (BB.burnChance(b) >= 0.4) {
      BK.oven.classList.add('shudder');
      BK.status.textContent = 'The oven shudders…';
      SFX.play('shudder');
      // A single quick beat; reduced-motion players resolve immediately.
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) await sleep(180);
      BK.oven.classList.remove('shudder');
    }
    const slotIdx = b.oven.length;
    const ev = BB.bakeDraw(b);
    if (!ev) { G.busy = false; refreshBake(); return; }
    G.busy = true;
    BK.drawBtn.disabled = true;
    SFX.play('draw', slotIdx);
    SFX.play('egg', ev.type);
    const from = stagePos(BK.basketIcon);
    ensureTraySlots(slotIdx + 1);
    const slot = BK.tray.children[slotIdx];
    if (!ev.phoenix) BK.tray.scrollTop = Math.max(0, slot.offsetTop - BK.tray.clientHeight + slot.offsetHeight);
    const to = stagePos(ev.phoenix ? BK.oven : slot);
    const fly = h('div', { class: 'fly-egg', html: ART.egg(ev.type) });
    fly.style.left = from.x - 22 + 'px'; fly.style.top = from.y - 27 + 'px';
    document.getElementById('flyers').appendChild(fly);
    const dx = to.x - from.x, dy = to.y - from.y;
    const anim = fly.animate([
      { transform: 'translate(0,0) rotate(0deg) scale(.7)' },
      { transform: 'translate(' + dx * 0.5 + 'px,' + (dy * 0.5 - 110) + 'px) rotate(200deg) scale(1.25)', offset: 0.5 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(360deg) scale(1)' },
    ], { duration: 330, easing: 'cubic-bezier(.3,.1,.4,1)', fill: 'forwards' });
    anim.onfinish = () => {
      fly.remove();
      landEgg(ev, slot);
    };
  }

  function landEgg(ev, slot) {
    const b = G.bake;
    const ovenPos = stagePos(BK.oven);
    const mouth = { x: ovenPos.x + 14, y: ovenPos.y + 40 };
    if (ev.phoenix) {
      refreshBake();
      SFX.play('phoenix');
      FX.burst(mouth.x, mouth.y, { n: 40, colors: ['#ff8a7a', '#ffd23f', '#ff5a2a', '#fff3b0'], speed: 380, gravity: -80, life: 1.2, size: 6, shape: 'star' });
      FX.float(mouth.x, mouth.y - 80, (ev.ward?'PLUME! The ':'PHOENIX! The ') + BB.EGGS[ev.type].name + ' is thrown out!', 'big gold');
      FX.shake(8);
      const spent = BK.tray.querySelector('.slot-egg.spent');
      if (spent) spent.classList.add('burst');
      G.busy = false;
      refreshBake();
      return;
    }
    refreshBake();
    const sp = stagePos(slot);
    if (ev.burnt) {
      SFX.play('burn');
      FX.smoke(mouth.x, mouth.y, 26, true);
      FX.burst(mouth.x, mouth.y, { n: 40, colors: ['#ff5a2a', '#ffb030', '#3a2a22'], speed: 420, gravity: 300, life: 0.9, size: 7 });
      FX.shake(22);
      FX.float(sp.x, sp.y - 40, '+' + ev.heatDelta + '° — BURNT!', 'big red');
      BK.tray.classList.add('charred');
      document.getElementById('flash').classList.remove('go'); void document.getElementById('flash').offsetWidth; document.getElementById('flash').classList.add('go');
      BK.portrait.classList.add('sad');
      setTimeout(() => finishBake(), 1100);
      return;
    }
    FX.sparks(sp.x, sp.y, 10);
    FX.float(sp.x, sp.y - 36, (ev.puff >= 0 ? '+' : '') + ev.puff + ' puff', 'puff');
    if (ev.heatDelta > 0) { SFX.play('sizzle', b.heat); FX.burst(mouth.x, mouth.y, { n: 6 + ev.heatDelta * 6, colors: ['#ff7a1a', '#ffd23f'], speed: 160, gravity: -200, life: 0.6, size: 4 }); }
    if (ev.heatDelta < 0) { SFX.play('cool'); FX.burst(mouth.x, mouth.y, { n: 18, colors: ['#a6dcf7', '#ffffff'], speed: 200, gravity: 40, life: 0.8, size: 4, shape: 'star' }); FX.float(mouth.x, mouth.y - 50, ev.heatDelta+'° cool!', 'cool'); }
    if (ev.corn) { FX.float(sp.x, sp.y - 64, '+' + ev.corn + ' corn', 'gold'); setTimeout(() => SFX.play('coin', 0), 120); }
    if (ev.type === 'thunder') { SFX.play('thunder'); FX.shake(6); }
    if (ev.peek) SFX.play('peek');
    const bc = BB.burnChance(b);
    if (b.state === 'baking' && bc >= 0.5) setTimeout(() => SFX.play('warn'), 160);
    if (BB.bakePuff(b) >= b.order.target && BB.bakePuff(b) - ev.puff < b.order.target) {
      FX.float(stagePos(BK.puffMark).x, stagePos(BK.puffMark).y - 30, 'Target reached!', 'big gold');
      SFX.play('magic');
    }
    if (BB.bakePuff(b) >= b.order.target) BK.portrait.classList.add('excited');
    G.busy = false;
    refreshBake();
  }

  function doToss() {
    const b = G.bake;
    const t = BB.bakeToss(b);
    if (!t) return;
    SFX.play('toss');
    const p = stagePos(BK.peek);
    FX.burst(p.x, p.y, { n: 12, colors: [BB.EGGS[t].color, '#fff'], speed: 220, gravity: 500, life: 0.7, size: 5 });
    FX.float(p.x, p.y - 30, 'Tossed aside', 'puff');
    refreshBake();
  }

  function doCast(id) {
    const b = G.bake, r = G.run;
    if (G.busy) return;
    if (!BB.cast(r, b, id)) { SFX.play('deny'); return; }
    const sb = stagePos(BK.spellBtns[id]);
    FX.magic(sb.x, sb.y, 16);
    const ov = stagePos(BK.oven);
    const mouth = { x: ov.x + 14, y: ov.y + 40 };
    if (id === 'fan' || id === 'chill') {
      SFX.play('cool'); SFX.play('whoosh');
      FX.feathers(ov.x, ov.y, id === 'chill' ? 14 : 10);
      FX.burst(mouth.x, mouth.y, { n: id === 'chill' ? 18 : 10, colors: ['#a6dcf7', '#ffffff'], speed: 180, gravity: 40, life: 0.7, size: 4, shape: 'star' });
      FX.float(ov.x, ov.y - 90, id === 'fan' ? '−2° Wing Fan!' : '−3° & +2 puff!', 'cool');
    } else if (id === 'eye') {
      SFX.play('peek'); FX.float(sb.x, sb.y - 40, 'Hen\'s Eye…', 'magic');
    } else if (id === 'cluck') {
      SFX.play('cluck'); SFX.play('magic');
      const slot = BK.tray.children[b.oven.length - 1];
      const sp = stagePos(slot);
      FX.magic(sp.x, sp.y, 26);
      FX.float(sp.x, sp.y - 40, 'Golden Cluck! ×2', 'big gold');
    } else if (id === 'baste') {
      SFX.play('magic'); FX.float(ov.x, ov.y - 70, 'Butter Baste! Next +3 puff', 'gold');
    } else if (id === 'surge') {
      SFX.play('sizzle', b.heat); SFX.play('magic');
      FX.burst(mouth.x, mouth.y, { n: 22, colors: ['#ff7a1a', '#ffd23f'], speed: 180, gravity: -180, life: 0.65, size: 5 });
      FX.float(ov.x, ov.y - 80, '+5 puff · +2° Hearth Surge!', 'puff');
    } else if (id === 'ward') {
      SFX.play('phoenix'); FX.feathers(ov.x, ov.y, 12);
      FX.float(ov.x, ov.y - 80, 'Phoenix Plume guarding!', 'gold');
    } else if (id === 'wish' || id === 'swap') {
      if (b.state === 'burnt') {
        SFX.play('burn');
        FX.smoke(mouth.x, mouth.y, 26, true);
        FX.burst(mouth.x, mouth.y, { n: 40, colors: ['#ff5a2a', '#ffb030', '#3a2a22'], speed: 420, gravity: 300, life: 0.9, size: 7 });
        FX.shake(22);
        FX.float(ov.x, ov.y - 70, BB.SPELLS[id].name + ' — BURNT!', 'big red');
        BK.tray.classList.add('charred');
        document.getElementById('flash').classList.remove('go'); void document.getElementById('flash').offsetWidth; document.getElementById('flash').classList.add('go');
        BK.portrait.classList.add('sad');
      } else {
        const last = b.oven[b.oven.length - 1];
        SFX.play('magic');
        if (last) SFX.play('egg', last.type);
        if (last && last.type === 'thunder') { SFX.play('thunder'); FX.shake(6); }
        if (last && last.cornFromDraw) setTimeout(() => SFX.play('coin', 0), 120);
        if (b.peek) SFX.play('peek');
        const slot = b.oven.length ? BK.tray.children[b.oven.length - 1] : null;
        const sp = slot ? stagePos(slot) : ov;
        FX.sparks(sp.x, sp.y, 14);
        FX.float(sp.x, sp.y - 40, id === 'wish' ? 'Wish Egg! +' + (last ? last.puff : 2) + ' puff' : 'Swapped! ' + (last ? BB.EGGS[last.type].name : ''), 'gold');
      }
    }
    updateHud();
    refreshBake();
    if(b.state==='burnt'){G.busy=true;setTimeout(finishBake,900);}
  }

  function doServe() {
    const b = G.bake;
    if (G.busy || !BB.canServe(b)) return;
    BB.bakeServe(b);
    G.busy = true;
    refreshBake();
    const ov = stagePos(BK.oven);
    if (b.state === 'served') {
      SFX.play('success');
      FX.confetti(ov.x, ov.y - 40, 70);
      BK.portrait.classList.add('happy');
    } else {
      SFX.play('fail');
      FX.smoke(ov.x, ov.y - 20, 10, false);
      BK.portrait.classList.add('sad');
    }
    setTimeout(finishBake, 650);
  }

  function finishBake() {
    const r = G.run, b = G.bake;
    const s = BB.applyBake(r, b);
    SAVE.lifetime.served+=s.result==='served'?1:0;
    if(s.result==='served'&&b.heat===b.limit)SAVE.lifetime.exactLimitWins++;
    SAVE.lifetime.phoenixSaves+=b.phoenixSaves||0;
    if(s.result==='served'&&b.order.kind==='boss'&&r.act===1)SAVE.lifetime.act2Boss=true;
    trackUnlocks();showTriggers();
    (r.recap || (r.recap = [])).push({ ...s, pastry: b.order.pastry, heat: b.heat, limit: b.limit, eggs: b.oven.length });
    G.busy = false;
    updateHud();
    if (s.heartsLost) { SFX.play('hurt'); FX.shake(10); }
    if (!SAVE.tutorialDone) { SAVE.tutorialDone = true; persist(); }
    showBakeResult(s);
  }

  function showBakeResult(s) {
    const r = G.run, b = G.bake;
    const title = s.result === 'served' ? (s.puff >= s.target + 5 ? 'Magnificent!' : 'Delicious!') : s.result === 'burnt' ? 'BURNT!' : 'Underbaked…';
    let prizePick = null;
    openModal((box) => {
      box.classList.add('result-' + s.result);
      box.appendChild(h('h1', { class: 'stamp' }, title));
      box.appendChild(pic(ART.pastry(b, s.result), 'result-pastry'));
      const lines = h('div', { class: 'result-lines' });
      const line = (txt, cls) => lines.appendChild(h('div', { class: 'rl ' + (cls || ''), html: txt }));
      if (s.result === 'burnt') line(s.puff >= s.target ? 'You had <b>' + s.puff + '</b> puff (target ' + s.target + ')… then pushed your luck.' : 'Burnt at <b>' + s.puff + '</b> puff (target ' + s.target + ').');
      else line('Puff <b>' + s.puff + '</b> vs target <b>' + s.target + '</b>');
      if (s.result === 'served') {
        line('+' + s.reward + ' corn payment', 'good');
        if (s.tips) line('+' + s.tips + ' corn in tips', 'good');
        if (s.feathers) line('+' + s.feathers + ' magic feather', 'good');
      } else {
        line('−' + s.heartsLost + ' heart' + (s.heartsLost > 1 ? 's' : ''), 'bad');
        if (s.rotten) line('A <b>Rotten Egg</b> joins your basket', 'bad');
        if (s.result === 'under') line('Stopped short — at least nothing rotted.', 'muted');
      }
      if (s.cloverCorn) line('+' + s.cloverCorn + ' corn from eggs and charms', 'good');
      box.appendChild(lines);
      if (s.eggPrize && r.hearts > 0) {
        const choices = BB.prizeChoices(r);
        const row = h('div', { class: 'prize-row' }, h('h3', null, 'Reward: choose a rare egg'));
        const cards = h('div', { class: 'prize-cards' });
        choices.forEach((t, i) => {
          const card = btn([pic(ART.egg(t), 'egg-pic'), h('b', null, BB.EGGS[t].name), eggStats(t), h('small', null, BB.EGGS[t].desc)], {
            cls: 'prize-card', key: String(i + 1), onClick: () => {
              if (prizePick) return;
              prizePick = t; r.basket.push(t); card.classList.add('picked');
              cards.querySelectorAll('.prize-card').forEach((c) => { if (c !== card) c.disabled = true; });
              SFX.play('buy'); const p = stagePos(card); FX.magic(p.x, p.y, 20); updateHud();
              cont.disabled = false;
            },
          });
          cards.appendChild(card);
        });
        row.appendChild(cards);
        box.appendChild(row);
      }
      const cont = btn(r.hearts <= 0 ? 'Oh no…' : 'Continue', { cls: 'primary big', key: 'enter space', onClick: () => { closeModal(true); G.bake = null; G.bakeAfter(s); } });
      if (s.eggPrize && r.hearts > 0) {
        cont.disabled = true;
        box.appendChild(h('div', { class: 'row-center' }, cont, btn('Skip', { cls: 'ghost', onClick: () => { cont.disabled = false; cont.click(); } })));
      } else box.appendChild(cont);
    }, { cls: 'result' });
    if (s.result === 'served') setTimeout(() => flyCorn(BK.portrait, s.reward + s.tips), 250);
  }

  // ---------------------------------------------------------------- Bosses
  function showBossIntro(key, course) {
    const r = G.run, B = BB.BOSSES[key];
    const order = BB.makeBossOrder(r, key, course);
    setScreen('boss', (s) => {
      s.appendChild(h('div', { class: 'boss-wrap' },
        h('div', { class: 'boss-banner' }, !!B.courses ? (course === 0 ? 'FINAL SHOWDOWN' : 'COURSE ' + (course + 1) + ' OF 3') : 'BOSS'),
        pic(ART.critter(B.look), 'boss-portrait pop-in'),
        h('div', { class: 'boss-info' },
          h('h1', null, B.name), h('div', { class: 'boss-title' }, B.title),
          course === 0 ? bubble('“' + B.line + '”', 'speech') : null,
          !!B.courses
            ? h('div', { class: 'course-list' }, B.courses.map((c, i) => h('div', { class: 'course-card' + (i === course ? ' now' : '') + (r.courses[i] === true ? ' won' : r.courses[i] === false ? ' lost' : '') },
              h('b', null, c.name), h('span', { class: 'big-num' }, String(BB.makeBossOrder(r, key, i).target)), h('small', null, 'puff'), h('p', null, BB.makeBossOrder(r,key,i).rule))))
            : h('div', { class: 'rule-box' }, h('b', null, 'House rule: '), BB.bossRule(r,key)),
          h('div', { class: 'boss-stakes' }, 'Target ', h('b', null, String(order.target)), ' puff · Pays ', h('b', null, String(order.reward)), ' corn · Failing costs ', h('b', null, order.heartLoss + ' heart' + (order.heartLoss > 1 ? 's' : ''))),
          btn('Fire up the oven!', { cls: 'primary big', key: 'enter space', onClick: () => startBake(order, (sum) => afterBoss(key, course, sum)) }))));
      SFX.play('boss');
    }, { scene: actScene(), music: 'boss', hud: true });
  }

  function afterBoss(key, course, sum) {
    const r = G.run;
    if (!BB.BOSSES[key].courses) {
      if (sum.result === 'served') r.bossesBeaten++;
      if(sum.result==='served'&&r.hearts>0){chooseCharmReward(advance);return;}
      advance();
      return;
    }
    r.courses[course] = sum.result === 'served';
    if (r.hearts <= 0) { showEnd(false); return; }
    const wins = r.courses.filter((x) => x === true).length;
    const losses = r.courses.filter((x) => x === false).length;
    if (losses >= 2) { showEnd(false, 'baron'); return; }
    if (course === 1 && wins === 2) { showDessertGamble(); return; }
    if (course >= 2) { if (wins >= 2) { r.bossesBeaten++; r.won = true; showEnd(true); } else showEnd(false, 'baron'); return; }
    showBossIntro(key, course + 1);
  }

  function showDessertGamble() {
    const r = G.run;
    const dessert = BB.makeBossOrder(r, r.actBosses[2], 2);
    setScreen('dessert', (s) => {
      s.appendChild(h('div', { class: 'boss-wrap' },
        pic(ART.critter(BB.BOSSES.fox.look), 'boss-portrait'),
        h('div', { class: 'boss-info' },
          h('h1', null, 'Two courses won!'),
          bubble('“Tch. Fine — the egg is yours. Unless… you dare bake my <b>Dessert</b>? Pass, and I\'ll pay ' + dessert.reward + ' corn plus double tips. Fail, and it costs you a heart. Should that be your last heart… you\'ll be dessert yourself.”', 'speech'),
          h('div', { class: 'rule-box' }, 'Dessert: target ', h('b', null, String(dessert.target)), ' puff. ', dessert.rule, ' You have ', h('b', null, String(r.hearts)), ' heart' + (r.hearts > 1 ? 's' : '') + '.'),
          h('div', { class: 'row-center' },
            btn('Take the Golden Egg', { cls: 'go big', key: '1', onClick: () => { r.bossesBeaten++; r.won = true; showEnd(true); } }),
            btn('Bake the Dessert', { cls: 'danger big', key: '2', onClick: () => startBake(dessert, (sum) => {
              r.courses[2] = sum.result === 'served';
              if (r.hearts <= 0) { showEnd(false, 'dessert'); return; }
              r.bossesBeaten++; r.won = true; showEnd(true);
            }) })))));
    }, { scene: 'castle', music: 'boss', hud: true });
  }

  // ---------------------------------------------------------------- Market
  const KEEPER = { body: '#f2a7b5', belly: '#ffd6de', ears: 'pointy', inner: '#e07a90', muzzle: '#ffc2cf', nose: '#e86d86', snout: 'pig', acc: 'cap', accColor: '#2f9e6a' };
  const DEALER = { body: '#a57f5a', belly: '#f2e2c4', ears: 'round', inner: '#f2e2c4', muzzle: '#f2e2c4', nose: '#2a1a10', mask: '#6e4e34', acc: 'visor', whiskers: true };

  function chooseCharmReward(after) {
    const r=G.run, choices=BB.charmChoices(r,'boss',2);
    if(!choices.length){after();return;}
    openModal(box=>{
      box.append(h('h2',null,'A Kitchen Charm for the road'),h('p',null,'Choose one passive charm. It lasts until this run ends.'),
        h('div',{class:'prize-cards'},choices.map((id,i)=>btn([pic(ART.charm(id),'big-ico'),h('b',null,BB.CHARMS[id].name),h('small',null,BB.CHARMS[id].text)],{
          cls:'prize-card',key:String(i+1),onClick:()=>{BB.addCharm(r,id);SFX.play('magic');updateHud();closeModal(true);after();}
        }))));
    });
  }
  function chooseUpgrade(types, after) {
    if(!types.length)return;
    const counts=BB.countBasket(G.run.basket);
    openModal(box=>{
      box.append(h('h2',null,'Temper which egg?'),h('p',{class:'muted'},'Choose an egg, then a Cool / Steady or Hot / Puffy branch.'),
        h('div',{class:'basket-grid'},types.map((t,i)=>btn([eggChip(t),h('div',{class:'br-text'},h('div',{class:'br-name'},BB.EGGS[t].name,h('span',{class:'br-count'},'×'+counts[t])),eggStats(t),h('div',{class:'br-desc'},BB.EGGS[t].desc))],{cls:'basket-row',key:i<9?String(i+1):null,onClick:()=>{
          closeModal(true);
          openModal(branch=>{
            branch.append(h('h2',null,BB.EGGS[t].name+' · choose a branch'),h('div',{class:'prize-cards'},[0,1].map(i=>{
              const id=t==='rotten'?(i===0?'yolk':null):BB.UPGRADES[t][i];
              return btn([id?pic(ART.egg(id),'egg-pic'):icon('corn','big-ico'),h('b',null,t==='rotten'?(i===0?'Purify':'Compost'):(i===0?'Cool / Steady':'Hot / Puffy')),
                h('b',null,id?BB.EGGS[id].name:'+8 corn'),h('small',null,id?BB.EGGS[id].desc:'Remove this Rotten Egg and gain 8 corn.')],{
                  cls:'prize-card '+(i?'branch-hot':'branch-cool'),key:String(i+1),onClick:()=>{BB.upgradeEgg(G.run,t,i);SFX.play('magic');closeModal(true);after();}
                });
            })));
          },{closable:true});
        }}))));
    },{closable:true,cls:'wide'});
  }
  function showMarket() {
    const r=G.run,shop=BB.genShop(r);G.shop=shop;
    let speech,eggs,charms;const cards=[],services=[];
    const pay=price=>{r.corn-=price;r.stats.cornSpent+=price;};
    const itemPrice=it=>BB.price(r,(it.charm?BB.CHARMS:BB.EGGS)[it.type].cost);
    const update=say=>{
      if(say)speech.textContent=say;
      cards.forEach(({el,it})=>{it.price=itemPrice(it);el.disabled=it.sold||r.corn<it.price;el.classList.toggle('sold',it.sold);el.querySelector('.price').textContent=it.sold?'SOLD':it.price+' corn';});
      services.forEach(({el,spec})=>{const price=BB.servicePrice(r,spec.id,shop);el.disabled=price==null||r.corn<price||spec.unavailable();el.querySelector('.svc-text small').textContent=spec.sub();el.querySelector('.price').textContent=price==null?'MAX':price+' corn';});
      updateHud();
    };
    const shelf=()=>{
      const previous=cards.splice(0);
      if(!previous.length){eggs.replaceChildren();charms.replaceChildren();}
      const draw=(it,i,isCharm)=>{
        const prev=previous.find(c=>c.it===it);
        if(prev&&it.sold){cards.push(prev);return;}
        it.charm=isCharm;const E=(isCharm?BB.CHARMS:BB.EGGS)[it.type];
        const c=btn([pic(isCharm?ART.charm(it.type):ART.egg(it.type),isCharm?'charm-art':'egg-pic'),h('b',null,E.name),isCharm?h('small',{class:'rarity'},E.rarity+' · '+E.arch):eggStats(it.type),h('small',null,isCharm?E.text:E.desc),h('div',{class:'price'})],{
          cls:'shop-card'+(isCharm?' shop-charm':''),key:isCharm?String(5+i):String(1+i),title:isCharm?E.text:E.desc,onClick:()=>{
            if(it.sold)return;const price=itemPrice(it);if(r.corn<price)return;pay(price);it.sold=true;
            if(isCharm)BB.addCharm(r,it.type);else r.basket.push(it.type);
            SFX.play('buy');const p=stagePos(c);FX.sparks(p.x,p.y,16);update('“'+E.name+'! Excellent taste.”');
          }});
        cards.push({el:c,it});if(prev)prev.el.replaceWith(c);else (isCharm?charms:eggs).appendChild(c);
      };
      shop.eggs.forEach((it,i)=>draw(it,i,false));shop.charms.forEach((it,i)=>draw(it,i,true));
    };
    setScreen('market',s=>{
      s.appendChild(h('div',{class:'keeper'},pic(ART.critter(KEEPER),'keeper-portrait'),h('div',{class:'nameplate'},'Truffle the Trader')));
      speech=bubble('“Fresh eggs, kitchen charms, and a little tempering. Build something lovely!”','speech');speech.setAttribute('aria-live','polite');
      const right=h('div',{class:'market-right'},speech);eggs=h('div',{class:'shop-eggs'});charms=h('div',{class:'shop-charms'});
      right.append(h('h3',null,'Eggs'),eggs,h('h3',null,'Kitchen Charms · passive for this run'),charms,h('h3',null,'Services'));
      const specs=[
        {id:'oven',name:'Bigger Oven',key:'o',ic:'thermo',sub:()=>'+1 limit · '+r.ovenUps+'/4 upgrades',unavailable:()=>shop.ovenBought,buy(price){pay(price);r.limit++;r.ovenUps++;shop.ovenBought=true;update('“A little more room for fire.”');}},
        {id:'temper',name:'Temper an Egg',key:'u',ic:'puff',sub:()=>'Choose Cool / Hot branch',unavailable:()=>shop.temperUsed||!r.basket.some(t=>BB.UPGRADES[t]),buy(price){chooseUpgrade([...new Set(r.basket)].filter(t=>BB.UPGRADES[t]),()=>{pay(price);shop.temperUsed=true;update('“A fine new shell!”');});}},
        {id:'crack',name:'Crack an Egg',key:'c',ic:'basket',sub:()=>'Remove one egg',unavailable:()=>shop.crackUsed||r.basket.length<=4,buy(price){openBasket({crack:true,price,onPick:t=>{pay(price);r.basket.splice(r.basket.indexOf(t),1);shop.crackUsed=true;SFX.play('toss');update('“Crack! Gone.”');}});}},
        {id:'heal',name:'Mend a Heart',key:'h',ic:'heart',sub:()=>r.hearts+'/'+r.maxHearts+' hearts',unavailable:()=>r.hearts>=r.maxHearts,buy(price){pay(price);r.hearts++;SFX.play('heal');update();}},
        {id:'feather',name:'Magic Feather',key:'f',ic:'feather',sub:()=>r.feathers+'/'+r.maxFeathers+' feathers',unavailable:()=>r.feathers>=r.maxFeathers,buy(price){pay(price);r.feathers++;SFX.play('magic');update();}},
        {id:'restock',name:'Restock Shelf',key:'r',ic:'corn',sub:()=>'Reroll unsold items · '+shop.restocks+' restocks',unavailable:()=>!cards.some(c=>!c.it.sold),buy(price){pay(price);BB.restockShop(r,shop);r.stats.restocks++;shelf();update('“New eggs! New possibilities!”');}}
      ];
      const row=h('div',{class:'services'});
      specs.forEach(spec=>{const el=service(spec.name,spec.sub(),BB.servicePrice(r,spec.id,shop),spec.key,false,()=>spec.buy(BB.servicePrice(r,spec.id,shop)),spec.ic);services.push({el,spec});row.appendChild(el);});
      right.append(row,btn('Leave the market',{cls:'primary',key:'enter l',onClick:advance}));s.appendChild(right);shelf();
    },{scene:actScene(),music:actMusic(),hud:true});update();
  }

  function service(name, sub, price, key, disabled, onClick, ic) {
    return btn([icon(ic), h('div', { class: 'svc-text' }, h('b', null, name), h('small', null, sub)), h('div', { class: 'price' }, price === 'MAX' ? 'MAX' : [icon('corn'), ' ' + price])], { cls: 'svc', key, disabled, onClick });
  }

  // ---------------------------------------------------------------- Sizzle Dice
  function showDen() {
    const r=G.run,st={heat:0,hands:3,net:0,phase:'bet',stake:0,locked:false,dice:[2,5]};G.den=st;
    let speech,table,controls;
    function payout(){return Math.min(Math.round(st.stake*BB.denMult(st.heat)),st.stake+30-st.net);}
    function settle(bust){
      const ret=bust?0:payout(),net=ret-st.stake;r.corn+=ret;st.net+=net;r.stats.denNet+=net;st.hands--;
      r.stats[net>=0?'gamblesWon':'gamblesLost']++;st.phase='bet';st.locked=st.net>=30;
      speech.textContent=st.locked?'“House limit, feathers! Come back another night.”':bust?'“Burnt! A 1 or more than 21° takes the stake.”':'“'+BB.DEN.rungs.find(x=>st.heat>=x.min).label+'! Collect '+ret+' corn ('+(net>=0?'+':'')+net+' net).”';
      SFX.play(bust?'fail':'success');FX.float(750,330,bust?'BURNT! −'+st.stake+' corn':'+'+ret+' corn','big '+(bust?'red':'gold'));updateHud();render();
    }
    async function roll(n){
      if(st.phase!=='roll'||G.busy)return;G.busy=true;
      SFX.play('shuffle');table.classList.add('rolling');await sleep(220);
      const ev=BB.denRoll(st,n,r.rng);st.dice=ev.dice;st.heat=ev.heat;table.classList.remove('rolling');G.busy=false;
      if(ev.bust){settle(true);return;}
      if(ev.autoCash){settle(false);return;}
      speech.textContent=ev.doubles?'“Doubles! +2° sizzle bonus. Push again or cash out?”':'“'+st.heat+'°. Push again or cash out?”';SFX.play('plop');render();
    }
    function render(){
      table.replaceChildren();controls.replaceChildren();G.scope={};G.building=G.scope;
      table.append(h('div',{class:'den-count'},'Hands left: '+st.hands+'/3 · Visit profit: '+(st.net>=0?'+':'')+st.net+' / +30 cap'));
      const meter=h('div',{class:'pan-meter'});
      for(let i=1;i<=21;i++)meter.appendChild(h('span',{class:(i<=st.heat?'lit ':'')+([8,12,15,18,21].includes(i)?'rung':''),title:i+'°'},[8,12,15,18,21].includes(i)?String(i):''));
      table.append(meter,h('b',{class:'pan-heat'},'Pan '+st.heat+'° / 21°'),h('div',{class:'dice-row'},st.dice.map(d=>pic(ART.die(d),'sizzle-die'))),
        h('div',{class:'payout-ladder'},BB.DEN.rungs.slice().reverse().map((x,i,arr)=>h('div',{class:BB.denMult(st.heat)===x.mult?'active':''},x.min+'–'+(arr[i+1]?arr[i+1].min-1:21)+'° '+x.label+' ×'+x.mult))));
      controls.appendChild(h('div',{class:'den-rules'},'A 1 burns instantly. Over 21° burns. Bold doubles add +2°. At 21°: automatic cash-out.'));
      if(st.phase==='bet'){
        const stakes=BB.DEN.stakes.filter(v=>v<=r.corn);if(r.corn>0&&r.corn<12&&!stakes.includes(r.corn))stakes.push(r.corn);
        controls.appendChild(h('div',{class:'stake-row'},'Start a hand · stake:',stakes.map((v,i)=>btn((v===r.corn&&!BB.DEN.stakes.includes(v)?'All-in · ':'')+v+' corn',{key:String(i+1),cls:'chip',disabled:!st.hands||st.locked,onClick:()=>{r.corn-=v;st.stake=v;st.heat=0;st.phase='roll';updateHud();render();}}))));
        controls.appendChild(btn('Leave the den',{cls:'primary',key:'enter l',onClick:advance}));
      }else{
        const odds=BB.denOdds(st.heat);
        const nextRung=BB.DEN.rungs.slice().reverse().find(x=>x.min>st.heat);
        const fmt=o=>(o.burn*100).toFixed(1)+'% ('+o.burnCount+'/'+o.total+')'+(nextRung?' · → '+nextRung.label+' (×'+nextRung.mult+'): '+(o.upgrade*100).toFixed(1)+'%':' · Top rung reached');
        controls.appendChild(h('div',{class:'play-row'},[1,2].map(n=>btn([h('b',null,n===1?'1 Die · Gentle':'2 Dice · Bold'),h('small',null,'Burn: '+fmt(odds['die'+n]))],{cls:'speed-btn',key:String(n),onClick:()=>roll(n)}))));
        controls.appendChild(btn('Cash Out · Collect '+payout()+' corn ('+(payout()-st.stake>=0?'+':'')+(payout()-st.stake)+' net)',{cls:'go',key:'enter',disabled:st.heat<1,onClick:()=>settle(false)}));
      }G.building=null;
    }
    setScreen('den',s=>{
      s.appendChild(h('div',{class:'keeper'},pic(ART.critter(DEALER),'keeper-portrait'),h('div',{class:'nameplate'},'Lucky Wink · Sizzle Dice')));
      speech=bubble('“A pan, a pair of dice, and three chances. Roll a 1 and you’re toast. Can you stop in time?”','speech den-speech');
      table=h('div',{class:'den-table'});controls=h('div',{class:'den-controls'});s.append(speech,table,controls);render();
    },{scene:'den',music:'den',hud:true});
  }
  // ---------------------------------------------------------------- Nest
  function showNest() {
    const r=G.run,targets=BB.broodChoices(r);
    setScreen('nest',s=>{
      s.appendChild(h('div',{class:'center-head'},pic(ART.place('nest'),'head-ico'),h('h2',null,'A Cozy Nest'),h('p',{class:'muted'},'One quiet moment. Choose how to spend it.')));
      const preen=()=>openModal(box=>{
        box.append(h('h2',null,'Preen your feathers'),h('div',{class:'prize-cards'},
          btn('Gain 2 magic feathers',{cls:'prize-card',key:'1',disabled:r.feathers>=r.maxFeathers,onClick:()=>{r.feathers=Math.min(r.maxFeathers,r.feathers+2);SFX.play('magic');closeModal(true);advance();}}),
          btn('Swap 1 active spell (+1 feather)',{cls:'prize-card',key:'2',disabled:SAVE.unlockedSpells.length<4,onClick:()=>{closeModal(true);spellbook(true);}})));
      },{closable:true});
      s.append(h('div',{class:'nest-cards'},
        btn([icon('heart','big-ico'),h('b',null,'Rest'),h('small',null,'Heal 2 hearts.')],{cls:'nest-card',key:'1',disabled:r.hearts>=r.maxHearts,onClick:()=>{r.hearts=Math.min(r.maxHearts,r.hearts+2);SFX.play('heal');advance();}}),
        btn([icon('feather','big-ico'),h('b',null,'Preen'),h('small',null,'Gain feathers or swap a spell.')],{cls:'nest-card',key:'2',disabled:r.feathers>=r.maxFeathers&&SAVE.unlockedSpells.length<4,onClick:preen}),
        btn([icon('basket','big-ico'),h('b',null,'Brood'),h('small',null,'Free branching upgrade. Rotten: purify or compost.')],{cls:'nest-card',key:'3',disabled:!targets.length,onClick:()=>chooseUpgrade(targets,advance)})),
        btn('Just pass by',{cls:'ghost',key:'enter',onClick:advance}),pic(ART.hen({mood:'happy'}),'nest-hen bob'));
    },{scene:actScene(),music:actMusic(),hud:true});
  }

  // ---------------------------------------------------------------- Mystery
  function showMystery() {
    const r = G.run;
    const ev = BB.pickEvent(r);
    setScreen('mystery', (s) => {
      const card = h('div', { class: 'event-card' },
        pic(ART.place(ev.icon), 'event-art'),
        h('h2', null, ev.title),
        h('p', null, ev.text));
      const choices = h('div', { class: 'event-choices' });
      ev.choices.forEach((c, i) => {
        const can = !c.can || c.can(r);
        choices.appendChild(btn([h('b', null, c.label), h('small', null, can ? c.hint : 'You can\'t afford that')], {
          cls: 'event-btn', key: String(i + 1), disabled: !can, onClick: () => {
            const res = c.go(r);
            updateHud();
            choices.remove();
            const p = stagePos(card);
            if (res.good === true) { SFX.play('success'); FX.magic(p.x, p.y, 30); }
            else if (res.good === false) { SFX.play('hurt'); FX.shake(8); }
            else SFX.play('click');
            G.building = G.scope;
            const out = h('div', { class: 'event-result ' + (res.good === true ? 'good' : res.good === false ? 'bad' : '') },
              res.egg ? pic(ART.egg(res.egg), 'egg-pic') : null, h('p', null, res.text),
              btn('Continue', { cls: 'primary', key: 'enter space', onClick: advance }));
            G.building = null;
            card.appendChild(out);
          },
        }));
      });
      card.appendChild(choices);
      s.appendChild(card);
    }, { scene: actScene(), music: actMusic(), hud: true });
  }

  // ---------------------------------------------------------------- End
  function runRecap(r) {
    const bakes = r.recap || [];
    const served = bakes.filter((b) => b.result === 'served');
    const best = served.reduce((a, b) => !a || b.puff > a.puff ? b : a, null);
    const closest = served.reduce((a, b) => !a || b.limit - b.heat < a.limit - a.heat ? b : a, null);
    const highlights = h('ul', { class: 'recap-highlights' });
    if (best) highlights.appendChild(h('li', null, best.pastry + ': ' + best.puff + ' puff from ' + best.eggs + ' eggs, +' + best.tips + ' tips.'));
    if (closest) highlights.appendChild(h('li', null, 'Closest call served at ' + closest.heat + '/' + closest.limit + ' heat: ' + closest.pastry + '.'));
    if (r.stats.phoenix) highlights.appendChild(h('li', null, 'Phoenix guarded ' + r.stats.phoenix + ' bake' + (r.stats.phoenix === 1 ? '' : 's') + '.'));
    if (!served.length) highlights.appendChild(h('li', null, 'No orders served this time. Your next bake awaits.'));
    const counts = BB.countBasket(r.basket);
    const basket = h('div', { class: 'recap-basket' });
    BB.EGG_ORDER.forEach((t) => {
      if (counts[t]) basket.appendChild(h('div', { class: 'recap-egg', title: BB.EGGS[t].desc }, pic(ART.egg(t), 'egg-pic'), h('span', null, counts[t] + ' × ' + BB.EGGS[t].name)));
    });
    return h('div', { class: 'run-recap' },
      h('p',null,'Charms: '+(r.charms.map(id=>BB.CHARMS[id].name).join(', ')||'none')+' · Upgrades '+r.stats.upgrades+' · Spells cast '+r.stats.spells+' · Charm triggers '+r.stats.charmTriggers+' · Corn spent '+r.stats.cornSpent),
      h('details', { open: true }, h('summary', null, 'Run highlights'), highlights,
        h('p', { class: 'recap-stats' }, 'Bosses beaten ' + r.bossesBeaten + ' · Legendary serves ' + r.stats.legendary + ' · Underbaked ' + r.stats.under + ' · Bake earnings ' + r.stats.cornEarned + ' corn · Gambling wins/losses ' + r.stats.gamblesWon + '/' + r.stats.gamblesLost),
        h('p', { class: 'recap-stats' }, 'Oven limit ' + r.limit + ' · Hearts ' + Math.max(0, r.hearts) + '/' + r.maxHearts + ' · Feathers ' + r.feathers + '/' + r.maxFeathers)),
      h('details', null, h('summary', null, 'Final basket · ' + r.basket.length + ' eggs'), basket));
  }

  function showEnd(won, reason) {
    const r = G.run;
    r.won = !!won;
    r.over = true;
    const sc = BB.score(r);
    const rank = BB.rank(sc.total, won);
    const newBest = sc.total > SAVE.best;
    if (newBest) SAVE.best = sc.total;
    let unlocked = null;
    if (won) {
      SAVE.wins++;
      if(r.spice>=1)SAVE.lifetime.spiceWin=true;
      unlockSpells();
      if (r.spice >= SAVE.spiceUnlocked && SAVE.spiceUnlocked < 9) { SAVE.spiceUnlocked = r.spice + 1; unlocked = BB.SPICE[SAVE.spiceUnlocked].name; SAVE.spice = SAVE.spiceUnlocked; }
    }
    persist();
    let story;
    if (won) story = 'Baron Velvetpaw hands over the Golden Egg with a very sour face. Clover Meadow throws a feast, and Marigold\'s Wishing Oven is the guest of honour.';
    else if (reason === 'baron') story = '“Two failed courses? How disappointing.” The Baron keeps the Golden Egg — and Marigold barely escapes with her tail feathers.';
    else if (reason === 'dessert') story = 'Greed is a dangerous spice. The Dessert flopped, and the Baron licks his lips… Marigold flees the keep with nothing but singed feathers.';
    else story = 'Out of hearts, Marigold limps home to Clover Meadow with a singed hat and a basket of hard-earned lessons. The oven sulks. Tomorrow, another try.';
    setScreen('end', (s) => {
      const table = h('div', { class: 'score-table' });
      sc.parts.forEach(([k, v]) => table.appendChild(h('div', { class: 'srow' }, h('span', null, k), h('b', null, String(v)))));
      table.appendChild(h('div', { class: 'srow total' }, h('span', null, 'Total'), h('b', null, String(sc.total))));
      s.appendChild(h('div', { class: 'end-wrap ' + (won ? 'won' : 'lost') },
        h('div', { class: 'end-art' }, won ? pic(ART.goldenEgg(), 'end-egg glow') : pic(ART.oven(), 'end-oven burnt'), pic(ART.hen({ mood: won ? 'happy' : 'sad' }), 'end-hen ' + (won ? 'bob' : 'droop'))),
        h('div', { class: 'end-info' },
          h('h1', null, won ? 'The Golden Egg is home!' : 'Bust!'),
          h('p', null, story),
          h('div', { class: 'rank' }, h('small', null, 'Rank'), h('b', null, rank), newBest ? h('span', { class: 'new-best' }, 'New best!') : null),
          table,
          h('div', { class: 'end-stats muted' }, 'Bakes ' + r.stats.bakes + ' · served ' + r.stats.served + ' · burnt ' + r.stats.burnt + ' · biggest puff ' + r.stats.bestPuff + ' · Spice ' + BB.SPICE[r.spice].name),
          runRecap(r),
          unlocked ? h('div', { class: 'unlock' }, 'New Spice level unlocked: ', h('b', null, unlocked)) : null,
          h('div', { class: 'row-center' },
            btn('Play again', { cls: 'primary big', key: 'enter', onClick: startRun }),
            btn('Title screen', { cls: 'ghost', key: 't', onClick: showTitle })))));
    }, { scene: won ? 'title' : 'den', music: won ? 'win' : 'lose', hud: false });
    if (won) {
      SFX.play('fanfare');
      let n = 0;
      const t = setInterval(() => { if (screenEl.dataset.screen !== 'end' || n++ > 6) { clearInterval(t); return; } FX.confetti(200 + Math.random() * 880, 200 + Math.random() * 200, 50); }, 600);
    } else SFX.play('gameover');
  }

  // ---------------------------------------------------------------- boot
  unlockSpells();
  fit();
  requestAnimationFrame(frame);
  showTitle();
})();
