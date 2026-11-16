/* Bake or Bust! — every picture is generated here: SVG characters, eggs, props and canvas scenery. */
(function () {
  'use strict';
  const ART = (window.ART = {});
  const INK = '#3b2418';
  const SW = 'stroke="' + INK + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';

  // ---------------------------------------------------------------- Hen (Marigold)
  ART.hen = function (opts) {
    opts = opts || {};
    const hat = opts.hat !== false;
    const eye = opts.mood === 'shock'
      ? '<circle cx="150" cy="72" r="7" fill="#fff" ' + SW + '/><circle cx="151" cy="72" r="2.6" fill="' + INK + '"/>'
      : opts.mood === 'sad'
        ? '<path d="M143 70 Q150 77 157 70" fill="none" ' + SW + '/><path d="M140 64 L156 60" ' + SW + '/><path d="M152 80 Q148 88 152 92 Q156 88 152 80 Z" fill="#9fe0ff" stroke="' + INK + '" stroke-width="2"/>'
        : opts.mood === 'happy'
          ? '<path d="M143 74 Q150 66 157 74" fill="none" ' + SW + '/>'
          : '<circle cx="150" cy="72" r="5.5" fill="' + INK + '"/><circle cx="152" cy="70" r="1.8" fill="#fff"/>';
    return '<svg class="hen-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      // legs
      '<g class="hen-legs"><path d="M86 160 L82 188 M82 188 L70 192 M82 188 L92 193 M112 160 L114 188 M114 188 L102 193 M114 188 L126 192" fill="none" stroke="' + INK + '" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M86 160 L82 188 M82 188 L70 192 M82 188 L92 193 M112 160 L114 188 M114 188 L102 193 M114 188 L126 192" fill="none" stroke="#f39a2b" stroke-width="4" stroke-linecap="round"/></g>' +
      // tail
      '<path d="M52 120 Q22 100 26 62 Q46 80 66 96 Z" fill="#fff3df" ' + SW + '/>' +
      '<path d="M54 126 Q14 120 12 88 Q40 100 64 108 Z" fill="#f6e4c6" ' + SW + '/>' +
      '<path d="M58 108 Q38 72 52 48 Q64 76 74 94 Z" fill="#fff8ec" ' + SW + '/>' +
      // body
      '<ellipse cx="98" cy="126" rx="58" ry="44" fill="#fff8ec" ' + SW + '/>' +
      '<path d="M60 150 Q98 176 140 150" fill="none" stroke="#efdcc0" stroke-width="6" stroke-linecap="round"/>' +
      // apron
      '<path d="M108 102 Q138 112 146 134 Q134 160 104 164 Q112 132 108 102 Z" fill="#ff8fa3" ' + SW + '/>' +
      '<circle cx="126" cy="138" r="4" fill="#fff"/><circle cx="118" cy="122" r="3" fill="#fff"/><circle cx="132" cy="152" r="3" fill="#fff"/>' +
      // comb (behind head)
      '<circle cx="132" cy="48" r="9" fill="#e8403a" ' + SW + '/><circle cx="145" cy="43" r="10" fill="#e8403a" ' + SW + '/>' +
      // head
      '<circle cx="142" cy="78" r="30" fill="#fff8ec" ' + SW + '/>' +
      '<ellipse cx="124" cy="104" rx="22" ry="14" fill="#fff8ec"/>' +
      // wing
      '<g class="hen-wing"><path d="M64 118 Q90 96 118 112 Q116 142 88 150 Q66 144 64 118 Z" fill="#f6e6cc" ' + SW + '/>' +
      '<path d="M80 128 Q92 124 104 128 M82 138 Q94 134 104 138" fill="none" stroke="#d9bf98" stroke-width="3" stroke-linecap="round"/></g>' +
      // face
      '<path d="M168 72 L190 80 L168 90 Z" fill="#f7a531" ' + SW + '/>' +
      '<path d="M166 92 Q174 108 163 110 Q154 106 160 92 Z" fill="#e8403a" ' + SW + '/>' +
      eye +
      '<ellipse cx="144" cy="88" rx="6" ry="3.5" fill="#ff9aa8" opacity=".7"/>' +
      // hat
      (hat ? '<g class="hen-hat"><path d="M112 54 Q128 52 150 50 Q170 50 174 56 Q150 64 112 62 Q102 58 112 54 Z" fill="#5a3596" ' + SW + '/>' +
        '<path d="M120 56 Q130 30 128 6 Q150 18 162 52 Z" fill="#7b4bc4" ' + SW + '/>' +
        '<path d="M122 50 Q142 46 160 48" fill="none" stroke="#ffc93c" stroke-width="6"/>' +
        '<path d="M140 24 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" fill="#ffc93c" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/></g>' : '') +
      '</svg>';
  };

  // ---------------------------------------------------------------- Critters
  function ears(L) {
    const c = L.body, i = L.inner || L.belly || '#f5b4c2';
    switch (L.ears) {
      case 'round': return '<circle cx="62" cy="52" r="17" fill="' + c + '" ' + SW + '/><circle cx="138" cy="52" r="17" fill="' + c + '" ' + SW + '/><circle cx="62" cy="54" r="8" fill="' + i + '"/><circle cx="138" cy="54" r="8" fill="' + i + '"/>';
      case 'bigRound': return '<circle cx="56" cy="50" r="26" fill="' + c + '" ' + SW + '/><circle cx="144" cy="50" r="26" fill="' + c + '" ' + SW + '/><circle cx="58" cy="52" r="15" fill="' + i + '"/><circle cx="142" cy="52" r="15" fill="' + i + '"/>';
      case 'long': return '<ellipse cx="78" cy="30" rx="13" ry="36" transform="rotate(-10 78 30)" fill="' + c + '" ' + SW + '/><ellipse cx="122" cy="30" rx="13" ry="36" transform="rotate(10 122 30)" fill="' + c + '" ' + SW + '/><ellipse cx="78" cy="32" rx="6" ry="26" transform="rotate(-10 78 32)" fill="' + i + '"/><ellipse cx="122" cy="32" rx="6" ry="26" transform="rotate(10 122 32)" fill="' + i + '"/>';
      case 'pointy': return '<path d="M58 70 L56 22 L92 50 Z" fill="' + c + '" ' + SW + '/><path d="M142 70 L144 22 L108 50 Z" fill="' + c + '" ' + SW + '/><path d="M64 60 L62 36 L82 52 Z" fill="' + i + '"/><path d="M136 60 L138 36 L118 52 Z" fill="' + i + '"/>';
      case 'tufted': return '<path d="M58 70 L54 14 L92 50 Z" fill="' + c + '" ' + SW + '/><path d="M142 70 L146 14 L108 50 Z" fill="' + c + '" ' + SW + '/><path d="M54 14 L52 2 M146 14 L148 2" ' + SW + '/><path d="M64 60 L62 34 L82 52 Z" fill="' + i + '"/><path d="M136 60 L138 34 L118 52 Z" fill="' + i + '"/>';
      case 'tufts': return '<path d="M62 62 L50 26 L86 48 Z" fill="' + c + '" ' + SW + '/><path d="M138 62 L150 26 L114 48 Z" fill="' + c + '" ' + SW + '/>';
      default: return '';
    }
  }

  function eyes(L) {
    switch (L.eyes) {
      case 'tiny': return '<circle cx="84" cy="84" r="3" fill="' + INK + '"/><circle cx="116" cy="84" r="3" fill="' + INK + '"/>';
      case 'owl': return '<circle cx="80" cy="82" r="17" fill="#fff" ' + SW + '/><circle cx="120" cy="82" r="17" fill="#fff" ' + SW + '/><circle cx="80" cy="82" r="10" fill="#f0b43a"/><circle cx="120" cy="82" r="10" fill="#f0b43a"/><circle cx="80" cy="82" r="5" fill="' + INK + '"/><circle cx="120" cy="82" r="5" fill="' + INK + '"/><circle cx="82" cy="79" r="2" fill="#fff"/><circle cx="122" cy="79" r="2" fill="#fff"/>';
      case 'frog': return '<circle cx="72" cy="56" r="17" fill="' + L.body + '" ' + SW + '/><circle cx="128" cy="56" r="17" fill="' + L.body + '" ' + SW + '/><circle cx="72" cy="56" r="10" fill="#fff"/><circle cx="128" cy="56" r="10" fill="#fff"/><circle cx="74" cy="57" r="5" fill="' + INK + '"/><circle cx="126" cy="57" r="5" fill="' + INK + '"/>';
      default: return '<circle cx="82" cy="82" r="6.5" fill="' + INK + '"/><circle cx="118" cy="82" r="6.5" fill="' + INK + '"/><circle cx="84" cy="80" r="2.2" fill="#fff"/><circle cx="120" cy="80" r="2.2" fill="#fff"/>';
    }
  }

  function accessory(L) {
    const a = L.accColor || '#d6452f';
    switch (L.acc) {
      case 'glasses': return '<circle cx="84" cy="84" r="12" fill="rgba(200,230,255,.35)" ' + SW + '/><circle cx="116" cy="84" r="12" fill="rgba(200,230,255,.35)" ' + SW + '/><path d="M96 84 L104 84" ' + SW + '/>';
      case 'bow': return '<path d="M64 40 L44 28 L46 54 Z M64 40 L84 28 L82 54 Z" fill="' + a + '" ' + SW + '/><circle cx="64" cy="41" r="6" fill="' + a + '" ' + SW + '/>';
      case 'bonnet': return '<path d="M52 82 Q50 28 100 26 Q150 28 148 82 Q140 50 100 46 Q60 50 52 82 Z" fill="' + a + '" ' + SW + '/><circle cx="100" cy="30" r="6" fill="#fff" ' + SW + '/>';
      case 'scarf': return '<path d="M58 124 Q100 140 142 124 L144 138 Q100 154 56 138 Z" fill="' + a + '" ' + SW + '/><path d="M124 140 L136 172 L118 170 L114 142 Z" fill="' + a + '" ' + SW + '/>';
      case 'cap': return '<path d="M60 64 Q62 32 100 30 Q138 32 140 64 Z" fill="' + a + '" ' + SW + '/><path d="M100 62 L160 66 Q150 76 100 70 Z" fill="' + a + '" ' + SW + '/>';
      case 'lilypad': return '<path d="M64 46 Q100 18 136 46 Q100 60 64 46 Z" fill="#3e9a4a" ' + SW + '/><circle cx="112" cy="32" r="7" fill="#ff9ec0" ' + SW + '/>';
      case 'goggles': return '<path d="M54 62 Q100 50 146 62" fill="none" stroke="#5a3b22" stroke-width="10"/><circle cx="80" cy="56" r="13" fill="#9fe0ff" ' + SW + '/><circle cx="120" cy="56" r="13" fill="#9fe0ff" ' + SW + '/>';
      case 'bandana': return '<path d="M56 66 Q100 34 144 66 Q100 56 56 66 Z" fill="' + a + '" ' + SW + '/><path d="M140 62 L162 70 L150 80 Z" fill="' + a + '" ' + SW + '/>';
      case 'bell': return '<path d="M60 126 Q100 142 140 126" fill="none" stroke="#d6452f" stroke-width="9" stroke-linecap="round"/><circle cx="100" cy="140" r="9" fill="#ffc93c" ' + SW + '/>';
      case 'helmet': return '<path d="M54 70 Q54 28 100 26 Q146 28 146 70 Z" fill="#9aa3ad" ' + SW + '/><path d="M54 70 L146 70" ' + SW + '/><path d="M100 26 L100 8" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="8" r="5" fill="#d6452f" ' + SW + '/>';
      case 'bowtie': return '<path d="M100 130 L78 118 L78 142 Z M100 130 L122 118 L122 142 Z" fill="' + a + '" ' + SW + '/><circle cx="100" cy="130" r="5" fill="' + a + '" ' + SW + '/>';
      case 'chefhat': return '<path d="M66 56 L66 40 Q52 34 60 18 Q70 6 84 14 Q92 0 108 6 Q124 0 134 14 Q150 12 144 34 Q140 40 134 40 L134 56 Z" fill="#fff" ' + SW + '/>';
      case 'jester': return '<path d="M60 64 Q60 40 100 38 Q140 40 140 64 Z" fill="' + a + '" ' + SW + '/><path d="M64 54 Q40 30 30 50 M136 54 Q160 30 170 50" fill="none" stroke="' + a + '" stroke-width="12" stroke-linecap="round"/><circle cx="30" cy="52" r="7" fill="#ffc93c" ' + SW + '/><circle cx="170" cy="52" r="7" fill="#ffc93c" ' + SW + '/>';
      case 'tiara': return '<path d="M70 50 L76 30 L88 44 L100 22 L112 44 L124 30 L130 50 Z" fill="#ffc93c" ' + SW + '/><circle cx="100" cy="36" r="4" fill="#3d8be0"/>';
      case 'mortarboard': return '<path d="M72 52 Q100 40 128 52 L128 36 Q100 28 72 36 Z" fill="#1f1f2a" ' + SW + '/><path d="M46 30 L100 12 L154 30 L100 48 Z" fill="#1f1f2a" ' + SW + '/><path d="M100 30 Q130 34 140 58" fill="none" stroke="#ffc93c" stroke-width="4"/><circle cx="140" cy="62" r="6" fill="#ffc93c" ' + SW + '/>';
      case 'judgeWig': return '<g fill="#f4f2f6" ' + SW + '><circle cx="56" cy="80" r="14"/><circle cx="54" cy="104" r="14"/><circle cx="144" cy="80" r="14"/><circle cx="146" cy="104" r="14"/><path d="M58 62 Q100 22 142 62 Q100 48 58 62 Z"/></g>';
      case 'witchhat': return '<path d="M44 52 Q100 66 156 52 Q166 44 150 42 Q100 50 50 42 Q34 44 44 52 Z" fill="' + a + '" ' + SW + '/><path d="M66 46 Q90 20 100 -10 Q118 10 134 46 Z" fill="' + a + '" ' + SW + '/><path d="M70 40 Q100 46 130 40" fill="none" stroke="#7bd88f" stroke-width="6"/>';
      case 'visor': return '<path d="M54 62 Q100 40 146 62" fill="none" stroke="' + INK + '" stroke-width="6"/><path d="M58 60 Q100 46 142 60 L154 76 Q100 60 46 76 Z" fill="rgba(70,190,110,.85)" ' + SW + '/>';
      case 'tophat': return '<path d="M60 46 Q100 56 140 46 L140 40 Q100 46 60 40 Z" fill="#1f1f2a" ' + SW + '/><path d="M72 42 L76 -2 Q100 -8 124 -2 L128 42 Z" fill="#1f1f2a" ' + SW + '/><path d="M74 30 Q100 34 126 30 L126 38 Q100 42 74 38 Z" fill="#c0263a"/>';
      default: return '';
    }
  }

  ART.critter = function (L, mood) {
    let s = '<svg class="critter-svg" viewBox="0 -14 200 214" xmlns="http://www.w3.org/2000/svg">';
    if (L.tail) s += '<path d="M146 170 Q196 150 182 96 Q172 60 146 72 Q168 100 150 130 Z" fill="' + L.tail + '" ' + SW + '/>';
    if(L.shell)s+='<ellipse cx="100" cy="147" rx="70" ry="52" fill="#76502b" '+SW+'/><path d="M37 133L63 114L83 130L78 160L48 174M163 133L137 114L117 130L122 160L152 174M83 130H117M78 160H122" fill="none" stroke="#d8b87c" stroke-width="4"/>';
    // body
    s += '<ellipse cx="100" cy="156" rx="56" ry="42" fill="' + L.body + '" ' + SW + '/>';
    s += '<ellipse cx="100" cy="164" rx="34" ry="26" fill="' + (L.belly || '#fff') + '"/>';
    // arms
    s += '<ellipse cx="54" cy="150" rx="12" ry="20" transform="rotate(25 54 150)" fill="' + L.body + '" ' + SW + '/>';
    s += '<ellipse cx="146" cy="150" rx="12" ry="20" transform="rotate(-25 146 150)" fill="' + L.body + '" ' + SW + '/>';
    if (L.spikes) {
      let p = 'M50 100';
      for (let i = 0; i <= 12; i++) {
        const ang = Math.PI * (1.05 + i / 12 * 0.9);
        const r = i % 2 ? 50 : 66;
        p += ' L' + (100 + Math.cos(ang) * r).toFixed(1) + ' ' + (88 + Math.sin(ang) * r).toFixed(1);
      }
      s += '<path d="' + p + ' L150 100 Z" fill="' + L.spikes + '" ' + SW + '/>';
    }
    s += ears(L);
    // head
    s += '<circle cx="100" cy="88" r="46" fill="' + L.body + '" ' + SW + '/>';
    if (L.stripe) s += '<path d="M92 44 Q100 42 108 44 L106 92 Q100 96 94 92 Z" fill="' + L.stripe + '"/>';
    if (L.mask) s += '<path d="M60 82 Q80 66 100 80 Q120 66 140 82 Q132 96 116 92 Q100 88 84 92 Q68 96 60 82 Z" fill="' + L.mask + '"/>';
    if (L.eyes !== 'frog' && L.eyes !== 'owl') s += '<ellipse cx="100" cy="106" rx="24" ry="17" fill="' + (L.muzzle || L.belly || '#fff') + '"/>';
    s += eyes(L);
    if (L.snout === 'long') {
      s += '<path d="M78 96 Q100 92 122 96 Q112 124 100 128 Q88 124 78 96 Z" fill="' + (L.muzzle || '#fff') + '" ' + SW + '/>';
      s += '<ellipse cx="100" cy="124" rx="7" ry="5" fill="' + (L.nose || INK) + '"/>';
    } else if (L.snout === 'pig') {
      s += '<ellipse cx="100" cy="104" rx="19" ry="13" fill="' + (L.muzzle || '#ffc2cf') + '" ' + SW + '/><ellipse cx="93" cy="104" rx="3.5" ry="5" fill="' + (L.nose || INK) + '"/><ellipse cx="107" cy="104" rx="3.5" ry="5" fill="' + (L.nose || INK) + '"/>';
      s += '<path d="M90 122 Q100 130 110 122" fill="none" ' + SW + '/>';
    } else if (L.beak) {
      if (L.eyes === 'owl') s += '<path d="M92 98 L108 98 L100 114 Z" fill="' + L.beak + '" ' + SW + '/>';
      else s += '<path d="M78 100 Q100 90 122 100 Q118 116 100 118 Q82 116 78 100 Z" fill="' + L.beak + '" ' + SW + '/><path d="M82 106 Q100 110 118 106" fill="none" stroke="' + INK + '" stroke-width="3"/>';
    } else if (L.eyes === 'frog') {
      s += '<path d="M66 100 Q100 124 134 100" fill="none" ' + SW + '/>';
    } else {
      s += '<ellipse cx="100" cy="99" rx="7" ry="5.5" fill="' + (L.nose || INK) + '"/>';
      s += mood === 'sad' ? '<path d="M90 118 Q100 110 110 118" fill="none" ' + SW + '/>' : '<path d="M90 110 Q100 120 110 110" fill="none" ' + SW + '/>';
    }
    if (L.whiskers) s += '<path d="M74 104 L48 98 M74 110 L48 114 M126 104 L152 98 M126 110 L152 114" stroke="' + INK + '" stroke-width="2"/>';
    if (L.eyes !== 'owl' && L.eyes !== 'frog') s += '<ellipse cx="70" cy="100" rx="7" ry="4" fill="#ff8fa3" opacity=".55"/><ellipse cx="130" cy="100" rx="7" ry="4" fill="#ff8fa3" opacity=".55"/>';
    if (L.monocle) s += '<circle cx="118" cy="82" r="13" fill="rgba(255,255,255,.25)" stroke="#ffc93c" stroke-width="4"/><path d="M130 88 Q138 120 128 140" fill="none" stroke="#ffc93c" stroke-width="2"/>';
    if(L.tusks)s+='<path d="M79 111Q66 116 74 95Q66 111 80 120M121 111Q134 116 126 95Q134 111 120 120" fill="#fff5d5" stroke="#3b2418" stroke-width="2"/>';
    s += accessory(L);
    s += '</svg>';
    return s;
  };

  // ---------------------------------------------------------------- Eggs
  const GLYPH = {
    butter: '<rect x="11" y="23" width="18" height="12" rx="3" fill="#fff5bd" stroke="#ad7a29" stroke-width="2"/><path d="M13 24l5-5h13l-4 5" fill="#ffdb68"/>',
    honey: '<g fill="#ffd363" stroke="#aa6928" stroke-width="1.5"><path d="M13 21l5-3 5 3v6l-5 3-5-3zM23 27l5-3 5 3v6l-5 3-5-3zM13 33l5-3 5 3v6l-5 3-5-3z"/></g>',
    cinnamon: '<path d="M12 32c-5-18 20-18 17-4-2 10-15 6-11-1 3-5 8 0 4 2" fill="none" stroke="#fff2bb" stroke-width="3" stroke-linecap="round"/>',
    echo: '<path d="M13 23q-8 7 0 14M18 19q-10 12 0 23M25 23q8 7 0 14M20 19q10 12 0 23" fill="none" stroke="#69459c" stroke-width="2"/>',
    meringue: '<path d="M10 35q1-8 8-12l4-8q-1 12 7 15l2 5z" fill="#fff" stroke="#a3c5d4" stroke-width="2"/>',
    flame: '<path d="M20 15 C25 21 28 25 26.5 30 C25 35 15 35 13.5 30 C12.5 26 16 23 20 15 Z" fill="#d9541e" opacity=".85"/><path d="M20 24 C22 27 23 29 22 31 C21 33 19 33 18 31 C17.5 29 19 27 20 24 Z" fill="#ffd27a"/>',
    sun: '<circle cx="20" cy="28" r="6" fill="#f08a24"/><g stroke="#f08a24" stroke-width="2.4" stroke-linecap="round"><path d="M20 17v3M20 36v3M9 28h3M28 28h3M12.5 20.5l2 2M25.5 33.5l2 2M27.5 20.5l-2 2M14.5 33.5l-2 2"/></g>',
    snow: '<g stroke="#2f7fb8" stroke-width="2.4" stroke-linecap="round"><path d="M20 18v20M11.5 23l17 10M28.5 23l-17 10M17 19l3 3 3-3M17 37l3-3 3 3"/></g>',
    clover: '<g fill="#2e8a3a"><circle cx="16" cy="25" r="4.4"/><circle cx="24" cy="25" r="4.4"/><circle cx="20" cy="21" r="4.4"/><circle cx="20" cy="29" r="4.4"/></g><path d="M20 30 Q22 35 25 37" stroke="#2e8a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    pepper: '<path d="M14 22 Q24 20 27 27 Q28 36 18 38 Q22 32 14 22 Z" fill="#fff3c4" opacity=".9"/><path d="M14 22 Q13 18 16 17" stroke="#2e8a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    moon: '<path d="M23 18 A10 10 0 1 0 27 34 A8 8 0 1 1 23 18 Z" fill="#fff2b0"/><circle cx="27" cy="22" r="1.4" fill="#fff"/>',
    bolt: '<path d="M22 16 L13 30 L19 30 L16 40 L27 25 L21 25 Z" fill="#ffd23f" stroke="#3b2418" stroke-width="1.2" stroke-linejoin="round"/>',
    feather: '<path d="M26 16 Q12 22 14 38 Q28 32 26 16 Z" fill="#ffd23f"/><path d="M25 18 L15 37" stroke="#e8483c" stroke-width="1.8"/>',
    stink: '<g stroke="#4d5220" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M14 36 Q12 32 15 29 Q18 26 15 22"/><path d="M20 36 Q18 32 21 29 Q24 26 21 22"/><path d="M26 36 Q24 32 27 29 Q30 26 27 22"/></g>',
  };
  const EGG_PATH = 'M20 2 C31 2 38 20 38 30 C38 41 30 47 20 47 C10 47 2 41 2 30 C2 20 9 2 20 2 Z';
  ART.egg = function (type, cls) {
    const E = window.BB.EGGS[type];
    let extra = '';
    if (type === 'rotten') extra = '<circle cx="12" cy="20" r="2.5" fill="#6b7030"/><circle cx="29" cy="38" r="3" fill="#6b7030"/>';
    if (type === 'ember3') extra = '<path d="M4 34 Q20 40 36 34" fill="none" stroke="#b5481c" stroke-width="2" opacity=".6"/>';
    if (type === 'phoenix') extra = '<path d="M2 30 C2 20 9 2 20 2 C14 12 12 22 16 30 Z" fill="#ffb44a" opacity=".6"/>';
    return '<svg class="egg-svg ' + (cls || '') + '" viewBox="0 0 40 49" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + EGG_PATH + '" fill="' + E.color + '" stroke="' + INK + '" stroke-width="2.4"/>' + extra +
      '<path d="M30 12 C36 22 37 34 31 42 C35 30 34 20 30 12 Z" fill="#000" opacity=".12"/>' +
      '<ellipse cx="13" cy="15" rx="3.4" ry="6" transform="rotate(20 13 15)" fill="#fff" opacity=".6"/>' +
      (GLYPH[E.glyph] || '') + (E.branch ? '<path d="'+EGG_PATH+'" transform="translate(4 5) scale(.8)" fill="none" stroke="'+(E.branch==='cool'?'#7fd4ff':'#ffd23f')+'" stroke-width="2.6"/>' +
      (E.branch==='cool'?'<path d="M8 7v8M4 11h8M5 8l6 6M5 14l6-6" stroke="#7fd4ff" stroke-width="1.7"/>':'<path d="M9 9L7 2l7 4 6-6 6 6 7-4-2 7z" fill="#ffd23f" stroke="#ad751f" stroke-width="1"/>')+'<circle cx="32" cy="39" r="6" fill="'+(E.branch==='cool'?'#7fd4ff':'#ffd23f')+'"/><path d="M29 39h6M32 36v6" stroke="#3b2418" stroke-width="1.7"/>' : '') + '</svg>';
  };

  // ---------------------------------------------------------------- Small UI icons
  ART.icon = function (name) {
    switch (name) {
      case 'heart': return '<svg viewBox="0 0 32 30"><path d="M16 28 C4 19 1 13 3 8 C5 2 13 1 16 7 C19 1 27 2 29 8 C31 13 28 19 16 28 Z" fill="#e8403a" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/><ellipse cx="9" cy="9" rx="2.5" ry="3.5" fill="#fff" opacity=".6"/></svg>';
      case 'heartEmpty': return '<svg viewBox="0 0 32 30"><path d="M16 28 C4 19 1 13 3 8 C5 2 13 1 16 7 C19 1 27 2 29 8 C31 13 28 19 16 28 Z" fill="#6b4a3a" opacity=".35" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/></svg>';
      case 'corn': return '<svg viewBox="0 0 32 32"><path d="M16 3 C23 3 26 10 26 17 C26 25 21 30 16 30 C11 30 6 25 6 17 C6 10 9 3 16 3 Z" fill="#ffc93c" stroke="' + INK + '" stroke-width="2.6"/><path d="M10 12 h12 M9 18 h14 M10 24 h12 M16 5 v24" stroke="#e09a1a" stroke-width="1.6"/></svg>';
      case 'feather': return '<svg viewBox="0 0 32 32"><path d="M26 3 C10 6 5 18 7 28 C19 26 28 16 26 3 Z" fill="#b48cf2" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M24 6 L5 30" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/><path d="M18 14 l-6 -1 M15 19 l-6 -1 M20 10 l-4 -1" stroke="#7b4bc4" stroke-width="1.6"/></svg>';
      case 'flame': return '<svg viewBox="0 0 32 32"><path d="M16 2 C22 10 27 15 26 21 C25 28 7 28 6 21 C5 15 11 12 16 2 Z" fill="#f08a24" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M16 14 C19 18 20 21 19 23 C18 26 14 26 13 23 C12.5 21 14 18 16 14 Z" fill="#ffd23f"/></svg>';
      case 'puff': return '<svg viewBox="0 0 32 32"><path d="M6 24 C2 24 2 17 7 17 C6 11 13 9 15 13 C17 7 26 8 25 15 C30 15 30 24 25 24 Z" fill="#fff8ec" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/></svg>';
      case 'basket': return '<svg viewBox="0 0 32 32"><path d="M8 14 Q16 0 24 14" fill="none" stroke="' + INK + '" stroke-width="2.6"/><path d="M3 13 H29 L25 29 H7 Z" fill="#c98a4b" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M6 18 H26 M7 23 H25 M12 13 L13 29 M20 13 L19 29" stroke="#8a5a2b" stroke-width="1.6"/></svg>';
      case 'soundOn': return '<svg viewBox="0 0 32 32"><path d="M5 12 H11 L18 6 V26 L11 20 H5 Z" fill="#fff8ec" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M22 11 Q26 16 22 21 M25 7 Q32 16 25 25" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/></svg>';
      case 'soundOff': return '<svg viewBox="0 0 32 32"><path d="M5 12 H11 L18 6 V26 L11 20 H5 Z" fill="#fff8ec" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/><path d="M22 12 L29 20 M29 12 L22 20" stroke="#d6452f" stroke-width="2.8" stroke-linecap="round"/></svg>';
      case 'music': return '<svg viewBox="0 0 32 32"><path d="M12 24 V7 L26 4 V21" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/><ellipse cx="9" cy="24" rx="4" ry="3.2" fill="#fff8ec" stroke="' + INK + '" stroke-width="2.4"/><ellipse cx="23" cy="21" rx="4" ry="3.2" fill="#fff8ec" stroke="' + INK + '" stroke-width="2.4"/></svg>';
      case 'musicOff': return ART.icon('music').replace('</svg>', '<path d="M4 4 L28 28" stroke="#d6452f" stroke-width="2.8" stroke-linecap="round"/></svg>');
      case 'thermo': return '<svg viewBox="0 0 32 32"><rect x="12" y="3" width="8" height="18" rx="4" fill="#fff8ec" stroke="' + INK + '" stroke-width="2.2"/><circle cx="16" cy="24" r="6" fill="#e8403a" stroke="' + INK + '" stroke-width="2.2"/><rect x="14.5" y="10" width="3" height="12" fill="#e8403a"/></svg>';
      default: return '';
    }
  };

  // ---------------------------------------------------------------- Location / event icons
  ART.place = function (name) {
    const w = '<svg viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg">';
    switch (name) {
      case 'market': return w + '<rect x="18" y="46" width="84" height="54" fill="#d9a066" ' + SW + '/><path d="M10 46 L20 18 H100 L110 46 Z" fill="#fff" ' + SW + '/><path d="M24 18 L18 46 M44 18 L42 46 M60 18 V46 M76 18 L78 46 M96 18 L102 46" stroke="#e8403a" stroke-width="9"/><path d="M10 46 L20 18 H100 L110 46 Z" fill="none" ' + SW + '/><path d="M10 46 Q20 56 30 46 Q40 56 50 46 Q60 56 70 46 Q80 56 90 46 Q100 56 110 46" fill="#e8403a" ' + SW + '/><rect x="24" y="66" width="72" height="12" fill="#8a5a2b" ' + SW + '/>' + mini('#ffd23f', 34, 62) + mini('#e8483c', 52, 62) + mini('#9a86ec', 70, 62) + mini('#a6dcf7', 86, 62) + '</svg>';
      case 'den': return w + '<ellipse cx="60" cy="88" rx="54" ry="16" fill="#2b5e3a" ' + SW + '/><ellipse cx="60" cy="84" rx="46" ry="11" fill="#3a8552"/><g transform="translate(18 38) rotate(-10 20 20)"><rect x="2" y="5" width="36" height="36" rx="8" fill="#ab7340" ' + SW + '/><rect x="2" y="1" width="36" height="36" rx="8" fill="#fff0cc" ' + SW + '/><circle cx="12" cy="11" r="3.4" fill="#d69c28" stroke="' + INK + '" stroke-width="1.5"/><circle cx="28" cy="27" r="3.4" fill="#d69c28" stroke="' + INK + '" stroke-width="1.5"/></g><g transform="translate(62 34) rotate(12 20 20)"><rect x="2" y="5" width="36" height="36" rx="8" fill="#ab7340" ' + SW + '/><rect x="2" y="1" width="36" height="36" rx="8" fill="#fff0cc" ' + SW + '/><circle cx="12" cy="10" r="3.2" fill="#d69c28" stroke="' + INK + '" stroke-width="1.5"/><circle cx="28" cy="10" r="3.2" fill="#d69c28" stroke="' + INK + '" stroke-width="1.5"/><circle cx="20" cy="19" r="3.2" fill="#d69c28" stroke="' + INK + '" stroke-width="1.5"/><circle cx="12" cy="28" r="3.2" fill="#d69c28" stroke="' + INK + '" stroke-width="1.5"/><circle cx="28" cy="28" r="3.2" fill="#d69c28" stroke="' + INK + '" stroke-width="1.5"/></g><path d="M56 26 C52 16 60 12 60 4 C64 12 72 16 66 26 Z" fill="#f08a24" ' + SW + '/></svg>';
      case 'nest': return w + '<ellipse cx="60" cy="74" rx="50" ry="24" fill="#a9733f" ' + SW + '/>' + mini('#fff8ec', 46, 66, 1.3) + mini('#ffd23f', 64, 64, 1.3) + mini('#fff8ec', 80, 68, 1.2) + '<path d="M12 70 Q60 106 108 70 Q100 96 60 98 Q20 96 12 70 Z" fill="#8a5a2b" ' + SW + '/><path d="M20 82 L44 78 M54 92 L80 84 M86 88 L104 78 M30 90 L52 86" stroke="#5e3a1c" stroke-width="3" stroke-linecap="round"/></svg>';
      case 'mystery': return w + '<circle cx="60" cy="56" r="40" fill="#7b4bc4" ' + SW + '/><path d="M36 40 Q60 20 84 40 Q60 34 36 40 Z" fill="#b48cf2" opacity=".7"/><text x="60" y="76" font-size="54" font-weight="900" text-anchor="middle" fill="#ffc93c" stroke="' + INK + '" stroke-width="3" font-family="Georgia,serif">?</text><circle cx="96" cy="22" r="4" fill="#ffc93c"/><circle cx="20" cy="88" r="3" fill="#ffc93c"/></svg>';
      case 'well': return w + '<path d="M26 22 L60 6 L94 22 Z" fill="#b5523b" ' + SW + '/><path d="M32 22 V60 M88 22 V60" ' + SW + '/><rect x="22" y="56" width="76" height="44" rx="6" fill="#9aa3ad" ' + SW + '/><path d="M22 72 H98 M22 86 H98 M40 56 V72 M70 56 V72 M54 72 V86 M84 72 V86 M36 86 V100 M66 86 V100" stroke="' + INK + '" stroke-width="2.4"/><path d="M60 22 V44" stroke="' + INK + '" stroke-width="2"/><rect x="52" y="44" width="16" height="12" fill="#8a5a2b" ' + SW + '/></svg>';
      case 'witch': return w + '<path d="M14 84 Q60 98 106 84 Q114 76 100 74 Q60 82 20 74 Q6 76 14 84 Z" fill="#2d6b3a" ' + SW + '/><path d="M34 80 Q56 40 60 6 Q76 40 88 80 Z" fill="#3e9a4a" ' + SW + '/><path d="M38 70 Q62 76 84 70" stroke="#ffc93c" stroke-width="7" fill="none"/><circle cx="94" cy="22" r="5" fill="#b48cf2"/><circle cx="24" cy="40" r="4" fill="#b48cf2"/></svg>';
      case 'chick': return w + '<ellipse cx="60" cy="72" rx="32" ry="28" fill="#ffe066" ' + SW + '/><circle cx="60" cy="40" r="22" fill="#ffe066" ' + SW + '/><circle cx="52" cy="38" r="3.5" fill="' + INK + '"/><circle cx="68" cy="38" r="3.5" fill="' + INK + '"/><path d="M54 48 L60 56 L66 48 Z" fill="#f39a2b" ' + SW + '/><path d="M58 18 Q60 10 64 16" fill="none" ' + SW + '/><path d="M36 74 Q28 66 34 60" fill="none" ' + SW + '/></svg>';
      case 'mushroom': return w + '<rect x="46" y="54" width="28" height="42" rx="10" fill="#fff3df" ' + SW + '/><path d="M12 60 Q14 14 60 12 Q106 14 108 60 Z" fill="#e8403a" ' + SW + '/><circle cx="38" cy="36" r="7" fill="#fff"/><circle cx="64" cy="26" r="6" fill="#fff"/><circle cx="86" cy="44" r="7" fill="#fff"/><path d="M52 76 Q56 72 60 76" fill="none" stroke="' + INK + '" stroke-width="2.4"/><circle cx="66" cy="72" r="2.6" fill="' + INK + '"/></svg>';
      case 'crow': return w + '<ellipse cx="56" cy="70" rx="36" ry="24" fill="#2b2a38" ' + SW + '/><circle cx="84" cy="44" r="18" fill="#2b2a38" ' + SW + '/><path d="M98 42 L116 48 L98 54 Z" fill="#9aa3ad" ' + SW + '/><circle cx="88" cy="40" r="4" fill="#ffc93c"/><path d="M24 66 L4 56 L20 78 Z" fill="#2b2a38" ' + SW + '/><circle cx="30" cy="96" r="7" fill="#ffc93c" ' + SW + '/></svg>';
      case 'storm': return w + '<path d="M22 58 Q6 58 10 42 Q14 30 28 32 Q32 12 54 14 Q74 14 78 30 Q100 24 106 42 Q110 58 94 58 Z" fill="#8a8fa8" ' + SW + '/><path d="M60 54 L46 82 L58 82 L50 106 L76 72 L62 72 L70 54 Z" fill="#ffd23f" ' + SW + '/></svg>';
      case 'corn': return w + '<path d="M60 8 Q80 14 80 52 Q80 92 60 100 Q40 92 40 52 Q40 14 60 8 Z" fill="#ffc93c" ' + SW + '/><path d="M44 30 H76 M42 44 H78 M42 58 H78 M44 72 H76 M48 86 H72 M60 10 V98" stroke="#e09a1a" stroke-width="2.4"/><path d="M40 70 Q20 60 22 30 Q34 56 46 64 Z M80 70 Q100 60 98 30 Q86 56 74 64 Z" fill="#7fc45a" ' + SW + '/></svg>';
      case 'dice': return w + '<circle cx="60" cy="56" r="40" fill="#ffc93c" ' + SW + '/><circle cx="60" cy="56" r="30" fill="none" stroke="#e09a1a" stroke-width="3"/><path d="M48 42 Q60 30 72 42 Q72 56 60 56 Q48 56 48 70 Q60 82 72 70" fill="none" stroke="#a86a10" stroke-width="5" stroke-linecap="round"/></svg>';
      case 'bakery': return w + '<path d="M14 98 Q14 30 60 28 Q106 30 106 98 Z" fill="#8a5a4b" ' + SW + '/><path d="M40 98 V76 Q40 56 60 56 Q80 56 80 76 V98 Z" fill="#2a120a" ' + SW + '/><ellipse cx="60" cy="90" rx="12" ry="6" fill="#f08a24" opacity=".9"/><path d="M30 40 L44 52 M88 36 L76 50" stroke="' + INK + '" stroke-width="3"/></svg>';
      default: return w + '</svg>';
    }
    function mini(c, x, y, s) { s = s || 1; return '<path transform="translate(' + x + ' ' + y + ') scale(' + 0.24 * s + ') translate(-20 -48)" d="' + EGG_PATH + '" fill="' + c + '" stroke="' + INK + '" stroke-width="9"/>'; }
  };

  // ---------------------------------------------------------------- Cups for the shell game
  ART.cup = function () {
    return '<svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg"><path d="M8 104 L20 18 Q50 4 80 18 L92 104 Z" fill="#b5523b" ' + SW + '/><path d="M8 104 Q50 114 92 104" fill="none" ' + SW + '/><path d="M24 34 Q50 26 76 34" stroke="#ffc93c" stroke-width="6" fill="none"/><path d="M20 80 Q50 88 80 80" stroke="#8a3a2a" stroke-width="5" fill="none"/><ellipse cx="34" cy="50" rx="5" ry="16" fill="#fff" opacity=".25"/></svg>';
  };
  ART.goldenEgg = function () {
    return '<svg viewBox="0 0 40 49" xmlns="http://www.w3.org/2000/svg"><path d="' + EGG_PATH + '" fill="#ffd23f" stroke="' + INK + '" stroke-width="2.4"/><ellipse cx="13" cy="15" rx="3.4" ry="6" transform="rotate(20 13 15)" fill="#fff" opacity=".8"/><path d="M20 20 l2.4 5 5.4 .6 -4 3.7 1.1 5.3 -4.9 -2.7 -4.9 2.7 1.1 -5.3 -4 -3.7 5.4 -.6 z" fill="#fff6b0"/></svg>';
  };

  // ---------------------------------------------------------------- Oven
  ART.oven = function () {
    let bricks = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
      const x = 34 + c * 52 + (r % 2 ? 26 : 0);
      if (x > 360) continue;
      bricks += '<rect x="' + x + '" y="' + (262 + r * 18) + '" width="48" height="14" rx="3" fill="#a5452f" opacity=".55"/>';
    }
    let domeBricks = '';
    const arcs = [[150, 70], [120, 100], [96, 130], [80, 160]];
    for (const [rx, y] of arcs) domeBricks += '<path d="M' + (210 - rx) + ' ' + (y + 70) + ' Q210 ' + (y - 20) + ' ' + (210 + rx) + ' ' + (y + 70) + '" fill="none" stroke="#a5452f" stroke-width="3" opacity=".5"/>';
    return '<svg class="oven-svg" viewBox="0 0 420 330" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="ovenFire" cx="50%" cy="85%" r="70%"><stop offset="0" stop-color="#fff3b0"/><stop offset=".35" stop-color="#ffb030"/><stop offset=".75" stop-color="#e8402a"/><stop offset="1" stop-color="#3a0e06"/></radialGradient></defs>' +
      '<rect class="chimney" x="282" y="6" width="40" height="80" rx="4" fill="#8a3a2a" ' + SW + '/><rect x="276" y="2" width="52" height="14" rx="4" fill="#6e2e20" ' + SW + '/>' +
      '<path d="M44 262 Q44 44 210 40 Q376 44 376 262 Z" fill="#c9673f" ' + SW + '/>' + domeBricks +
      '<path d="M68 230 Q60 120 120 80" fill="none" stroke="#e58a5c" stroke-width="10" stroke-linecap="round" opacity=".6"/>' +
      '<rect x="26" y="252" width="368" height="72" rx="10" fill="#b5523b" ' + SW + '/>' + bricks +
      '<g class="oven-mouth"><path d="M126 262 L126 196 Q126 128 210 126 Q294 128 294 196 L294 262 Z" fill="#2a120a" ' + SW + '/>' +
      '<path class="oven-glow" d="M134 262 L134 198 Q134 136 210 134 Q286 136 286 198 L286 262 Z" fill="url(#ovenFire)"/>' +
      '<g class="flames">' +
      '<path class="flame fl1" d="M150 262 C150 238 160 228 166 210 C174 230 184 240 180 262 Z" fill="#ff7a1a"/>' +
      '<path class="flame fl2" d="M178 262 C176 230 192 214 202 190 C212 216 228 232 226 262 Z" fill="#ffa526"/>' +
      '<path class="flame fl3" d="M220 262 C220 236 234 222 242 204 C250 226 262 240 260 262 Z" fill="#ff7a1a"/>' +
      '<path class="flame fl4" d="M190 262 C190 246 198 236 204 226 C210 238 218 248 216 262 Z" fill="#fff0a0"/>' +
      '</g></g>' +
      '<path d="M120 262 Q120 120 210 118 Q300 120 300 262" fill="none" stroke="#7a2e1e" stroke-width="10"/>' +
      '<path d="M210 104 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1 z" fill="#ffc93c" ' + SW + ' class="oven-star"/>' +
      '<g class="oven-face face-calm"><circle cx="150" cy="96" r="7" fill="' + INK + '"/><circle cx="270" cy="96" r="7" fill="' + INK + '"/><circle cx="152" cy="94" r="2.4" fill="#fff"/><circle cx="272" cy="94" r="2.4" fill="#fff"/></g>' +
      '<g class="oven-face face-worry"><circle cx="150" cy="96" r="10" fill="#fff" ' + SW + '/><circle cx="270" cy="96" r="10" fill="#fff" ' + SW + '/><circle cx="150" cy="98" r="4" fill="' + INK + '"/><circle cx="270" cy="98" r="4" fill="' + INK + '"/><path d="M136 80 L160 86 M284 80 L260 86" ' + SW + '/></g>' +
      '<g class="oven-face face-panic"><circle cx="150" cy="96" r="12" fill="#fff" ' + SW + '/><circle cx="270" cy="96" r="12" fill="#fff" ' + SW + '/><circle cx="150" cy="96" r="3" fill="' + INK + '"/><circle cx="270" cy="96" r="3" fill="' + INK + '"/><path d="M134 76 L162 86 M286 76 L258 86" ' + SW + '/><path d="M300 70 Q306 82 300 88 Q294 82 300 70 Z" fill="#9fe0ff" ' + SW + '/></g>' +
      '<g class="oven-face face-burnt"><path d="M142 88 L158 104 M158 88 L142 104 M262 88 L278 104 M278 88 L262 104" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/></g>' +
      '<g class="oven-face face-happy"><path d="M140 100 Q150 86 160 100 M260 100 Q270 86 280 100" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/></g>' +
      '</svg>';
  };

  // ---------------------------------------------------------------- Pastry made from the bake
  ART.pastry = function (bake, result) {
    const counts = {};
    for (const e of bake.oven) counts[e.type] = (counts[e.type] || 0) + 1;
    const puff = window.BB.bakePuff(bake);
    const h = result === 'burnt' ? 34 : Math.max(18, Math.min(70, 18 + puff * 2.4));
    const crust = result === 'burnt' ? '#3b2b24' : result === 'under' ? '#f3dca8' : '#e2a24c';
    const top = result === 'burnt' ? '#2a1d18' : result === 'under' ? '#f8e8c0' : '#f6c26b';
    const y0 = 110 - h;
    let s = '<svg class="pastry-svg" viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">';
    s += '<ellipse cx="100" cy="122" rx="86" ry="14" fill="#d9d2cb" ' + SW + '/>';
    s += '<path d="M30 112 L36 ' + (y0 + 14) + ' Q100 ' + (y0 - 18) + ' 164 ' + (y0 + 14) + ' L170 112 Q100 128 30 112 Z" fill="' + crust + '" ' + SW + '/>';
    s += '<path d="M40 ' + (y0 + 16) + ' Q100 ' + (y0 - 10) + ' 160 ' + (y0 + 16) + ' Q100 ' + (y0 + 30) + ' 40 ' + (y0 + 16) + ' Z" fill="' + top + '"/>';
    // crimps
    for (let i = 0; i < 9; i++) s += '<circle cx="' + (38 + i * 15.5) + '" cy="' + (112 - Math.sin(i / 8 * Math.PI) * -4) + '" r="5" fill="' + crust + '" stroke="' + INK + '" stroke-width="2"/>';
    if (result !== 'burnt') {
      // toppings: little dots in egg colours
      let k = 0;
      for (const t of Object.keys(counts)) {
        const col = window.BB.EGGS[t].color;
        for (let i = 0; i < Math.min(3, counts[t]); i++) {
          const x = 56 + ((k * 37) % 90);
          const y = y0 + 10 + ((k * 13) % 14);
          s += '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + col + '" stroke="' + INK + '" stroke-width="1.6"/>';
          k++;
        }
      }
      if (result === 'served') s += '<path d="M100 ' + (y0 - 14) + ' l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" fill="#ffc93c" stroke="' + INK + '" stroke-width="2"/>';
    } else {
      s += '<path d="M70 ' + (y0 - 6) + ' Q60 ' + (y0 - 24) + ' 74 ' + (y0 - 38) + ' M100 ' + (y0 - 8) + ' Q90 ' + (y0 - 28) + ' 104 ' + (y0 - 44) + ' M130 ' + (y0 - 6) + ' Q120 ' + (y0 - 24) + ' 134 ' + (y0 - 38) + '" fill="none" stroke="#6b6b6b" stroke-width="5" stroke-linecap="round" opacity=".7"/>';
    }
    s += '</svg>';
    return s;
  };

  // ---------------------------------------------------------------- Canvas scenery
  function srand(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

  const SCENES = {
    meadow: { sky: ['#7cc8f0', '#c9ecff', '#fff3d4'], far: '#a6d98a', mid: '#82c46a', near: '#5fae55', sun: true, deco: 'flowers' },
    title: { sky: ['#ff9f6b', '#ffcf8f', '#fff0c8'], far: '#c7a0c8', mid: '#9cc47a', near: '#6fae55', sun: true, deco: 'flowers' },
    woods: { sky: ['#1e4a52', '#4f8a7a', '#a9d3a0'], far: '#2f6a58', mid: '#245446', near: '#1b4036', sun: false, deco: 'pines' },
    castle: { sky: ['#1a1238', '#4a2a6a', '#b0587a'], far: '#3a2a5a', mid: '#2a1e44', near: '#1c142e', sun: false, deco: 'castle' },
    den: { sky: ['#2a1a3a', '#4a2a4a', '#7a3a3a'], far: '#3a2440', mid: '#2e1c34', near: '#22142a', sun: false, deco: 'lanterns' },
  };

  ART.paintScene = function (canvas, key, seed) {
    const S = SCENES[key] || SCENES.meadow;
    const w = canvas.width, hgt = canvas.height;
    const ctx = canvas.getContext('2d');
    const k = w / 1280;
    const rnd = srand(seed || 7);
    const g = ctx.createLinearGradient(0, 0, 0, hgt);
    g.addColorStop(0, S.sky[0]); g.addColorStop(0.55, S.sky[1]); g.addColorStop(1, S.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, hgt);
    if (S.sun) {
      const sg = ctx.createRadialGradient(1040 * k, 150 * k, 10 * k, 1040 * k, 150 * k, 180 * k);
      sg.addColorStop(0, 'rgba(255,250,210,1)'); sg.addColorStop(0.3, 'rgba(255,240,170,.8)'); sg.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, w, hgt);
      ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(1040 * k, 150 * k, 52 * k, 0, 7); ctx.fill();
    } else {
      // stars + moon
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = 'rgba(255,255,230,' + (0.3 + rnd() * 0.6) + ')';
        ctx.beginPath(); ctx.arc(rnd() * w, rnd() * hgt * 0.5, (0.6 + rnd() * 1.6) * k, 0, 7); ctx.fill();
      }
      if (key !== 'den') {
        ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(980 * k, 120 * k, 46 * k, 0, 7); ctx.fill();
        ctx.fillStyle = S.sky[0]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(1000 * k, 108 * k, 40 * k, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      }
    }
    const hill = (base, amp, col, ph, freq) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, hgt);
      for (let x = 0; x <= 1280; x += 16) {
        const y = base + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 2.3 + ph * 2) * amp * 0.35;
        ctx.lineTo(x * k, y * k);
      }
      ctx.lineTo(w, hgt); ctx.closePath(); ctx.fill();
    };
    const pine = (x, y, s, col) => {
      ctx.fillStyle = col; ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const yy = y - i * s * 0.5;
        ctx.moveTo((x - s * (0.6 - i * 0.12)) * k, yy * k); ctx.lineTo(x * k, (yy - s * 0.8) * k); ctx.lineTo((x + s * (0.6 - i * 0.12)) * k, yy * k);
      }
      ctx.fill();
      ctx.fillRect((x - s * 0.06) * k, y * k, s * 0.12 * k, s * 0.2 * k);
    };
    hill(430, 30, S.far, rnd() * 6, 0.006);
    if (S.deco === 'castle') {
      // castle silhouette
      ctx.fillStyle = '#120c22';
      const cx = 760;
      const tower = (x, wd, ht) => {
        ctx.fillRect((x - wd / 2) * k, (430 - ht) * k, wd * k, ht * k);
        ctx.beginPath(); ctx.moveTo((x - wd / 2 - 8) * k, (430 - ht) * k); ctx.lineTo(x * k, (430 - ht - wd * 1.1) * k); ctx.lineTo((x + wd / 2 + 8) * k, (430 - ht) * k); ctx.fill();
      };
      ctx.fillRect((cx - 170) * k, 330 * k, 340 * k, 110 * k);
      for (let i = 0; i < 9; i++) ctx.fillRect((cx - 170 + i * 40) * k, 316 * k, 22 * k, 16 * k);
      tower(cx - 170, 60, 180); tower(cx + 170, 60, 180); tower(cx, 80, 260); tower(cx - 80, 44, 200); tower(cx + 80, 44, 200);
      ctx.fillStyle = '#ffcf6a';
      for (let i = 0; i < 14; i++) { const wx = cx - 160 + rnd() * 320, wy = 200 + rnd() * 200; ctx.fillRect(wx * k, wy * k, 8 * k, 13 * k); }
      // banner
      ctx.fillStyle = '#e0742c'; ctx.fillRect((cx - 2) * k, 90 * k, 4 * k, 40 * k); ctx.beginPath(); ctx.moveTo(cx * k, 92 * k); ctx.lineTo((cx + 36) * k, 100 * k); ctx.lineTo(cx * k, 110 * k); ctx.fill();
    }
    hill(500, 24, S.mid, rnd() * 6, 0.009);
    if (S.deco === 'pines') {
      for (let i = 0; i < 26; i++) pine(rnd() * 1280, 470 + rnd() * 40, 70 + rnd() * 60, i % 2 ? '#1f4d40' : '#173d33');
    }
    if (S.deco === 'lanterns') {
      for (let i = 0; i < 9; i++) {
        const x = 80 + i * 140, y = 70 + Math.sin(i) * 24;
        ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(x * k, 0); ctx.lineTo(x * k, y * k); ctx.stroke();
        const lg = ctx.createRadialGradient(x * k, (y + 18) * k, 2, x * k, (y + 18) * k, 70 * k);
        lg.addColorStop(0, 'rgba(255,190,90,.55)'); lg.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = lg; ctx.fillRect((x - 70) * k, (y - 52) * k, 140 * k, 140 * k);
        ctx.fillStyle = ['#e8403a', '#ffc93c', '#7b4bc4'][i % 3]; ctx.beginPath(); ctx.ellipse(x * k, (y + 18) * k, 14 * k, 18 * k, 0, 0, 7); ctx.fill();
      }
    }
    hill(580, 18, S.near, rnd() * 6, 0.012);
    if (S.deco === 'flowers') {
      const cols = ['#ff8fa3', '#ffd23f', '#fff', '#b48cf2', '#ff7a5a'];
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath(); ctx.arc(rnd() * w, (590 + rnd() * 130) * k, (2 + rnd() * 3) * k, 0, 7); ctx.fill();
      }
      for (let i = 0; i < 6; i++) { // little trees
        const x = rnd() * 1280, y = 470 + rnd() * 40;
        ctx.fillStyle = '#7a4e2d'; ctx.fillRect((x - 5) * k, y * k, 10 * k, 40 * k);
        ctx.fillStyle = i % 2 ? '#4f9e48' : '#5fae55'; ctx.beginPath(); ctx.arc(x * k, (y - 10) * k, 34 * k, 0, 7); ctx.fill();
      }
    }
    if (S.deco === 'pines') {
      for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,240,150,' + (0.2 + rnd() * 0.4) + ')'; ctx.beginPath(); ctx.arc(rnd() * w, (420 + rnd() * 260) * k, 2 * k, 0, 7); ctx.fill(); }
    }
    // vignette
    const v = ctx.createRadialGradient(w / 2, hgt / 2, hgt * 0.3, w / 2, hgt / 2, w * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(30,10,0,.35)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, hgt);
  };

  // Animated ambient layer (drawn every frame on top of the cached scene).
  const motes = [];
  for (let i = 0; i < 40; i++) motes.push({ x: Math.random() * 1280, y: Math.random() * 720, s: 0.5 + Math.random(), p: Math.random() * 6 });
  ART.ambient = function (ctx, key, t, k) {
    if (key === 'meadow' || key === 'title') {
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (let i = 0; i < 5; i++) {
        const x = ((i * 300 + t * (8 + i * 3)) % 1600) - 160, y = 60 + i * 34;
        cloud(ctx, x * k, y * k, (0.7 + (i % 3) * 0.25) * k);
      }
    } else {
      const col = key === 'woods' ? '255,240,140' : key === 'den' ? '255,190,90' : '255,220,255';
      for (const m of motes) {
        const x = (m.x + Math.sin(t * 0.3 + m.p) * 30) * k;
        const y = ((m.y - t * 6 * m.s) % 720 + 720) % 720 * k;
        const a = 0.25 + 0.35 * Math.sin(t * 2 + m.p);
        ctx.fillStyle = 'rgba(' + col + ',' + Math.max(0, a) + ')';
        ctx.beginPath(); ctx.arc(x, y, 2.2 * m.s * k, 0, 7); ctx.fill();
      }
    }
  };
  function cloud(ctx, x, y, s) {
    ctx.beginPath();
    ctx.arc(x, y, 26 * s, 0, 7); ctx.arc(x + 30 * s, y - 12 * s, 32 * s, 0, 7); ctx.arc(x + 64 * s, y, 26 * s, 0, 7); ctx.arc(x + 32 * s, y + 8 * s, 26 * s, 0, 7);
    ctx.fill();
  }
  ART.spell = id => '<svg viewBox="0 0 40 49">'+GLYPH[window.BB.SPELLS[id].glyph]+'</svg>';
  ART.die = value => {
    const positions={2:[[23,23],[57,57]],3:[[23,23],[40,40],[57,57]],4:[[23,23],[57,23],[23,57],[57,57]],5:[[23,23],[57,23],[40,40],[23,57],[57,57]],6:[[23,23],[57,23],[23,40],[57,40],[23,57],[57,57]]};
    return '<svg viewBox="0 0 80 86"><rect x="4" y="8" width="72" height="72" rx="15" fill="#ab7340" stroke="#3b2418" stroke-width="4"/><rect x="4" y="3" width="72" height="72" rx="15" fill="#fff0cc" stroke="#3b2418" stroke-width="4"/>'+(value===1?'<g transform="translate(7 -3) scale(1.65)">'+GLYPH.flame+'</g>':positions[value].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="6" fill="#d69c28" stroke="#81501e" stroke-width="2"/>').join(''))+'</svg>';
  };
  const CHARM_PATHS={
    whisk:'M14 27L27 10M23 8C10 1 3 20 17 23M23 8C4 8 7 26 17 23M23 8L17 23',
    bowl:'M5 12H27Q26 27 16 27Q6 27 5 12M4 9H28',
    icebox:'M7 3H25V29H7ZM7 14H25M21 8V11M21 18V23',
    apron:'M10 4H22L21 11L28 26Q16 31 4 26L11 11ZM12 20H20V25H12',
    cryo:'M4 24L2 11L10 17L16 5L22 17L30 11L28 24ZM16 9V18M12 13H20',
    kettle:'M7 13Q3 27 16 27Q29 27 25 13ZM9 12Q8 4 16 4Q24 4 23 12M25 15L30 9V20L25 23',
    bellows:'M4 9L20 4L26 20L10 25ZM7 10L23 20M10 8L25 16M12 24L6 30M25 8L30 6',
    mitt:'M8 28V13Q9 5 13 9V5Q18 1 21 6L25 18L29 15Q33 17 25 28Z',
    pbell:'M7 23Q10 16 9 12Q16 0 23 12Q22 16 25 23ZM13 27H19M16 4V1',
    grinder:'M12 4H22L20 11L25 26H9L14 11ZM7 2H26M13 18H22M11 23H24',
    spoon:'M10 29L17 17C3 10 19-5 23 6Q27 15 17 17',
    brooch:'M7 27Q2 7 26 3Q28 22 7 27ZM8 26L23 7M11 17L21 17M15 11L16 20',
    stormrod:'M8 28L22 9M19 2L12 14H20L14 24L29 10H21L25 2',
    mirror:'M4 4H28V27H4ZM8 8H24V23H8ZM10 18L19 9M17 21L23 15',
    featherwt:'M16 4V28M5 10H27M8 11L2 21H14ZM24 11L18 21H30ZM10 29H22',
    tipjar:'M8 8H24V28H8ZM6 4H26V8H6ZM16 11V24M20 14H13V18H19V22H12',
    cornucopia:'M4 7Q5 28 23 28L30 20Q15 25 4 7ZM23 17Q18 9 24 8Q30 6 29 17',
    ledger:'M5 3H26V29H5ZM10 3V29M14 10H22M14 16H22M14 22H22',
    nestegg:'M4 22Q16 34 28 22M3 26H29M9 22C4 10 15 0 19 5Q31 22 17 23',
    pin:'M7 8L24 25M4 5L8 1M27 28L31 24M7 11L11 7L26 22L22 26Z'
  };
  ART.charm = id => {
    const E=window.BB.CHARMS[id],color={simmer:'#7fd4ff',fry:'#ffac69',alchemy:'#d4b3ff',goose:'#ffe277'}[E.arch];
    return '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="'+color+'" stroke="#684522" stroke-width="3"/><circle cx="20" cy="20" r="15" fill="none" stroke="#fff6d0" stroke-width="1.5"/><g transform="translate(5 4) scale(.92)" fill="none" stroke="#684522" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+CHARM_PATHS[id].split('M').filter(Boolean).map(p=>'<path d="M'+p+'"/>').join('')+'</g></svg>';
  };
})();
