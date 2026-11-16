/* Bake or Bust! — pure game rules (no DOM). Loadable in the browser and in Node (dev/sim.js). */
(function (root) {
  'use strict';
  const BB = root.BB || (root.BB = {});

  // ---------------------------------------------------------------- RNG
  BB.makeRng = function (seed) {
    let a = seed >>> 0;
    const next = function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      int: (n) => Math.floor(next() * n),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      chance: (p) => next() < p,
      shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
      },
      weighted(items) { // [[value, weight], ...]
        let total = 0;
        for (const it of items) total += it[1];
        let r = next() * total;
        for (const it of items) { r -= it[1]; if (r < 0) return it[0]; }
        return items[items.length - 1][0];
      },
    };
  };

  // ---------------------------------------------------------------- Eggs
  BB.EGGS = {
    ember1: { name: 'Ember Egg', puff: 1, heat: 1, color: '#f7cf98', glyph: 'flame', desc: 'A warm everyday egg. +1 puff, +1 heat.' },
    ember2: { name: 'Hot Ember Egg', puff: 2, heat: 2, color: '#f2a35c', glyph: 'flame', desc: 'Runs hot. +2 puff, +2 heat.' },
    ember3: { name: 'Blazing Ember Egg', puff: 3, heat: 3, color: '#e3713a', glyph: 'flame', desc: 'Dangerously hot. +3 puff, +3 heat.' },
    yolk: { name: 'Golden Yolk', puff: 2, heat: 0, cost: 7, color: '#ffd23f', glyph: 'sun', desc: '+2 puff and no heat at all.' },
    frost: { name: 'Frost Egg', puff: 1, heat: -1, cost: 7, color: '#a6dcf7', glyph: 'snow', desc: '+1 puff and cools the oven by 1.' },
    clover: { name: 'Clover Egg', puff: 1, heat: 0, cost: 6, color: '#8bd673', glyph: 'clover', desc: '+1 puff, no heat, and +3 corn whenever drawn.' },
    pepper: { name: 'Pepper Egg', puff: 5, heat: 2, cost: 10, color: '#e8483c', glyph: 'pepper', desc: 'Fiery. +5 puff, +2 heat.' },
    moon: { name: 'Moon Egg', puff: 1, heat: 0, cost: 9, color: '#9a86ec', glyph: 'moon', desc: '+1 puff. Reveals the next egg so you can keep it or toss it aside.' },
    thunder: { name: 'Thunder Egg', puff: 0, heat: 1, cost: 12, color: '#4d74dc', glyph: 'bolt', desc: '+1 heat. Puff equals the number of eggs in the oven (itself included).' },
    phoenix: { name: 'Phoenix Egg', puff: 0, heat: 0, cost: 16, color: '#ff8a7a', glyph: 'feather', desc: 'Guardian. If an egg would burn the bake, the Phoenix bursts and throws that egg out instead.' },
    rotten: { name: 'Rotten Egg', puff: -1, heat: 2, color: '#9aa04e', glyph: 'stink', curse: true, desc: 'A curse from a burnt bake. −1 puff, +2 heat.' },
  };
  BB.EGG_ORDER = ['ember1', 'ember2', 'ember3', 'yolk', 'frost', 'clover', 'pepper', 'moon', 'thunder', 'phoenix', 'rotten'];
  BB.BUYABLE = ['yolk', 'frost', 'clover', 'pepper', 'moon', 'thunder', 'phoenix'];
  BB.START_BASKET = ['ember1', 'ember1', 'ember1', 'ember1', 'ember2', 'ember2', 'ember3', 'yolk', 'yolk', 'frost'];

  // ---------------------------------------------------------------- Acts & tiers
  BB.STEPS_PER_ACT = 4; // road forks per act, then the boss
  BB.ACTS = [
    { name: 'Clover Meadow', key: 'meadow', targets: [6, 9, 12], rewards: [5, 9, 14], boss: 'badger' },
    { name: 'Whisperwood', key: 'woods', targets: [9, 13, 17], rewards: [7, 12, 19], boss: 'owl' },
    { name: 'Velvetpaw Keep', key: 'castle', targets: [12, 17, 22], rewards: [9, 15, 24], boss: 'fox' },
  ];
  BB.TIERS = [
    { name: 'Humble', blurb: 'A simple bake.' },
    { name: 'Fancy', blurb: 'Pays well, plus a magic feather.' },
    { name: 'Legendary', blurb: 'Big pay, plus a free rare egg.' },
  ];

  BB.SPICE = [
    { name: 'Mild', text: 'The classic adventure.' },
    { name: 'Warm', text: 'Every target +1 puff.' },
    { name: 'Hot', text: '…and market prices are 25% higher.' },
    { name: 'Spicy', text: '…and you start with no corn and 1 feather.' },
    { name: 'Scorching', text: '…and you start with only 3 hearts.' },
    { name: 'Inferno', text: '…and bosses want +2 more puff.' },
  ];

  // ---------------------------------------------------------------- Quirks
  BB.QUIRKS = {
    sweet: { name: 'Sweet Tooth', text: 'Golden Yolks give +2 extra puff.', mods: { bonus: { yolk: 2 } } },
    chilly: { name: 'Likes It Chilly', text: 'Frost Eggs give +3 extra puff.', mods: { bonus: { frost: 3 } } },
    spicy: { name: 'Spice Fiend', text: 'Pepper Eggs give double puff.', mods: { mult: { pepper: 2 } } },
    smoky: { name: 'Smoky Crust', text: 'Ember Eggs give +1 extra puff.', mods: { bonus: { ember1: 1, ember2: 1, ember3: 1 } } },
    fussy: { name: 'Fussy Eater', text: 'The first egg gives no puff. Pays ×1.3.', mods: { firstFree: true, rewardMult: 1.3 } },
    impatient: { name: 'Impatient', text: 'Only 6 eggs fit in this bake. Pays ×1.3.', mods: { maxDraws: 6, rewardMult: 1.3 } },
    generous: { name: 'Big Tipper', text: 'Tips are tripled.', mods: { tipMult: 3 } },
    hurried: { name: 'In a Hurry', text: 'The oven starts at 2 heat. Pays ×1.5.', mods: { startHeat: 2, rewardMult: 1.5 } },
    lucky: { name: 'Superstitious', text: 'Clover Eggs give +3 extra puff.', mods: { bonus: { clover: 3 } } },
    stormy: { name: 'Storm Chaser', text: 'Thunder Eggs give +3 extra puff.', mods: { bonus: { thunder: 3 } } },
    moony: { name: 'Night Owl', text: 'Moon Eggs give +3 extra puff.', mods: { bonus: { moon: 3 } } },
  };

  // ---------------------------------------------------------------- Characters
  // Visual specs are consumed by art.js (critter generator).
  BB.CUSTOMERS = {
    mole: { name: 'Mabel the Mole', act: 0, look: { body: '#6e5a50', belly: '#c7ad98', ears: 'none', muzzle: '#f2a7b5', nose: '#e0607a', eyes: 'tiny', acc: 'glasses' }, line: 'I can smell a good crust from six feet under!' },
    rabbit: { name: 'Rosco Rabbit', act: 0, look: { body: '#d9d2cb', belly: '#ffffff', ears: 'long', inner: '#f5b4c2', muzzle: '#ffffff', nose: '#e86d86', acc: 'bow', accColor: '#3d8be0' }, line: 'Quick, quick! My burrow has a party tonight!' },
    goose: { name: 'Gertie Goose', act: 0, look: { body: '#f4f1ea', belly: '#ffffff', ears: 'none', beak: '#f39a2b', acc: 'bonnet', accColor: '#e86fa0' }, line: 'Honk. I mean — good day. Honk.' },
    hedgehog: { name: 'Hazel Hedgehog', act: 0, look: { body: '#9c7656', belly: '#f0d6b4', ears: 'round', spikes: '#5e4433', muzzle: '#f0d6b4', nose: '#3b2418', acc: 'scarf', accColor: '#d6452f' }, line: 'Something prickly-sweet, if you please.' },
    mouse: { name: 'Pip the Mouse', act: 0, look: { body: '#b8b0ab', belly: '#ece5df', ears: 'bigRound', inner: '#f5b4c2', muzzle: '#ece5df', nose: '#e86d86', acc: 'cap', accColor: '#2f9e6a' }, line: 'Is it true your oven is magic?!' },
    frog: { name: 'Fennel Frog', act: 1, look: { body: '#6fbf5a', belly: '#d8f0b0', ears: 'none', eyes: 'frog', muzzle: '#d8f0b0', acc: 'lilypad' }, line: 'Ribbit. Make it damp and delicious.' },
    squirrel: { name: 'Sprocket Squirrel', act: 1, look: { body: '#c5713a', belly: '#f3d5a8', ears: 'pointy', inner: '#f3d5a8', muzzle: '#f3d5a8', nose: '#3b2418', tail: '#c5713a', acc: 'goggles' }, line: 'I trade in acorns AND gossip. Bake well!' },
    bear: { name: 'Bramble Bear', act: 1, look: { body: '#7a4e2d', belly: '#c79a6b', ears: 'round', inner: '#c79a6b', muzzle: '#d9b48a', nose: '#2a1a10', acc: 'scarf', accColor: '#e0a32b' }, line: 'HUNGRY. Very hungry. Please.' },
    raccoon: { name: 'Rook Raccoon', act: 1, look: { body: '#8c8a90', belly: '#d9d7dc', ears: 'pointy', inner: '#3b3a40', muzzle: '#f1eff2', nose: '#2a2a2a', mask: '#3b3a40', acc: 'bandana', accColor: '#7b4bc4' }, line: 'I found this corn. Legitimately. Mostly.' },
    cat: { name: 'Saffron Cat', act: 1, look: { body: '#f0a447', belly: '#fde2b8', ears: 'pointy', inner: '#f5b4c2', muzzle: '#fde2b8', nose: '#e86d86', whiskers: true, acc: 'bell' }, line: 'Impress me, feathered one.' },
    weasel: { name: 'Sergeant Grimsby', act: 2, look: { body: '#a0703f', belly: '#f2e2c4', ears: 'round', inner: '#f2e2c4', muzzle: '#f2e2c4', nose: '#2a1a10', acc: 'helmet' }, line: 'Halt! Bake, or be escorted out.' },
    rat: { name: 'Whiskerton the Butler', act: 2, look: { body: '#8d8790', belly: '#cfc8d2', ears: 'bigRound', inner: '#f5b4c2', muzzle: '#cfc8d2', nose: '#e86d86', whiskers: true, acc: 'bowtie', accColor: '#1f1f2a' }, line: 'The Baron\'s guests expect perfection.' },
    wolf: { name: 'Chef Lupo', act: 2, look: { body: '#6f7480', belly: '#cfd3da', ears: 'pointy', inner: '#cfd3da', muzzle: '#cfd3da', nose: '#1f1f2a', snout: 'long', acc: 'chefhat' }, line: 'Another baker? Show me your fire.' },
    ferret: { name: 'Fizz the Ferret', act: 2, look: { body: '#e8dcc6', belly: '#fff8ea', ears: 'round', inner: '#f5b4c2', muzzle: '#fff8ea', nose: '#e86d86', mask: '#8a6a4e', acc: 'jester', accColor: '#d6452f' }, line: 'Hee! Bake me something chaotic!' },
    lynx: { name: 'Duchess Lynx', act: 2, look: { body: '#c9a27a', belly: '#f3e3cf', ears: 'tufted', inner: '#f3e3cf', muzzle: '#f3e3cf', nose: '#a0525a', whiskers: true, acc: 'tiara' }, line: 'Darling, I only eat legendary pastries.' },
  };

  BB.BOSSES = {
    badger: {
      name: 'Brunhilde Badger', title: 'Pie Judge of Clover Meadow',
      look: { body: '#5d5c62', belly: '#d6d4da', ears: 'round', inner: '#2b2a30', muzzle: '#f4f2f6', nose: '#1f1f2a', stripe: '#f4f2f6', acc: 'mortarboard' },
      line: 'Nobody passes my bridge without a proper pie.',
      rule: 'Iron Oven — your heat limit is 1 lower. But she adores a smoky crust: Ember Eggs give +1 puff.',
      target: 13, reward: 20, mods: { limit: -1, bonus: { ember1: 1, ember2: 1, ember3: 1 } },
    },
    owl: {
      name: 'Hootenanny', title: 'Owl Witch of Whisperwood',
      look: { body: '#8a6a9e', belly: '#e8dcef', ears: 'tufts', eyes: 'owl', beak: '#f0b43a', acc: 'witchhat', accColor: '#2d2140' },
      line: 'Hoo-hoo… let us see what your oven is truly worth.',
      rule: 'Hexed Basket — 2 Rotten Eggs are hexed into your basket for this bake. Moon Eggs give +3 puff.',
      target: 16, reward: 28, mods: { extraRotten: 2, bonus: { moon: 3 } },
    },
    fox: {
      name: 'Baron Velvetpaw', title: 'Thief of the Golden Egg',
      look: { body: '#e0742c', belly: '#fff3e2', ears: 'pointy', inner: '#3b2418', muzzle: '#fff3e2', nose: '#1f1f2a', snout: 'long', acc: 'tophat', monocle: true },
      line: 'Three courses, little hen. Win two and the Golden Egg is yours. Lose… and you are dessert.',
      rule: 'Grand Bake — three courses. Pass at least two. Every failed course costs a heart.',
      courses: [
        { name: 'Appetizer', target: 13, reward: 15, rule: 'A warm-up. No tricks… yet.', mods: {} },
        { name: 'Main Course', target: 17, reward: 20, rule: 'The Baron stokes the oven: it starts at 2 heat.', mods: { startHeat: 2 } },
        { name: 'Dessert', target: 21, reward: 30, rule: 'He slips a Rotten Egg in. Tips are doubled.', mods: { extraRotten: 1, tipMult: 2 } },
      ],
    },
  };

  BB.PASTRIES = ['Moonberry Muffin', 'Thunder Tart', 'Clover Crumble', 'Ember Eclair', 'Puffcloud Pie', 'Starlight Scone',
    'Wishing Waffle', 'Honeyhex Bun', 'Cauldron Cake', 'Fizzleberry Flan', 'Witchwood Strudel', 'Sunny Soufflé',
    'Gilded Galette', 'Dragonfruit Danish', 'Hocus Pocus Pudding', 'Comet Cobbler', 'Mystic Macaron', 'Bramble Brioche'];

  // ---------------------------------------------------------------- Run
  BB.newRun = function (seed, spice) {
    spice = spice || 0;
    const run = {
      seed, spice, rng: BB.makeRng(seed),
      hearts: spice >= 4 ? 3 : 4, maxHearts: 5,
      corn: 8, feathers: 2, maxFeathers: 5,
      limit: 7, ovenUps: 0,
      basket: BB.START_BASKET.slice(),
      act: 0, step: 0,
      usedCustomers: [],
      bossesBeaten: 0,
      courses: [],
      over: false, won: false,
      stats: { bakes: 0, served: 0, burnt: 0, under: 0, bestPuff: 0, legendary: 0, gamblesWon: 0, gamblesLost: 0, cornEarned: 0, phoenix: 0 },
    };
    if (spice >= 3) { run.corn = 0; run.feathers = 1; }
    return run;
  };

  BB.priceMult = (run) => (run.spice >= 2 ? 1.25 : 1);
  BB.price = (run, base) => Math.round(base * BB.priceMult(run));

  BB.countBasket = function (list) {
    const c = {};
    for (const t of list) c[t] = (c[t] || 0) + 1;
    return c;
  };

  BB.genOrderOption = function (run) {
    const rng = run.rng;
    const pool = Object.keys(BB.CUSTOMERS).filter((k) => BB.CUSTOMERS[k].act === run.act);
    let avail = pool.filter((k) => !run.usedCustomers.includes(k));
    if (!avail.length) { run.usedCustomers = run.usedCustomers.filter((k) => !pool.includes(k)); avail = pool; }
    const customer = rng.pick(avail);
    run.usedCustomers.push(customer);
    const relevant = Object.keys(BB.QUIRKS).filter((key) => {
      const m = BB.QUIRKS[key].mods;
      if (!run.basket.length) return false;
      if (m.firstFree && !run.basket.some((t) => t === 'thunder' || BB.EGGS[t].puff !== 0)) return false;
      if (m.startHeat && !run.basket.some((t) => BB.EGGS[t].heat > 0)) return false;
      const affected = Object.keys(Object.assign({}, m.bonus, m.mult));
      if (affected.length && !run.basket.some((t) => affected.includes(t))) return false;
      if (m.maxDraws && run.basket.length <= m.maxDraws) return false;
      return true;
    });
    const quirk = relevant.length && rng.chance(0.7) ? rng.pick(relevant) : null;
    return { kind: 'order', customer, quirk, pastry: rng.pick(BB.PASTRIES) };
  };

  BB.genChoices = function (run) {
    const rng = run.rng;
    if (run.step >= BB.STEPS_PER_ACT) return [{ kind: 'boss', boss: BB.ACTS[run.act].boss }];
    if (run.step === 0) {
      const a = BB.genOrderOption(run);
      let b = BB.genOrderOption(run);
      return [a, b];
    }
    const out = [];
    const kinds = [];
    const n = 3;
    for (let i = 0; i < n; i++) {
      let pool = [['order', 4], ['market', 2], ['den', 1.6], ['nest', 1.3], ['mystery', 2]];
      pool = pool.filter(([k]) => k === 'order' || !kinds.includes(k));
      if (run.step === BB.STEPS_PER_ACT - 1 && i === 0) pool = [['market', 1], ['nest', 1]];
      const k = rng.weighted(pool);
      kinds.push(k);
      out.push(k === 'order' ? BB.genOrderOption(run) : { kind: k });
    }
    if (!kinds.includes('order')) out[n - 1] = BB.genOrderOption(run);
    // keep orders in a friendly order: non-orders first is fine; shuffle for variety
    return rng.shuffle(out);
  };

  BB.orderTiers = function (run, opt) {
    const act = BB.ACTS[run.act];
    const q = opt.quirk ? BB.QUIRKS[opt.quirk].mods : {};
    const mult = q.rewardMult || 1;
    return [0, 1, 2].map((i) => ({
      tier: i,
      target: act.targets[i] + (run.spice >= 1 ? 1 : 0),
      reward: Math.round(act.rewards[i] * mult),
      feathers: i === 1 ? 1 : 0,
      eggPrize: i === 2,
    }));
  };

  BB.makeOrder = function (run, opt, tierIdx) {
    const t = BB.orderTiers(run, opt)[tierIdx];
    const q = opt.quirk ? BB.QUIRKS[opt.quirk].mods : {};
    return {
      kind: 'order', customer: opt.customer, quirk: opt.quirk, pastry: opt.pastry,
      tier: tierIdx, target: t.target, reward: t.reward, feathers: t.feathers, eggPrize: t.eggPrize,
      mods: q, heartLoss: 1,
    };
  };

  BB.makeBossOrder = function (run, bossKey, course) {
    const b = BB.BOSSES[bossKey];
    const extra = (run.spice >= 1 ? 1 : 0) + (run.spice >= 5 ? 2 : 0);
    if (bossKey === 'fox') {
      const c = b.courses[course];
      return { kind: 'boss', boss: bossKey, course, courseName: c.name, rule: c.rule, target: c.target + extra, reward: c.reward, feathers: 0, eggPrize: false, mods: c.mods, heartLoss: 1, pastry: c.name };
    }
    return { kind: 'boss', boss: bossKey, rule: b.rule, target: b.target + extra, reward: b.reward, feathers: 1, eggPrize: true, mods: b.mods, heartLoss: 2, pastry: bossKey === 'badger' ? 'Bridge-Toll Pie' : 'Hexmoon Cake' };
  };

  // ---------------------------------------------------------------- Bake engine
  BB.newBake = function (run, order, rng) {
    const mods = order.mods || {};
    const bag = run.basket.slice();
    for (let i = 0; i < (mods.extraRotten || 0); i++) bag.push('rotten');
    (rng || run.rng).shuffle(bag);
    return {
      order, mods, bag, aside: [], oven: [],
      heat: mods.startHeat || 0,
      limit: run.limit + (mods.limit || 0),
      maxDraws: mods.maxDraws || 99,
      corn: 0, peek: false, cluckUsed: false, state: 'baking',
    };
  };

  BB.eggPuff = function (bake, type) {
    const E = BB.EGGS[type];
    const m = bake.mods;
    let p = type === 'thunder' ? bake.oven.length + 1 : E.puff;
    if (m.bonus && m.bonus[type]) p += m.bonus[type];
    if (m.mult && m.mult[type]) p *= m.mult[type];
    if (m.firstFree && bake.oven.length === 0) p = 0;
    return p;
  };

  BB.bakePuff = function (bake) {
    let s = 0;
    for (const e of bake.oven) s += e.puff;
    return Math.max(0, s);
  };

  BB.canDraw = (bake) => bake.state === 'baking' && bake.bag.length > 0 && bake.oven.length < bake.maxDraws;

  BB.phoenixReady = (bake) => bake.oven.some((e) => e.type === 'phoenix' && !e.spent);

  BB.bakeDraw = function (bake) {
    if (!BB.canDraw(bake)) return null;
    const type = bake.bag.pop();
    bake.peek = false;
    const E = BB.EGGS[type];
    const puff = BB.eggPuff(bake, type);
    const newHeat = Math.max(0, bake.heat + E.heat);
    const ev = { type, puff, heatDelta: E.heat, corn: 0 };
    if (newHeat > bake.limit) {
      const ph = bake.oven.find((e) => e.type === 'phoenix' && !e.spent);
      if (ph) {
        ph.spent = true;
        bake.aside.push(type);
        ev.phoenix = true;
        return ev;
      }
      bake.oven.push({ type, puff, heat: E.heat, burner: true });
      bake.heat = newHeat;
      bake.state = 'burnt';
      ev.burnt = true;
      return ev;
    }
    bake.heat = newHeat;
    bake.oven.push({ type, puff, heat: E.heat });
    if (type === 'clover') { bake.corn += 3; ev.corn = 3; }
    if (type === 'moon' && bake.bag.length) { bake.peek = true; ev.peek = true; }
    return ev;
  };

  BB.bakeToss = function (bake) {
    if (!bake.peek || !bake.bag.length) return null;
    const t = bake.bag.pop();
    bake.aside.push(t);
    bake.peek = false;
    return t;
  };

  BB.SPELLS = {
    fan: { name: 'Wing Fan', cost: 1, text: 'Flap the flames down: −2 heat.' },
    eye: { name: "Hen's Eye", cost: 1, text: 'Peek at the next egg. Keep it or toss it aside.' },
    cluck: { name: 'Golden Cluck', cost: 2, text: 'Double the puff of the last egg. Once per bake.' },
  };

  BB.canCast = function (run, bake, spell) {
    if (bake.state !== 'baking') return false;
    const s = BB.SPELLS[spell];
    if (run.feathers < s.cost) return false;
    if (spell === 'fan') return bake.heat > 0;
    if (spell === 'eye') return !bake.peek && bake.bag.length > 0;
    if (spell === 'cluck') {
      if (bake.cluckUsed || !bake.oven.length) return false;
      return bake.oven[bake.oven.length - 1].puff > 0;
    }
    return false;
  };

  BB.cast = function (run, bake, spell) {
    if (!BB.canCast(run, bake, spell)) return false;
    run.feathers -= BB.SPELLS[spell].cost;
    if (spell === 'fan') bake.heat = Math.max(0, bake.heat - 2);
    if (spell === 'eye') bake.peek = true;
    if (spell === 'cluck') {
      const last = bake.oven[bake.oven.length - 1];
      last.puff *= 2; last.clucked = true; bake.cluckUsed = true;
    }
    return true;
  };

  BB.bakeServe = function (bake) {
    if (bake.state !== 'baking') return;
    bake.state = BB.bakePuff(bake) >= bake.order.target ? 'served' : 'under';
  };

  // Probability that the next draw burns the bake.
  BB.burnChance = function (bake) {
    if (bake.state !== 'baking' || !bake.bag.length) return 0;
    if (BB.phoenixReady(bake)) return 0;
    const cands = bake.peek ? [bake.bag[bake.bag.length - 1]] : bake.bag;
    let bad = 0;
    for (const t of cands) if (Math.max(0, bake.heat + BB.EGGS[t].heat) > bake.limit) bad++;
    return bad / cands.length;
  };

  // Apply a finished bake to the run. Returns a summary for the UI.
  BB.applyBake = function (run, bake) {
    const o = bake.order;
    const puff = BB.bakePuff(bake);
    const s = { result: bake.state, puff, target: o.target, reward: 0, tips: 0, cloverCorn: bake.corn, feathers: 0, heartsLost: 0, rotten: false, eggPrize: false };
    run.stats.bakes++;
    run.corn += bake.corn;
    if (bake.state === 'served') {
      s.reward = o.reward;
      s.tips = (puff - o.target) * ((bake.mods && bake.mods.tipMult) || 1);
      s.feathers = Math.min(o.feathers || 0, run.maxFeathers - run.feathers);
      s.eggPrize = !!o.eggPrize;
      run.corn += s.reward + s.tips;
      run.feathers += s.feathers;
      run.stats.served++;
      run.stats.bestPuff = Math.max(run.stats.bestPuff, puff);
      if (o.tier === 2) run.stats.legendary++;
    } else {
      s.heartsLost = Math.min(run.hearts, o.heartLoss || 1);
      run.hearts -= s.heartsLost;
      if (bake.state === 'burnt') { run.stats.burnt++; run.basket.push('rotten'); s.rotten = true; }
      else run.stats.under++;
    }
    run.stats.cornEarned += s.reward + s.tips + s.cloverCorn;
    if (bake.oven.some((e) => e.spent)) run.stats.phoenix++;
    return s;
  };

  BB.prizeChoices = function (run) {
    const pool = ['pepper', 'moon', 'thunder', 'phoenix', 'yolk', 'clover', 'frost'];
    const rng = run.rng;
    const a = rng.weighted([['pepper', 3], ['moon', 2], ['thunder', 2], ['phoenix', 1.2], ['yolk', 1.5]]);
    let b;
    do { b = rng.pick(pool); } while (b === a);
    return [a, b];
  };

  // ---------------------------------------------------------------- Odds estimate (Monte Carlo)
  BB.ODDS_POLICY = 'Approximate success over 500 shuffled baskets: serve at target; draw at up to 40% burn risk; toss unsafe Moon peeks; no feather spells. Thunder scaling and Phoenix saves included.';
  // Use the real draw engine, retaining safe peeks until the known egg is drawn.
  BB.estimateOdds = function (run, order, sims) {
    sims = sims || 400;
    const rng = BB.makeRng(run.seed ^ (order.target * 7919) ^ (run.basket.length * 104729));
    let ok = 0;
    for (let i = 0; i < sims; i++) {
      const b = BB.newBake(run, order, rng);
      for (;;) {
        if (BB.bakePuff(b) >= order.target) break;
        if (!BB.canDraw(b) || BB.burnChance(b) > 0.4) break;
        BB.bakeDraw(b);
        if (b.peek && b.bag.length) {
          const t = b.bag[b.bag.length - 1];
          if (Math.max(0, b.heat + BB.EGGS[t].heat) > b.limit && !BB.phoenixReady(b)) BB.bakeToss(b);
          // Keep a safe peek: the next burn probability is known, not a basket average.
        }
        if (b.state !== 'baking') break;
      }
      if (b.state === 'baking' && BB.bakePuff(b) >= order.target) ok++;
    }
    return ok / sims;
  };

  // ---------------------------------------------------------------- Market
  BB.OVEN_PRICES = [14, 20, 28];
  BB.genShop = function (run) {
    const rng = run.rng;
    const weights = [['yolk', 3], ['frost', 2.5], ['clover', 2.5], ['pepper', 3], ['moon', 2], ['thunder', 1.5 + run.act], ['phoenix', 0.8 + 0.5 * run.act]];
    const eggs = [];
    while (eggs.length < 4) {
      const t = rng.weighted(weights);
      if (eggs.filter((e) => e.type === t).length >= 1 && rng.chance(0.75)) continue;
      eggs.push({ type: t, price: BB.price(run, BB.EGGS[t].cost), sold: false });
    }
    return { eggs, ovenBought: false, crackUsed: false };
  };
  BB.servicePrice = function (run, what) {
    if (what === 'oven') return run.ovenUps >= BB.OVEN_PRICES.length ? null : BB.price(run, BB.OVEN_PRICES[run.ovenUps]);
    if (what === 'feather') return BB.price(run, 5);
    if (what === 'heal') return BB.price(run, 9);
    if (what === 'crack') return BB.price(run, 5);
    return null;
  };

  // ---------------------------------------------------------------- Nest
  BB.broodTarget = function (run) {
    for (const t of ['rotten', 'ember3', 'ember2', 'ember1']) if (run.basket.includes(t)) return t;
    return null;
  };

  // ---------------------------------------------------------------- Mystery events
  // Each event: id, title, icon, text, choices [{label, hint, can(run), go(run) -> {text, good}}]
  function removeOne(run, type) {
    const i = run.basket.indexOf(type);
    if (i >= 0) { run.basket.splice(i, 1); return true; }
    return false;
  }
  BB.EVENTS = [
    {
      id: 'well', title: 'The Wishing Well', icon: 'well',
      text: 'A mossy well hums with old magic. A sign reads: "Toss 8 corn. Make a wish. Maybe."',
      choices: [
        { label: 'Toss 8 corn', hint: '50%: a Phoenix Egg', can: (r) => r.corn >= 8, go(r) { r.corn -= 8; if (r.rng.chance(0.5)) { r.basket.push('phoenix'); return { text: 'A flaming egg bobs up from the dark water! You gain a Phoenix Egg.', good: true, egg: 'phoenix' }; } return { text: 'Plink. The well burps. Nothing happens.', good: false }; } },
        { label: 'Walk on', hint: 'Nothing ventured', go: () => ({ text: 'You keep your corn and your dignity.', good: null }) },
      ],
    },
    {
      id: 'witch', title: 'The Hedge Witch', icon: 'witch',
      text: 'A hedge witch offers to enchant your oven. "Bigger fire, bigger bakes! Side effects may include smell."',
      choices: [
        { label: 'Enchant it', hint: '+1 heat limit, +2 Rotten Eggs', go(r) { r.limit += 1; r.basket.push('rotten', 'rotten'); return { text: 'Your oven roars hotter (+1 heat limit)… and two Rotten Eggs roll into your basket.', good: true }; } },
        { label: 'Politely decline', hint: 'No change', go: () => ({ text: '"Suit yourself, feathers."', good: null }) },
      ],
    },
    {
      id: 'chick', title: 'A Lost Chick', icon: 'chick',
      text: 'A tiny chick is lost in the tall grass, peeping sadly. Guiding it home would take a bit of magic.',
      choices: [
        { label: 'Spend 1 feather', hint: 'Its family rewards you', can: (r) => r.feathers >= 1, go(r) { r.feathers -= 1; r.basket.push('clover'); r.corn += 5; return { text: 'The chick\'s family showers you with thanks: a Clover Egg and 5 corn!', good: true, egg: 'clover' }; } },
        { label: 'Point the way', hint: 'Free, and kind of rude', go: () => ({ text: 'You point vaguely west. The chick waddles off. You feel slightly bad.', good: null }) },
      ],
    },
    {
      id: 'mushroom', title: 'The Glowing Ring', icon: 'mushroom',
      text: 'A ring of glowing mushrooms. One of them winks at you. Fairy food — delicious or dangerous.',
      choices: [
        { label: 'Eat the winking one', hint: '50%: +1 max heart & heal · 50%: −1 heart', go(r) { if (r.rng.chance(0.5)) { r.maxHearts += 1; r.hearts = Math.min(r.maxHearts, r.hearts + 1); return { text: 'Your feathers sparkle! +1 max heart, and you heal 1.', good: true }; } r.hearts -= 1; return { text: 'Blegh! Your tummy rumbles ominously. −1 heart.', good: false }; } },
        { label: 'Leave the ring alone', hint: 'Wise', go: () => ({ text: 'The mushroom looks disappointed.', good: null }) },
      ],
    },
    {
      id: 'crow', title: 'The Peddling Crow', icon: 'crow',
      text: '"Psst. Swap you two of yer eggs — I pick, sight unseen — for one o\' my shiny Thunder Eggs."',
      choices: [
        { label: 'Make the trade', hint: 'Lose 2 random eggs, gain a Thunder Egg', can: (r) => r.basket.length >= 4, go(r) { const lost = []; for (let i = 0; i < 2; i++) { const t = r.rng.pick(r.basket); removeOne(r, t); lost.push(BB.EGGS[t].name); } r.basket.push('thunder'); return { text: 'The crow snatches your ' + lost.join(' and ') + ' and leaves a crackling Thunder Egg.', good: true, egg: 'thunder' }; } },
        { label: 'Shoo!', hint: 'Keep your eggs', go: () => ({ text: '"Yer loss, chicken."', good: null }) },
      ],
    },
    {
      id: 'storm', title: 'Lightning Storm', icon: 'storm',
      text: 'Thunder rolls over the hills. Lightning loves a hen in a pointy hat. You could catch a bolt in an egg…',
      choices: [
        { label: 'Hold up an egg', hint: '60%: Thunder Egg · 40%: −1 heart', go(r) { if (r.rng.chance(0.6)) { r.basket.push('thunder'); return { text: 'KRAK! The egg crackles with captured lightning. Thunder Egg gained!', good: true, egg: 'thunder' }; } r.hearts -= 1; return { text: 'KRAK! The bolt finds you instead. Smoky feathers, −1 heart.', good: false }; } },
        { label: 'Shelter under a tree', hint: 'Lose 1 feather to the wind', go(r) { const l = r.feathers > 0 ? 1 : 0; r.feathers -= l; return { text: l ? 'You stay dry, but the wind steals a magic feather.' : 'You stay dry and wait it out.', good: null }; } },
      ],
    },
    {
      id: 'corn', title: 'Golden Cornfield', icon: 'corn',
      text: 'A farmer\'s field, heavy with golden corn. The farmer is napping. Mostly.',
      choices: [
        { label: 'Peck politely', hint: '+6 corn', go(r) { r.corn += 6; return { text: 'You nibble a respectable 6 corn.', good: true }; } },
        { label: 'Peck greedily', hint: '70%: +16 corn · 30%: −1 heart', go(r) { if (r.rng.chance(0.7)) { r.corn += 16; return { text: 'Gobble gobble! 16 corn and the farmer never stirred.', good: true }; } r.hearts -= 1; return { text: 'The farmer wakes up with a broom. −1 heart!', good: false }; } },
      ],
    },
    {
      id: 'rat', title: 'Double-or-Nothing Rat', icon: 'dice',
      text: 'A rat with a gold tooth flips a coin. "Heads, I double yer corn. Tails, I take half. Feelin\' lucky?"',
      choices: [
        { label: 'Flip the coin', hint: '50%: corn ×2 · 50%: corn ÷2', can: (r) => r.corn > 0, go(r) { if (r.rng.chance(0.5)) { r.corn *= 2; r.stats.gamblesWon++; return { text: 'Heads! Your corn doubles to ' + r.corn + '!', good: true }; } r.corn = Math.floor(r.corn / 2); r.stats.gamblesLost++; return { text: 'Tails. The rat pockets half your corn, grinning.', good: false }; } },
        { label: 'Not today', hint: 'Keep your corn', go: () => ({ text: '"Coward!" the rat squeaks cheerfully.', good: null }) },
      ],
    },
    {
      id: 'oven', title: 'Abandoned Bakery', icon: 'bakery',
      text: 'A ruined bakery. In the ashes of its oven, something still glows.',
      choices: [
        { label: 'Dig in the ashes', hint: '50%: Pepper Egg · 50%: Rotten Egg', go(r) { if (r.rng.chance(0.5)) { r.basket.push('pepper'); return { text: 'A Pepper Egg, still warm! Into the basket it goes.', good: true, egg: 'pepper' }; } r.basket.push('rotten'); return { text: 'Ugh — a Rotten Egg cracks in your basket.', good: false, egg: 'rotten' }; } },
        { label: 'Sweep the old hearth', hint: 'Remove your worst egg', go(r) { const t = BB.broodTarget(r); if (t) { removeOne(r, t); return { text: 'You sweep a ' + BB.EGGS[t].name + ' out of your basket. Lighter already.', good: true }; } return { text: 'Nothing to sweep.', good: null }; } },
      ],
    },
  ];

  BB.pickEvent = function (run) {
    run.seenEvents = run.seenEvents || [];
    let pool = BB.EVENTS.filter((e) => !run.seenEvents.includes(e.id));
    if (!pool.length) { run.seenEvents = []; pool = BB.EVENTS; }
    const e = run.rng.pick(pool);
    run.seenEvents.push(e.id);
    return e;
  };

  // ---------------------------------------------------------------- Score
  BB.score = function (run) {
    const parts = [
      ['Corn in pocket', run.corn],
      ['Hearts left × 15', Math.max(0, run.hearts) * 15],
      ['Feathers × 5', run.feathers * 5],
      ['Bosses beaten × 25', run.bossesBeaten * 25],
      ['Legendary bakes × 10', run.stats.legendary * 10],
    ];
    if (run.won) parts.push(['Golden Egg recovered', 100 + 50 * run.spice]);
    let total = 0;
    for (const p of parts) total += p[1];
    return { parts, total };
  };
  BB.rank = function (total, won) {
    if (!won) return total >= 120 ? 'Singed but Proud' : total >= 60 ? 'Half-Baked' : 'Scrambled';
    if (total >= 420) return 'Legendary Hen';
    if (total >= 320) return 'Golden Yolk';
    if (total >= 240) return 'Sunny Side Up';
    return 'Over Easy';
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* v2 content and shared rules. Extends the original tables and bookkeeping above. */
(function (root) {
  'use strict';
  const B = root.BB;
  B.baseEgg = t => B.EGGS[t].base || t;
  B.hasBaseEgg = (r, ...types) => r.basket.some(t => types.includes(B.baseEgg(t)));
  const combos = [
    ['butter', 'Butter Egg', 1, 1, 8, '#ffe594', 'butter', 'Next drawn egg gets ×2 puff.'],
    ['honey', 'Honeycomb Egg', 1, 0, 9, '#efb54b', 'honey', '+1 puff per zero-heat or cooling egg already baked, plus itself (minimum +2).'],
    ['cinnamon', 'Cinnamon Egg', 2, 1, 9, '#c67a4a', 'cinnamon', '+2 extra puff when drawn at heat ≥ limit −2.'],
    ['echo', 'Echo Egg', 0, 1, 9, '#c4acef', 'echo', 'Copies previous egg’s final puff; +2 puff if first.'],
    ['meringue', 'Meringue Egg', 1, -1, 10, '#fff5e9', 'meringue', '+3 extra puff with at least 5 eggs already in the oven.']
  ];
  combos.forEach(([id,name,puff,heat,cost,color,glyph,desc]) => {
    B.EGGS[id] = {name,puff,heat,cost,color,glyph,combo:id,desc}; B.BUYABLE.push(id); B.EGG_ORDER.push(id);
  });
  B.EGGS.clover.corn = 3; B.EGGS.moon.peek = true; B.EGGS.phoenix.guard = true; B.EGGS.thunder.thunderMult = 1;
  B.UPGRADES = {};
  const upgrades = {
    ember1: [['Toasted Egg',2,1], ['Crackling Ember',3,2]],
    ember2: [['Hearth Egg',3,1], ['Wildfire Egg',5,3]],
    ember3: [['Cinder Egg',4,1], ['Inferno Egg',7,4]],
    yolk: [['Royal Yolk',3,0], ['Brioche Yolk',2,0,{nextBonus:2}]],
    frost: [['Glacier Egg',1,-2], ['Mint Cream Egg',3,-1]],
    clover: [['Dewdrop Clover',2,-1,{corn:3}], ['Four-Leaf Egg',2,0,{corn:5}]],
    pepper: [['Smoked Paprika',5,1], ['Ghost Pepper',8,3]],
    moon: [['Eclipse Egg',1,-1,{tossBonus:2}], ['Full Moon',3,0]],
    thunder: [['Cloudburst',0,0], ['Tempest',0,2,{thunderMult:2}]],
    phoenix: [['Rebirth Egg',0,0,{saveCool:2}], ['Sunbird Egg',3,0]]
  };
  Object.entries(upgrades).forEach(([base, variants]) => {
    B.UPGRADES[base] = variants.map(([name,puff,heat,extra], i) => {
      const branch = i ? 'hot' : 'cool', id = base + '_' + branch;
      const E = B.EGGS[id] = {...B.EGGS[base],name,puff,heat,base,tier:2,branch,...extra};
      E.desc = (E.thunderMult ? (E.thunderMult === 2 ? '2×' : '') + 'oven egg count' : '+' + puff) + ' puff, ' + (heat > 0 ? '+' : '') + heat + '°.' +
        (E.corn ? ' +' + E.corn + ' corn on draw.' : '') + (E.peek ? ' Peek at next egg.' : '') + (E.tossBonus ? ' Tossed peek: +2 bonus puff.' : '') +
        (E.nextBonus ? ' Next egg: +2 puff.' : '') + (E.guard ? ' Saves one fatal draw.' : '') + (E.saveCool ? ' Save also cools −2°.' : '');
      B.EGG_ORDER.push(id); return id;
    });
  });
  B.broodChoices = r => {
    const types = [...new Set(r.basket)].filter(t => B.UPGRADES[t]);
    r.rng.shuffle(types); return (r.basket.includes('rotten') ? ['rotten'] : []).concat(types).slice(0,3);
  };
  B.upgradeEgg = (r, type, branch) => {
    const i = r.basket.indexOf(type); if (i < 0) return false;
    const to = type === 'rotten' ? (branch === 0 ? 'yolk' : null) : (B.UPGRADES[type] || [])[branch];
    if (!to && type !== 'rotten') return false;
    r.basket.splice(i,1); if (to) r.basket.push(to); else r.corn += 8;
    r.stats.upgrades++; return true;
  };
  B.CHARMS = {};
  [
    ['whisk','Tin Whisk','common',13,'simmer','Cooling eggs give +1 puff.'],
    ['bowl','Porcelain Bowl','common',14,'simmer','5th and 10th oven eggs each give +2 puff.'],
    ['icebox','Icebox Door','uncommon',20,'simmer','First heat-adding egg each bake adds 1 less heat.'],
    ['apron','Glazed Apron','uncommon',16,'simmer','Zero-heat eggs give +1 puff with ≥3 eggs already baked.'],
    ['cryo','Cryo-Crown','rare',30,'simmer','Cooling eggs, Wing Fan and Cryo-Cackle give +2 bonus puff.'],
    ['kettle','Copper Kettle','common',13,'fry','Eggs with printed heat ≥2° give +1 puff.'],
    ['bellows','Bellows','uncommon',19,'fry','+1 oven limit on pickup. Eggs drawn at the limit give +1 puff.'],
    ['mitt','Asbestos Mitt','uncommon',22,'fry','Once/bake, survive a draw at exactly limit +1°, set heat to limit.'],
    ['pbell','Phoenix Bell','uncommon',20,'fry','Phoenix or Plume saves give +4 bonus puff and +5 corn.'],
    ['grinder','Dragon Grinder','rare',32,'fry','Every egg drawn at heat ≥ limit −1 gives +3 puff.'],
    ['spoon','Silver Spoon','common',12,'alchemy','Tossing a peeked egg gives +2 bonus puff.'],
    ['brooch','Quill Brooch','common',15,'alchemy','+1 max feather. Gain 1 feather now and at each new act.'],
    ['stormrod','Storm Rod','uncommon',18,'alchemy','Thunder, Echo and Butter give +2 puff; Butter also gives +1 corn.'],
    ['mirror','Mirror Tray','uncommon',21,'alchemy','Once/bake, the 3rd oven egg gives its puff twice.'],
    ['featherwt','Arcane Featherweight','rare',34,'alchemy','First spell each bake costs 1 fewer feather (minimum 0).'],
    ['tipjar','Tip Jar','common',12,'goose','+1 corn per excess puff when tips are enabled (×2 normally, ×4 Big Tipper).'],
    ['cornucopia','Cornucopia','common',14,'goose','Serves pay +2 corn (+4 bosses). Clover gives +1 corn.'],
    ['ledger',"Merchant’s Ledger",'common',15,'goose','All market prices 20% off, rounded down. Act I–II stock only.'],
    ['nestegg','Warm Nest Egg','uncommon',18,'goose','+1 max heart and heal 1 (Spice 9 cap: 4). Full-heart boss bakes start with +3 puff.'],
    ['pin','Golden Rolling Pin','rare',28,'goose','First egg each bake gives +3 puff. Golden Yolks give +1 puff.']
  ].forEach(([id,name,rarity,cost,arch,text]) => { B.CHARMS[id] = {name,rarity,cost,arch,text}; });
  B.hasCharm = (r,id) => (r.charms || []).includes(id);
  B.addCharm = (r,id) => {
    if (!B.CHARMS[id] || B.hasCharm(r,id)) return false;
    r.charms.push(id);
    if (id === 'bellows') r.limit++;
    if (id === 'brooch') { r.maxFeathers++; r.feathers = Math.min(r.maxFeathers,r.feathers+1); }
    if (id === 'nestegg') { r.maxHearts = Math.min(r.spice >= 9 ? 4 : 99,r.maxHearts+1); r.hearts = Math.min(r.maxHearts,r.hearts+1); }
    return true;
  };
  B.charmChoices = (r,source,n) => {
    const pool = Object.keys(B.CHARMS).filter(id => !B.hasCharm(r,id) &&
      (source !== 'boss' || B.CHARMS[id].rarity !== 'common') &&
      (source !== 'mystery' || B.CHARMS[id].rarity !== 'rare') &&
      (source !== 'market' || (r.act > 0 || B.CHARMS[id].rarity !== 'rare')) && (id !== 'ledger' || r.act < 2));
    const out = [];
    while (pool.length && out.length < n) {
      const id = r.rng.weighted(pool.map(id => [id, ({common:45,uncommon:40,rare:15})[B.CHARMS[id].rarity]/pool.filter(t=>B.CHARMS[t].rarity===B.CHARMS[id].rarity).length]));
      out.push(id); pool.splice(pool.indexOf(id),1);
    }
    return out;
  };
  B.SPICE.push(
    {name:'Smoked',text:'…and one starting Ember is replaced by a Rotten Egg.'},
    {name:'Flashpoint',text:'…and Acts II–III start +1° hot; markets stock only 3 eggs.'},
    {name:'Bitter Crowd',text:'…and non-boss ovens hold 8 eggs; Rotten Eggs add +3°.'},
    {name:'Gilded Inferno',text:'…and hearts cap at 4, Act III forks have 2 paths, bosses gain an Enraged rule.'}
  );
  const oldRun = B.newRun;
  B.newRun = (seed,spice) => {
    const r = oldRun(seed,spice);
    r.charms = []; r.spells = ['fan','eye','cluck'];
    r.actBosses = [r.rng.pick(['badger','boar']),r.rng.pick(['owl','turtle']),r.rng.pick(['fox','gala'])];
    if (spice >= 6) r.basket.splice(r.basket.indexOf('ember1'),1,'rotten');
    if (spice >= 9) r.maxHearts = 4;
    Object.assign(r.stats,{upgrades:0,cornSpent:0,restocks:0,spells:0,charmTriggers:0,denNet:0}); return r;
  };
  B.price = (r,base) => Math.max(1,Math.floor(base * B.priceMult(r) * (B.hasCharm(r,'ledger') ? .8 : 1)));
  B.OVEN_PRICES = [12,18,25,34];
  B.servicePrice = (r,id,shop) => id === 'oven' ? (r.ovenUps >= 4 ? null : B.price(r,B.OVEN_PRICES[r.ovenUps])) :
    B.price(r,({feather:6,heal:10,crack:5,temper:12,restock:5+4*((shop && shop.restocks)||0)})[id]);
  B.genShop = r => {
    const count = r.spice >= 7 ? 3 : 4;
    const weights = [
      ['yolk', 3.2], ['frost', 2.8], ['clover', 2.6], ['pepper', 2.8],
      ['moon', 2], ['butter', 2.2], ['honey', 2], ['cinnamon', 1.8],
      ['echo', 1.5], ['meringue', 1.4], ['thunder', 1.4 + 0.9 * r.act],
      ['phoenix', 0.8 + 0.5 * r.act]
    ];
    const eggs = [];
    while (eggs.length < count) {
      const type = r.rng.weighted(weights);
      if (eggs.some(e => e.type === type) && r.rng.chance(0.75)) continue;
      eggs.push({ type, price: B.price(r, B.EGGS[type].cost), sold: false });
    }
    return {
      eggs,
      charms: B.charmChoices(r, 'market', 2).map(type => ({ type, price: B.price(r, B.CHARMS[type].cost), sold: false })),
      ovenBought: false, crackUsed: false, temperUsed: false, restocks: 0
    };
  };
  B.restockShop = (r,shop) => {
    const fresh = B.genShop(r);
    ['eggs','charms'].forEach(k => {
      const available = fresh[k].slice();
      shop[k].forEach(it => { if (!it.sold && available.length) Object.assign(it,available.shift()); });
    }); shop.restocks++;
  };
  // Distinctive customer rules combine with a separately rolled relevant quirk.
  const signatures = {
    raccoon:['Sly Pockets','1 random egg set aside before baking; +4 corn on serve.',{slyPocket:true,bonusPay:4}],
    squirrel:['Steam Valve','Draws after the 6th egg add +1°; +3 corn, tips ×1.5.',{after6Heat:true,tipMult:1.5,bonusPay:3}],
    cat:['Picky Palate','3rd+ copy of the same base egg gives −1 puff; +3 corn on serve.',{pickyDup:true,bonusPay:3}],
    weasel:['Rationing','At most 1 spell this bake; +5 corn on serve.',{maxSpells:1,bonusPay:5}],
    rat:['Etiquette','No tips above limit −2°; at or below it, tips ×3.',{etiquette:true}],
    wolf:['Open Flame','Start at 2°; Ember and Pepper eggs give +2 puff.',{startHeat:2,bonus:{ember1:2,ember2:2,ember3:2,pepper:2}}],
    ferret:['Chaotic Order','Every 3rd egg: ×2 puff and +1° heat.',{fizzChaos:true}],
    lynx:['High Society','Only Fancy/Legendary; basic Ember (Ember1) gives 0 puff; +6 corn.',{noEmber1:true,bonusPay:6}]
  };
  Object.entries(signatures).forEach(([id,[name,text,mods]]) => { B.CUSTOMERS[id].signature = {name,text,mods}; });
  [
    ['brittle','Crisp & Fragile','Limit −1°; tips ×2, payment ×1.3.',{limit:-1,tipMult:2,rewardMult:1.3}],
    ['slowbake','Slow Rise','Draw at least 5 eggs before serving; payment ×1.35.',{minDraws:5,rewardMult:1.35}],
    ['taster','Royal Taster','2nd egg gets ×2 puff; target +2.',{secondDouble:true,targetDelta:2}],
    ['bargain','Haggle','No tips; payment ×1.4.',{tipMult:0,rewardMult:1.4}],
    ['volatile','Boiling Pot','Zero-heat eggs add +1° instead; payment ×1.4.',{zeroToOne:true,rewardMult:1.4}],
    ['encore','Encore','Serve with 0 spells cast to gain +1 feather.',{zeroSpellFeather:true}]
  ].forEach(([id,name,text,mods]) => { B.QUIRKS[id] = {name,text,mods}; });
  Object.values(B.QUIRKS).forEach(q => {
    const affected = Object.keys({...q.mods.bonus,...q.mods.mult});
    if (affected.length) q.requires = r => B.hasBaseEgg(r,...affected);
  });
  const oldOption = B.genOrderOption;
  // Preserve the existing no-repeat customer selection, then re-roll from the v2 relevance pool.
  B.genOrderOption = r => {
    const opt = oldOption(r), c = B.CUSTOMERS[opt.customer];
    const relevant = Object.keys(B.QUIRKS).filter(k => {
      const q=B.QUIRKS[k], m=q.mods;
      return r.basket.length && (!q.requires || q.requires(r)) && (!m.maxDraws || r.basket.length>m.maxDraws) &&
        (!m.firstFree || r.basket.some(t => B.EGGS[t].puff || B.baseEgg(t)==='thunder' || B.baseEgg(t)==='echo')) &&
        (!m.startHeat || r.basket.some(t => B.EGGS[t].heat>0)) && (!m.zeroToOne || r.basket.some(t => B.EGGS[t].heat===0)) &&
        (!m.minDraws || r.basket.length>=m.minDraws);
    });
    opt.quirk = relevant.length && r.rng.chance(.7) ? r.rng.pick(relevant) : null;
    opt.signature = !!c.signature && (r.act===2 || r.rng.chance(.6)); return opt;
  };
  B.orderMods = opt => {
    const a = opt.quirk ? B.QUIRKS[opt.quirk].mods : {}, c=B.CUSTOMERS[opt.customer];
    const b = opt.signature && c.signature ? c.signature.mods : {};
    const m = {...a,...b,bonus:{...a.bonus,...b.bonus}};
    Object.keys(a.bonus||{}).forEach(k => {m.bonus[k]=(a.bonus[k]||0)+(b.bonus && b.bonus[k]||0);});
    if (a.startHeat && b.startHeat) m.startHeat = a.startHeat + b.startHeat;
    return m;
  };
  B.orderTiers = (r,opt) => {
    const act=B.ACTS[r.act], m=B.orderMods(opt);
    return [0,1,2].map(i => ({tier:i,target:act.targets[i]+(r.spice>=1?1:0)+(m.targetDelta||0),
      reward:Math.round(act.rewards[i]*(m.rewardMult||1))+(r.act===2?4:0)+(m.bonusPay||0),feathers:i===1?1:0,eggPrize:i===2}));
  };
  B.makeOrder = (r,opt,tier) => ({...opt,...B.orderTiers(r,opt)[tier],mods:B.orderMods(opt),heartLoss:1});
  const oldChoices=B.genChoices;
  B.genChoices = r => {
    if (r.step>=B.STEPS_PER_ACT) return [{kind:'boss',boss:r.actBosses[r.act]}];
    let choices=oldChoices(r);
    if(r.spice>=9 && r.act===2 && choices.length>2) {
      const order=choices.find(c=>c.kind==='order'); choices=choices.slice(0,2);
      if(!choices.some(c=>c.kind==='order')) choices[1]=order;
    }
    return choices;
  };
  B.BOSSES.owl.target = 13;
  B.BOSSES.boar = {name:'Marshal Brambleboar',title:'Keeper of the Toll Gate',look:{body:'#976747',belly:'#e4c49a',ears:'pointy',snout:'pig',muzzle:'#c6957c',tusks:true,acc:'helmet'},
    line:'Six eggs, hen. Make every one count.',rule:'Toll Gate — at most 6 eggs. Pepper, Blazing Ember and Cinnamon give +3 puff.',target:10,reward:20,mods:{maxDraws:6,bonusHeavy:3}};
  B.BOSSES.turtle = {name:'Old Shellback',title:'Copper Crust Connoisseur',look:{body:'#64926a',belly:'#d9c58c',ears:'none',muzzle:'#a4bd7e',acc:'glasses',shell:true},
    line:'Slowly now. A good crust takes patience.',rule:'Copper Crust — every even draw adds +1°; cooling eggs give +3 puff.',target:14,reward:28,mods:{evenHeat:true,coolBonus:3}};
  B.BOSSES.gala = {...B.BOSSES.fox,title:'Midnight Gala',rule:'Midnight Gala — win 2 of 3 courses. Appetizer: 6 eggs; Main: every 3rd egg ×2 puff/+1°; Dessert: first egg 0 puff, pay ×1.5, tips ×2.',courses:[
    {name:'Appetizer',target:14,reward:16,rule:'Only 6 eggs fit.',mods:{maxDraws:6}},
    {name:'Main Course',target:18,reward:22,rule:'Every 3rd egg: ×2 puff, +1° heat.',mods:{fizzChaos:true}},
    {name:'Dessert',target:22,reward:32,rule:'First egg gives 0 puff. Payment ×1.5; tips ×2.',mods:{firstFree:true,rewardMult:1.5,tipMult:2}}
  ]};
  B.BOSSES.fox.rule='Classic Feast — win 2 of 3 courses. Appetizer: no trick; Main: start at 2°; Dessert: +1 Rotten Egg, tips ×2.';
  B.enraged = (key,course) => ({badger:{maxDraws:7},boar:{startHeat:1},owl:{startHeat:1},turtle:{limit:-1},
    fox:[{startHeat:1},{maxDraws:7},{startHeat:1}][course||0],gala:[{startHeat:1},{extraRotten:1},{limit:-1}][course||0]})[key];
  B.enragedText = (key,course) => Object.entries(B.enraged(key,course)).map(([k,v]) => ({maxDraws:'At most '+v+' eggs.',startHeat:'Start +'+v+'° hotter.',limit:'Heat limit −1°.',extraRotten:'+1 Rotten Egg.'})[k]).join(' ');
  B.bossRule = (r,key) => B.BOSSES[key].rule + (r.spice>=9 ? ' Enraged: '+(B.BOSSES[key].courses?[0,1,2].map(i=>B.BOSSES[key].courses[i].name+': '+B.enragedText(key,i)).join(' '):B.enragedText(key)) : '');
  B.makeBossOrder = (r,key,course) => {
    const boss=B.BOSSES[key], c=boss.courses && boss.courses[course], d=c||boss;
    const mods={...d.mods,...(r.spice>=9?B.enraged(key,course):{})};
    return {kind:'boss',boss:key,course,courseName:c&&c.name,rule:(c?c.rule:boss.rule)+(r.spice>=9?' Enraged: '+B.enragedText(key,course):''),
      target:d.target+(r.spice>=1?1:0)+(r.spice>=5?2:0),reward:Math.round(d.reward*(mods.rewardMult||1)),feathers:c?0:1,eggPrize:!c,
      mods,heartLoss:c?1:2,pastry:c?c.name:'House Special Pie'};
  };
  B.trigger = (b,id,text) => { b.triggers.push({id,text}); };
  B.newBake = (r,order,rng) => {
    const mods=order.mods||{}, bag=r.basket.slice();
    for(let i=0;i<(mods.extraRotten||0);i++) bag.push('rotten');
    (rng||r.rng).shuffle(bag);
    const b={order,mods,bag,aside:[],oven:[],charms:(r.charms||[]).slice(),spice:r.spice,
      heat:(mods.startHeat||0)+(r.spice>=7&&r.act>=1?1:0),limit:r.limit+(mods.limit||0),
      maxDraws:Math.min(mods.maxDraws||99,r.spice>=8&&order.kind!=='boss'?8:99),minDraws:mods.minDraws||0,
      maxSpells:mods.maxSpells||99,spellsCast:0,bonusPuff:0,nextMult:1,nextBonus:0,
      iceboxReady:B.hasCharm(r,'icebox'),mittReady:B.hasCharm(r,'mitt'),freeSpellReady:B.hasCharm(r,'featherwt'),
      mirrorReady:B.hasCharm(r,'mirror'),corn:0,peek:false,cluckUsed:false,state:'baking',triggers:[],rng:rng||r.rng};
    if(mods.slyPocket&&bag.length) b.aside.push(bag.pop());
    if(B.hasCharm(r,'nestegg')&&r.hearts===r.maxHearts&&order.kind==='boss') { b.bonusPuff=3; B.trigger(b,'nestegg','Full nest! +3 puff'); }
    return b;
  };
  const charm=(b,id)=>b.charms.includes(id);
  B.eggHeat = (b,t) => {
    let heat=B.EGGS[t].heat;
    if(t==='rotten'&&b.spice>=8) heat=3;
    if(b.mods.zeroToOne&&heat===0) heat=1;
    if(b.mods.evenHeat&&(b.oven.length+1)%2===0) heat++;
    if(b.mods.fizzChaos&&(b.oven.length+1)%3===0) heat++;
    if(b.mods.after5Heat&&b.oven.length>=5) heat++;
    if(b.mods.after6Heat&&b.oven.length>=6) heat++;
    if(b.iceboxReady&&heat>0) heat--; return heat;
  };
  B.eggPuff = (b,t) => {
    const E=B.EGGS[t],base=B.baseEgg(t),m=b.mods,i=b.oven.length;
    let p=E.thunderMult?(i+1)*E.thunderMult:E.puff;
    if(t==='honey') p+=1+b.oven.filter(e=>e.heat<=0).length;
    if(t==='cinnamon'&&b.heat>=b.limit-2) p+=2;
    if(t==='echo') p=i?b.oven[i-1].puff:2;
    if(t==='meringue'&&i>=5) p+=3;
    if(m.bonus) p+=m.bonus[base]||0;
    if(m.mult) p*=m.mult[base]||1;
    if(m.bonusHeavy&&['pepper','ember3','cinnamon'].includes(base)) p+=m.bonusHeavy;
    if(m.coolBonus&&E.heat<0) p+=m.coolBonus;
    if(m.pickyDup&&b.oven.filter(e=>B.baseEgg(e.type)===base).length>=2) p--;
    if(charm(b,'whisk')&&E.heat<0) p++;
    if(charm(b,'kettle')&&E.heat>=2) p++;
    if(charm(b,'apron')&&E.heat===0&&i>=3) p++;
    if(charm(b,'bellows')&&b.heat===b.limit) p++;
    if(charm(b,'grinder')&&b.heat>=b.limit-1) p+=3;
    if(charm(b,'stormrod')&&['thunder','echo','butter'].includes(base)) p+=2;
    if(charm(b,'pin')) p+=(i===0?3:0)+(base==='yolk'?1:0);
    if(charm(b,'bowl')&&(i===4||i===9)) p+=2;
    p=(p+b.nextBonus)*b.nextMult;
    if(m.secondDouble&&i===1) p*=2;
    if(m.fizzChaos&&(i+1)%3===0) p*=2;
    if(charm(b,'mirror')&&b.mirrorReady&&i===2) p*=2;
    if((m.firstFree&&i===0)||(m.noEmber1&&base==='ember1')) p=0;
    return p;
  };
  B.bakePuff = b => Math.max(0,b.bonusPuff+b.oven.reduce((s,e)=>s+e.puff,0));
  B.phoenixReady = b => b.ward || b.oven.some(e=>B.EGGS[e.type].guard&&!e.spent);
  B.drawBurns = (b,t) => {
    const h=Math.max(0,b.heat+B.eggHeat(b,t));
    return h>b.limit&&!B.phoenixReady(b)&&!(b.mittReady&&h===b.limit+1);
  };
  B.burnChance = b => {
    if(!B.canDraw(b)) return 0;
    const pool=b.peek?[b.bag[b.bag.length-1]]:b.bag;
    return pool.filter(t=>B.drawBurns(b,t)).length/pool.length;
  };
  // A shallow snapshot copies only bake state; never the run/RNG. Used to reverse the last draw.
  function snapshot(b) { const s={...b,oven:b.oven.map(e=>({...e})),bag:b.bag.slice(),aside:b.aside.slice(),triggers:[]}; delete s.undo; return s; }
  B.bakeDraw = b => {
    if(!B.canDraw(b)) return null;
    const before=snapshot(b), type=b.bag.pop(), E=B.EGGS[type], idx=b.oven.length;
    const puff=B.eggPuff(b,type), hd=B.eggHeat(b,type), nextHeat=Math.max(0,b.heat+hd), ev={type,puff,heatDelta:hd,corn:0};
    b.peek=false;
    if(b.iceboxReady && B.eggHeat({...b,iceboxReady:false},type)>0) { b.iceboxReady=false; B.trigger(b,'icebox','Icebox −1°'); }
    const ward=b.ward; b.ward=false;
    if(nextHeat>b.limit) {
      const ph=b.oven.find(e=>B.EGGS[e.type].guard&&!e.spent);
      if(ward||ph) {
        if(!ward) { ph.spent=true; b.heat=Math.max(0,b.heat-(B.EGGS[ph.type].saveCool||0)); }
        b.aside.push(type); ev.phoenix=true; ev.ward=ward;
        if(charm(b,'pbell')) { b.bonusPuff+=4;b.corn+=5;B.trigger(b,'pbell','Phoenix Bell! +4 puff, +5 corn'); }
        b.phoenixSaves=(b.phoenixSaves||0)+1; return ev;
      }
      if(b.mittReady&&nextHeat===b.limit+1) {b.mittReady=false;b.heat=b.limit;B.trigger(b,'mitt','Mitt saved you!');}
      else {b.oven.push({type,puff,heat:hd,burner:true});b.heat=nextHeat;b.state='burnt';ev.burnt=true;return ev;}
    } else b.heat=nextHeat;
    b.oven.push({type,puff,heat:hd,heatApplied:b.heat-before.heat,cornFromDraw:0,bonusFromDraw:0});
    b.nextMult=type==='butter'?2:1;b.nextBonus=E.nextBonus||0;
    const procs={whisk:E.heat<0,kettle:E.heat>=2,apron:E.heat===0&&idx>=3,bellows:before.heat===b.limit,grinder:before.heat>=b.limit-1,
      stormrod:['thunder','echo','butter'].includes(B.baseEgg(type)),pin:idx===0||B.baseEgg(type)==='yolk',bowl:idx===4||idx===9,mirror:idx===2&&b.mirrorReady};
    Object.keys(procs).forEach(id=>{if(procs[id]&&charm(b,id)) B.trigger(b,id,id==='mirror'?'Mirror ×2!':B.CHARMS[id].name+'!');});
    if(idx===2) b.mirrorReady=false;
    if(E.corn) ev.corn+=E.corn+(charm(b,'cornucopia')?1:0);
    if(type==='butter'&&charm(b,'stormrod')) ev.corn++;
    b.corn+=ev.corn;
    if(E.corn&&charm(b,'cornucopia')) B.trigger(b,'cornucopia','Clover +1 corn');
    if(E.heat<0&&charm(b,'cryo')) {b.bonusPuff+=2;B.trigger(b,'cryo','Cryo-Crown +2 puff');}
    if(E.peek&&b.bag.length) {b.peek=true;b.peekTossBonus=E.tossBonus||0;ev.peek=true;}
    const last=b.oven[b.oven.length-1];last.cornFromDraw=b.corn-before.corn;last.bonusFromDraw=b.bonusPuff-before.bonusPuff;
    b.undo=before; return ev;
  };
  B.bakeToss = b => {
    if(!b.peek||!b.bag.length) return null;
    const t=b.bag.pop();b.aside.push(t);b.peek=false;
    b.bonusPuff+=(b.peekTossBonus||0)+(charm(b,'spoon')?2:0);
    if(charm(b,'spoon')) B.trigger(b,'spoon','Silver Spoon +2 puff');
    if(b.peekTossBonus) B.trigger(b,null,'Eclipse +2 puff'); b.peekTossBonus=0;return t;
  };
  Object.assign(B.SPELLS,{
    baste:{name:'Butter Baste',cost:1,text:'Next egg +3 puff (stacks).',hint:'Serve 25 orders.'},
    chill:{name:'Cryo-Cackle',cost:2,text:'Cool −3° and gain +2 bonus puff.',hint:'Serve a bake at exactly the heat limit.'},
    swap:{name:'Sleight of Wing',cost:1,text:'Undo last egg’s puff/heat/corn; shuffle it back and redraw. Once/bake.',hint:'Reach Act III or win a run.'},
    surge:{name:'Hearth Surge',cost:1,text:'+5 bonus puff, +2° heat (must fit).',hint:'Win at Spice 1+.'},
    wish:{name:'Wish Egg',cost:1,text:'Conjure a temporary Yolk into the oven. Uses an oven slot. Once/bake.',hint:'Hold 16 eggs at once.'},
    ward:{name:'Phoenix Plume',cost:2,text:'Shield next draw; toss it if fatal. Once/bake.',hint:'Trigger a Phoenix save or beat Act II boss.'}
  });
  const spellIcons={fan:'snow',eye:'moon',cluck:'sun',baste:'butter',chill:'snow',swap:'echo',surge:'flame',wish:'sun',ward:'feather'};
  Object.keys(B.SPELLS).forEach(id=>{B.SPELLS[id].glyph=spellIcons[id];});
  B.spellCost = (b,id) => Math.max(0,B.SPELLS[id].cost-(b.freeSpellReady?1:0));
  B.canCast = (r,b,id) => {
    if(!B.SPELLS[id]||!r.spells.includes(id)||b.state!=='baking'||b.spellsCast>=b.maxSpells||r.feathers<B.spellCost(b,id)) return false;
    if(id==='fan'||id==='chill') return b.heat>0;
    if(id==='eye') return !b.peek&&b.bag.length>0;
    if(id==='cluck') return !b.cluckUsed&&b.oven.length>0&&b.oven[b.oven.length-1].puff>0;
    if(id==='swap') return !b.swapUsed&&!!b.undo&&b.oven.length>0&&b.bag.length>0;
    if(id==='surge') return b.heat+2<=b.limit;
    if(id==='wish') return !b.wishUsed&&b.oven.length<b.maxDraws;
    if(id==='ward') return !b.wardUsed&&!b.ward;
    return id==='baste';
  };
  B.cast = (r,b,id) => {
    if(!B.canCast(r,b,id)) return false;
    r.feathers-=B.spellCost(b,id);b.spellsCast++;r.stats.spells++;
    if(b.freeSpellReady) {b.freeSpellReady=false;B.trigger(b,'featherwt','First spell −1 feather');}
    if(id==='fan'||id==='chill') {
      b.heat=Math.max(0,b.heat-(id==='fan'?2:3));if(id==='chill') b.bonusPuff+=2;
      if(charm(b,'cryo')) {b.bonusPuff+=2;B.trigger(b,'cryo','Cryo-Crown +2 puff');}
    }
    if(id==='eye') {b.peek=true;b.peekTossBonus=0;}
    if(id==='cluck') {const last=b.oven[b.oven.length-1];last.puff*=2;last.clucked=true;b.cluckUsed=true;}
    if(id==='baste') b.nextBonus+=3;
    if(id==='surge') {b.bonusPuff+=5;b.heat+=2;}
    if(id==='ward') {b.ward=true;b.wardUsed=true;}
    if(id==='wish') {
      // A conjured egg uses the complete draw engine, including heat-changing customer rules.
      const wasPeek=b.peek, oldUndo=b.undo;
      b.bag.push('yolk');const ev=B.bakeDraw(b);b.wishUsed=true;
      if(wasPeek&&b.state==='baking'&&b.bag.length) b.peek=true;
      if(ev&&ev.burnt) b.undo=oldUndo;
      const last=b.oven[b.oven.length-1];if(last&&last.type==='yolk') last.temporary=true;
    }
    if(id==='swap') {
      const last=b.oven.pop(), before=b.undo;
      b.heat=Math.max(0,b.heat-(last.heatApplied||0));b.corn-=last.cornFromDraw||0;b.bonusPuff-=last.bonusFromDraw||0;
      b.nextBonus=before.nextBonus+Math.max(0,b.nextBonus-(B.EGGS[last.type].nextBonus||0));b.nextMult=before.nextMult;
      b.bag.push(last.type);b.rng.shuffle(b.bag);b.peek=false;b.swapUsed=true;
      B.bakeDraw(b);
    }
    // Swapping never refunds spell costs, one-shot triggers, or spells cast after a draw.
    return true;
  };
  B.canServe = b => b.state==='baking'&&((b.oven.length>0&&b.oven.length>=b.minDraws)||!B.canDraw(b));
  B.bakeServe = b => {if(B.canServe(b)) b.state=B.bakePuff(b)>=b.order.target&&b.oven.length>=Math.max(1,b.minDraws)?'served':'under';};
  B.tips = b => {
    let mult=b.mods.tipMult==null?1:b.mods.tipMult;
    if(b.mods.etiquette) mult=b.heat<=b.limit-2?3:0;
    if(charm(b,'tipjar')&&mult>0) mult++;
    return Math.round(Math.max(0,B.bakePuff(b)-b.order.target)*mult);
  };
  const oldApply=B.applyBake;
  B.applyBake = (r,b) => {
    // The base bookkeeping accepts a computed multiplier, including exact zero tips.
    const mods=b.mods; b.mods={...mods,tipMult:1};
    const expectedTips=B.tips({...b,mods});const s=oldApply(r,b);b.mods=mods;
    if(s.result==='served') {
      r.corn+=expectedTips-s.tips;r.stats.cornEarned+=expectedTips-s.tips;s.tips=expectedTips;
      const extra=charm(b,'cornucopia')?(b.order.kind==='boss'?4:2):0;r.corn+=extra;r.stats.cornEarned+=extra;s.reward+=extra;
      if(extra) B.trigger(b,'cornucopia','Served! +'+extra+' corn');
      if(charm(b,'tipjar')&&s.tips) B.trigger(b,'tipjar','Tip Jar boosted tips');
      if(mods.zeroSpellFeather&&b.spellsCast===0&&r.feathers<r.maxFeathers) {r.feathers++;s.feathers++;}
      if(b.heat===b.limit) r.exactLimitWins=(r.exactLimitWins||0)+1;
    }
    if(b.phoenixSaves) {r.phoenixSaves=(r.phoenixSaves||0)+b.phoenixSaves; if(!b.oven.some(e=>e.spent)) r.stats.phoenix++;}
    return s;
  };
  B.prizeChoices = r => {
    const pool = ['pepper', 'moon', 'thunder', 'phoenix', 'butter', 'honey', 'cinnamon', 'echo', 'meringue', 'yolk', 'frost', 'clover'];
    const a = r.rng.weighted([['pepper', 3], ['moon', 2.2], ['thunder', 2], ['phoenix', 1.5], ['butter', 2], ['honey', 1.6], ['cinnamon', 1.6], ['meringue', 1.4], ['echo', 1.4], ['yolk', 1.4]]);
    let b;
    do { b = r.rng.pick(pool); } while (b === a);
    return [a, b];
  };
  B.ODDS_POLICY='Approximate success over 500 shuffled baskets: serve at target after minimum draws; draw at up to 40% burn risk; toss unsafe peeks; no feather spells. All combos, charms and house rules included.';
  B.estimateOdds = (r,order,sims) => {
    const rng=B.makeRng(r.seed^(order.target*7919)^(r.basket.length*104729));let wins=0;
    for(let i=0;i<(sims||400);i++) {
      const b=B.newBake(r,order,rng);
      while(b.state==='baking') {
        if(B.bakePuff(b)>=order.target&&B.canServe(b)) break;
        if(!B.canDraw(b)) break;
        if(b.peek&&B.drawBurns(b,b.bag[b.bag.length-1])) {B.bakeToss(b);continue;}
        if(B.burnChance(b)>.4) break;
        B.bakeDraw(b);
      }
      if(b.state==='baking'&&B.canServe(b)&&b.oven.length>=b.minDraws&&B.bakePuff(b)>=order.target) wins++;
    } return wins/(sims||400);
  };
  B.DEN={limit:21,stakes:[4,8,12],maxHands:3,profitCap:30,rungs:[
    {min:21,mult:3.5,label:'Perfection!'},{min:18,mult:2.3,label:'Crackling'},{min:15,mult:1.6,label:'Crisp'},
    {min:12,mult:1.2,label:'Golden'},{min:8,mult:.7,label:'Simmer'},{min:1,mult:.3,label:'Cold Pan'}]};
  B.denMult=p=>(B.DEN.rungs.find(r=>p>=r.min)||{mult:0}).mult;
  B.denRoll=(st,n,rng)=>{
    const dice=Array.from({length:n},()=>1+rng.int(6)),doubles=n===2&&dice[0]===dice[1];
    const heat=st.heat+dice.reduce((a,b)=>a+b,0)+(doubles?2:0),bust=dice.includes(1)||heat>21;
    return {dice,doubles,heat,bust,mult:bust?0:B.denMult(heat),autoCash:!bust&&heat===21};
  };
  B.denOdds=p=>{
    const rung=B.DEN.rungs.slice().reverse().find(r=>r.min>p),calc=n=>{
      let burn=0,upgrade=0,total=n===1?6:36;
      for(let a=1;a<=6;a++) for(let b=1;b<=(n===1?1:6);b++) {
        const heat=p+a+(n===2?b+(a===b?2:0):0),bad=a===1||(n===2&&b===1)||heat>21;
        if(bad) burn++; else if(rung&&heat>=rung.min) upgrade++;
      } return {burn:burn/total,upgrade:upgrade/total,burnCount:burn,total,upgradeCount:upgrade};
    };return {die1:calc(1),die2:calc(2)};
  };
  const oldScore=B.score;
  B.score=r=>{const sc=oldScore(r);sc.parts[0][1]=Math.floor(r.corn/2);sc.parts.push(['Charms collected ×15',r.charms.length*15]);sc.total=sc.parts.reduce((n,p)=>n+p[1],0);return sc;};
  B.EVENTS.push({id:'tinker',title:'Roaming Tinker',icon:'market',text:'A travelling tinker opens a brass case. “A little kitchen magic for 10 corn?”',choices:[
    {label:'Buy a charm',hint:'10 corn: random unowned Common/Uncommon Charm',can:r=>r.corn>=10&&B.charmChoices({...r,rng:B.makeRng(1)},'mystery',1).length>0,
      go(r){r.corn-=10;r.stats.cornSpent+=10;const id=B.charmChoices(r,'mystery',1)[0];B.addCharm(r,id);return {text:B.CHARMS[id].name+' acquired! '+B.CHARMS[id].text,good:true};}},
    {label:'Walk on',hint:'Keep your corn',go:()=>({text:'The tinker waves a tiny whisk goodbye.',good:null})}
  ]});
  // Respect the hard heart cap even in old mystery events.
  B.EVENTS.forEach(e=>e.choices.forEach(c=>{const go=c.go;c.go=r=>{const result=go(r);if(r.spice>=9){r.maxHearts=Math.min(4,r.maxHearts);r.hearts=Math.min(r.hearts,r.maxHearts);}return result;};}));
})(typeof window !== 'undefined' ? window : globalThis);
