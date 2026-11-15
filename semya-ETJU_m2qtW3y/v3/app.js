/* Вариант 3 — «Галерея». Данные: ../data.js (DATA), ../people.js (FAM), dims.js (соотношения сторон превью). */
(() => {
'use strict';
const D = window.DATA, F = window.FAM, P = F.P, DIMS = window.DIMS || {};
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T = id => `../img/t/${id}.jpg`, FULL = id => `../img/f/${id}.jpg`;
const app = $('#app');
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const HOVER = matchMedia('(hover: hover) and (pointer: fine)');
const has = id => !!P[id];

/* ───────── связи ───────── */
const parentsOf = {}, childrenOf = {};
for (const [c, p, h] of F.EDGES) {
  if (!has(c) || !has(p)) continue;
  (parentsOf[c] ||= []).push({id: p, hyp: !!h});
  (childrenOf[p] ||= []).push({id: c, hyp: !!h});
}
const KW = [['папа',1],['дедушк',1],['отец',1],['брат',1],['дядя',1],['муж',1],['сын',1],
            ['мама',0],['бабушк',0],['мать',0],['сестр',0],['тётя',0],['тетя',0],['жена',0],['дочь',0]];
function male(id) {
  const p = P[id], rl = (p.rl || '').toLowerCase();
  let best = null, bi = 1e9;
  for (const [k, v] of KW) { const i = rl.indexOf(k); if (i >= 0 && i < bi) { bi = i; best = v; } }
  if (best !== null) return !!best;
  const w = p.name.split(/\s+/);
  if (w.some(x => /вич$/.test(x))) return true;
  if (w.some(x => /вна$/.test(x))) return false;
  return !/[ая]$/.test(w[0]);
}
function nameParts(id) {
  const w = P[id].name.split(/\s+/);
  const first = w[0];
  const patr = w[1] && /(вич|вна|чна|ична)$/.test(w[1]) ? w[1] : '';
  let sur = w.length > 1 && w[w.length - 1] !== patr ? w[w.length - 1] : '';
  if (/^и$/.test(w[1] || '')) sur = '';
  const maiden = ((P[id].yr || '').match(/урожд\.\s*([А-ЯЁ][а-яё-]+)/) || [])[1] || '';
  return {first, patr, sur, maiden};
}
const initials = id => { const n = nameParts(id); return (n.first[0] + '.' + (n.sur ? ' ' + n.sur[0] + '.' : '')); };

/* линия и поколение */
const lineOf = {}, genOf = {};
F.ME.forEach(id => { lineOf[id] = 'c'; genOf[id] = 0; });
for (const side of ['father', 'mother']) {
  const L = F.LAYOUT[side], n = L.gens.length;
  L.gens.forEach((row, i) => row.forEach(g => g.ids.forEach(id => { if (!has(id)) return; lineOf[id] ??= side[0]; genOf[id] ??= n - i; })));
}
(F.SIBLINGS.father || []).forEach(id => { lineOf[id] ??= 'f'; genOf[id] ??= genOf.evgeny ?? 1; });
(F.SIBLINGS.sukhov || []).forEach(id => { lineOf[id] ??= 'f'; genOf[id] ??= genOf.klavdia ?? 2; });
// остальные — по рёбрам
for (let pass = 0; pass < 6; pass++) for (const id in P) {
  if (genOf[id] != null) continue;
  const c = (childrenOf[id] || []).find(x => genOf[x.id] != null);
  if (c) { genOf[id] = genOf[c.id] + 1; lineOf[id] ??= lineOf[c.id]; continue; }
  const p = (parentsOf[id] || []).find(x => genOf[x.id] != null);
  if (p) { genOf[id] = genOf[p.id] - 1; lineOf[id] ??= lineOf[p.id]; }
}
const LINE_T = {f: F.LAYOUT.father, m: F.LAYOUT.mother};

/* ───────── порядок людей (для стены и «соседних экспонатов») ───────── */
const GEN_TITLE = ['', 'Родители, их братья и сёстры', 'Бабушки, дедушки и их родня', 'Прабабушки и прадедушки', 'Прапрабабушки и прапрадедушки'];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
function wallGroups() {
  const seen = new Set(), groups = [];
  const push = (g, id) => { if (!has(id) || seen.has(id)) return; seen.add(id); (groups[g] ||= []).push(id); };
  F.ME.forEach(id => push(0, id));
  const maxG = Math.max(...Object.values(genOf).filter(x => x != null));
  for (let g = 1; g <= maxG; g++) {
    const fRow = F.LAYOUT.father.gens[F.LAYOUT.father.gens.length - g] || [];
    fRow.forEach(x => x.ids.forEach(id => push(g, id)));
    if (g === genOf.evgeny) (F.SIBLINGS.father || []).forEach(id => push(g, id));
    if (g === genOf.klavdia) (F.SIBLINGS.sukhov || []).forEach(id => push(g, id));
    const mRow = F.LAYOUT.mother.gens[F.LAYOUT.mother.gens.length - g] || [];
    mRow.forEach(x => x.ids.forEach(id => push(g, id)));
    for (const id in P) if (genOf[id] === g) push(g, id);
  }
  const rest = Object.keys(P).filter(id => !seen.has(id));
  return {groups, rest};
}
const WG = wallGroups();
const ORDER = [...WG.groups.flat().filter(Boolean), ...WG.rest];

/* ───────── портреты с кадрированием по лицу ───────── */
function crop(id, b, big) {
  const p = P[id]; if (!p || !p.av) return null;
  if (D.avatars[p.av]) return {src: '../' + D.avatars[p.av], fit: '50% 32%'};
  const ph = D.photos[p.av]; if (!ph) return null;
  const r = DIMS[p.av] || 0.8;
  const f = (ph.faces || []).find(x => x[4] === id);
  if (!f) return {src: big ? FULL(p.av) : T(p.av), fit: r < 1 ? '50% 22%' : '50% 40%'};
  const fcx = f[0] + f[2] / 2, fcy = f[1] + f[3] / 2;
  const minW = Math.max(1, r / b);
  const Wd = Math.max(minW, Math.min(0.4 / f[2], 4.5));
  const Hd = Wd / r * b;
  const left = Math.min(0, Math.max(1 - Wd, 0.5 - fcx * Wd));
  const top = Math.min(0, Math.max(1 - Hd, 0.44 - fcy * Hd));
  return {src: (big || Wd > 1.5) ? FULL(p.av) : T(p.av), Wd, Hd, left, top, r};
}
function portrait(id, b = 0.8, {big = false, cls = '', eager = false} = {}) {
  const c = crop(id, b, big), p = P[id];
  const ini = `<span class="ini" aria-hidden="true">${esc(initials(id))}</span>`;
  if (!c) return `<div class="pt ${cls}" role="img" aria-label="${esc(p.name)} — портрета нет">${ini}</div>`;
  const ld = eager ? '' : ' loading="lazy"';
  const st = c.fit ? `inset:0;width:100%;height:100%;object-fit:cover;object-position:${c.fit}`
    : `width:${(c.Wd * 100).toFixed(2)}%;left:${(c.left * 100).toFixed(2)}%;top:${(c.top * 100).toFixed(2)}%`;
  return `<div class="pt ${cls}"><img src="${c.src}" alt="${esc(p.name)}"${ld} decoding="async" style="${st}"></div>`;
}
document.addEventListener('load', e => { if (e.target.tagName === 'IMG') e.target.classList.add('ok'); }, true);
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') { e.target.style.display = 'none'; } }, true);

/* статус */
const ST_WHY = {doc: 'сведения подтверждены документами', fam: 'сведения записаны по рассказам семьи', hyp: 'связь или сведения нужно проверить'};
const stHTML = st => st && F.ST[st] ? `<span class="st st-${st}"><i aria-hidden="true"></i>${esc(F.ST[st])}</span>` : '';
const legendHTML = () => Object.keys(F.ST).map(stHTML).join('');
$('#footLegend').innerHTML = legendHTML();

const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c); };
const nPhoto = n => `${n} ${plural(n, 'фотография', 'фотографии', 'фотографий')}`;

/* ───────── фото: альбомы ───────── */
const visible = id => !D.photos[id].hide;
const albumPhotos = a => D.order.filter(id => D.photos[id] && D.photos[id].a === a && visible(id));
const albumTitle = a => (D.albums.find(x => x.id === a) || {}).title || '';
const albumEyebrow = a => a === 'old' ? 'Семейный архив' : 'Из альбомов мамы';
function photoItem(id) {
  const ph = D.photos[id];
  return {key: id, th: T(id), full: FULL(id), r: DIMS[id] || 1.33, cap: ph.cap || '', who: (ph.who || []).filter(has), faces: ph.faces || [], a: ph.a};
}
function personItems(pid) {
  const p = P[pid], out = [], seen = new Set();
  if (p.av && D.avatars[p.av]) out.push({key: 'av:' + p.av, th: '../' + D.avatars[p.av], full: '../' + D.avatars[p.av], r: 0.85, cap: p.name, who: [pid], faces: []});
  const add = id => { if (!D.photos[id] || seen.has(id)) return; seen.add(id); out.push(photoItem(id)); };
  if (p.av && D.photos[p.av]) add(p.av);
  D.order.forEach(id => { const ph = D.photos[id]; if (ph && (ph.who || []).includes(pid)) add(id); });
  (p.gal || []).forEach(add);
  return out;
}

/* ровные ряды */
function justify(el, items, opts = {}) {
  const draw = () => {
    const W = el.clientWidth; if (!W) return;
    const gap = parseFloat(getComputedStyle(el).getPropertyValue('--g')) || 8;
    const target = opts.h || (W < 560 ? 112 : W < 1000 ? 170 : 220);
    const html = []; let row = [], sum = 0;
    const flush = last => {
      if (!row.length) return;
      let h = (W - 1 - gap * (row.length - 1)) / sum;
      if (last && h > target * 1.25) h = target;
      row.forEach(({it, i}) => {
        const w = Math.floor(it.r * h * 100) / 100;
        html.push(`<button class="tile" type="button" data-i="${i}" style="width:${w}px;height:${h.toFixed(2)}px" aria-label="${esc(it.cap || 'Фотография')}"><img src="${it.th}" alt="${esc(it.cap)}" loading="lazy" decoding="async"></button>`);
      });
      row = []; sum = 0;
    };
    items.forEach((it, i) => {
      row.push({it, i}); sum += it.r;
      if (sum * target + gap * (row.length - 1) >= W) flush(false);
    });
    flush(true);
    el.innerHTML = html.join('');
  };
  draw();
  let lastW = el.clientWidth;
  const ro = new ResizeObserver(() => { if (Math.abs(el.clientWidth - lastW) > 2) { lastW = el.clientWidth; draw(); } });
  ro.observe(el); cleanups.push(() => ro.disconnect());
  el.addEventListener('click', e => { const b = e.target.closest('.tile'); if (b) LB.open(items, +b.dataset.i, b); });
}

/* ───────── веер ───────── */
const CX = 500, CY = 500, HUB = 118, RMAX = 500;
const pt = (r, a) => [CX + r * Math.cos(a * Math.PI / 180), CY - r * Math.sin(a * Math.PI / 180)];
const f2 = n => n.toFixed(2);
const P2 = (r, a) => pt(r, a).map(f2).join(' ');
function sectorPath(r0, r1, a0, a1) {
  const lg = a0 - a1 > 180 ? 1 : 0;
  if (r0 <= 0) return `M${CX} ${CY}L${P2(r1, a0)}A${r1} ${r1} 0 ${lg} 1 ${P2(r1, a1)}Z`;
  return `M${P2(r0, a0)}L${P2(r1, a0)}A${r1} ${r1} 0 ${lg} 1 ${P2(r1, a1)}L${P2(r0, a1)}A${r0} ${r0} 0 ${lg} 0 ${P2(r0, a0)}Z`;
}
function ancestorRings(root, depth) {
  const rings = [[{id: root}]];
  for (let k = 1; k <= depth; k++) {
    const cur = [];
    for (const s of rings[k - 1]) {
      let fa = null, mo = null;
      if (s) for (const x of (parentsOf[s.id] || [])) {
        if (male(x.id)) { if (!fa) fa = x; else if (!mo) mo = x; }
        else { if (!mo) mo = x; else if (!fa) fa = x; }
      }
      cur.push(fa, mo);
    }
    if (!cur.some(Boolean)) break;
    rings.push(cur);
  }
  return rings;
}
const cv = document.createElement('canvas').getContext('2d');
const tw = (s, size, fam, wt) => { cv.font = `${wt} ${size}px ${fam}`; return cv.measureText(s).width; };
const FAM_SANS = '"Golos", sans-serif', FAM_TEXT = '"Spectral", serif';
function fit(cands, size, maxw, fam = FAM_SANS, wt = 500) {
  cands = cands.filter(Boolean);
  for (const c of cands) if (tw(c, size, fam, wt) <= maxw) return {s: c, size};
  const last = cands[cands.length - 1] || '';
  for (let z = size; z >= size * 0.78; z -= 0.5) if (tw(last, z, fam, wt) <= maxw) return {s: last, size: z};
  return {s: last, size: size * 0.78};
}
let clipN = 0;
function svgPortrait(id, cx, cy, pr, cls = '') {
  const c = crop(id, 1, false);
  const cid = 'cp' + (++clipN);
  let img = '';
  if (c && c.fit) img = `<image href="${c.src}" x="${f2(cx - pr)}" y="${f2(cy - pr)}" width="${f2(2 * pr)}" height="${f2(2 * pr)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${cid})"/>`;
  else if (c) img = `<image href="${c.src}" x="${f2(cx - pr + c.left * 2 * pr)}" y="${f2(cy - pr + c.top * 2 * pr)}" width="${f2(c.Wd * 2 * pr)}" height="${f2(c.Wd * 2 * pr / c.r)}" preserveAspectRatio="none" clip-path="url(#${cid})"/>`;
  const ini = c ? '' : `<text class="initials" x="${f2(cx)}" y="${f2(cy + 1)}" font-size="${f2(pr * 0.72)}">${esc(initials(id))}</text>`;
  return `<g class="${cls}"><clipPath id="${cid}"><circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(pr)}"/></clipPath><circle class="ph-empty" cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(pr)}"/>${img}${ini}<circle class="pring" cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(pr)}"/></g>`;
}
function tText(s, x, y, rot, size, cls = '', fam) {
  return `<text class="${cls}" transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)})" font-size="${f2(size)}"${fam ? ` style="font-family:${fam}"` : ''}>${esc(s)}</text>`;
}
function fanSVG() {
  const root = F.ME[F.ME.length - 1];
  const rings = ancestorRings(root, 5);
  const n = rings.length - 1, W = (RMAX - HUB) / n;
  const out = [];
  // центр: Виктория и Денис
  const me = F.ME.filter(has);
  me.forEach((id, i) => {
    const span = 180 / me.length, a0 = 180 - i * span, a1 = a0 - span, am = (a0 + a1) / 2;
    const [px, py] = pt(HUB * 0.56, am);
    out.push(`<a class="sector c" href="#/p/${id}" data-id="${id}" style="--d:0ms" aria-label="${esc(P[id].name)}"><title>${esc(P[id].name)}</title><path class="bg" d="${sectorPath(0, HUB, a0, a1)}"/>${svgPortrait(id, px, py, HUB * 0.34)}</a>`);
  });
  for (let k = 1; k <= n; k++) {
    const slots = rings[k], span = 180 / slots.length, r0 = HUB + (k - 1) * W, r1 = r0 + W;
    slots.forEach((s, j) => {
      const a0 = 180 - j * span, a1 = a0 - span, am = (a0 + a1) / 2;
      const side = am > 90 ? 'f' : 'm';
      const d = `--d:${Math.round(160 + k * 190 + j * (90 / slots.length))}ms`;
      const path = sectorPath(r0, r1, a0, a1);
      if (!s) { out.push(`<g class="sector empty" style="${d}" aria-hidden="true"><path class="bg" d="${path}"/></g>`); return; }
      const id = s.id, p = P[id], np = nameParts(id), hyp = s.hyp || p.st === 'hyp';
      const lab = [];
      const arc = r => r * span * Math.PI / 180 * 0.86;
      const rot = 90 - am;
      if (k <= 3) {
        const cfg = [null,
          {pr: .27, pp: .64, dr: .17, ds: 25, mr: .17, ms: 30, port: 'all'},
          {pr: .2, pp: .67, dr: .24, ds: 19, mr: .5, ms: 30, port: 'd'},
          {pr: .155, pp: .72, dr: .4, ds: 15.5, mr: .5, ms: 27, port: 'd', sub: .15}][k];
        const [qx, qy] = pt(r0 + W * cfg.pp, am);
        if (p.av || k <= 2) lab.push(svgPortrait(id, qx, qy, W * cfg.pr, cfg.port === 'd' ? 'd-only' : ''));
        // компьютер
        const rd = r0 + W * cfg.dr, fd = fit([np.first], cfg.ds, arc(rd), k === 1 ? FAM_TEXT : FAM_SANS, k === 1 ? 400 : 500);
        lab.push(tText(fd.s, ...pt(rd, am), rot, fd.size, 'd-only' + (k === 1 ? ' n1' : '')));
        if (cfg.sub && k === 3) {
          const rs = r0 + W * cfg.sub, sub = np.sur || (np.maiden ? 'урожд. ' + np.maiden : '');
          if (sub) { const fs = fit([sub], 12.5, arc(rs), FAM_SANS, 400); lab.push(tText(fs.s, ...pt(rs, am), rot, fs.size, 'd-only sub')); }
        }
        // телефон
        const rm = r0 + W * cfg.mr, fm = fit([np.first, initials(id)], cfg.ms, arc(rm), k === 1 ? FAM_TEXT : FAM_SANS, k === 1 ? 400 : 500);
        lab.push(tText(fm.s, ...pt(rm, am), rot, fm.size, 'm-only' + (k === 1 ? ' n1' : '')));
      } else {
        // внешнее кольцо: на компьютере — радиально имя и фамилия, на телефоне — инициалы
        const rc = r0 + W * .5, [x, y] = pt(rc, am), rr = am < 90 ? -am : 180 - am;
        const len = W * .88, gapA = span * Math.PI / 180 * rc;
        const two = gapA > 34;
        const a = fit([np.first], 14.5, len), b2 = np.sur ? fit([np.sur], 12, len, FAM_SANS, 400) : null;
        const off = two && b2 ? 8.5 : 0;
        lab.push(`<g class="d-only" transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rr)})"><text y="${-off}" font-size="${a.size}">${esc(a.s)}</text>${two && b2 ? `<text class="sub" y="${off + 1}" font-size="${b2.size}">${esc(b2.s)}</text>` : ''}</g>`);
        const fm = fit([initials(id), np.first[0] + '.'], 27, arc(rc));
        lab.push(tText(fm.s, x, y, rot, fm.size, 'm-only'));
      }
      out.push(`<a class="sector ${side}${hyp ? ' hyp' : ''}" href="#/p/${id}" data-id="${id}" style="${d}" aria-label="${esc(p.name + (p.rl ? ', ' + p.rl.toLowerCase() : ''))}"><title>${esc(p.name)}</title><path class="bg" d="${path}"/>${hyp ? `<path class="dash" d="${sectorPath(r0 + 5, r1 - 5, a0 - .9, a1 + .9)}"/>` : ''}${lab.join('')}</a>`);
    });
  }
  // римские номера колец под основанием
  const base = [];
  for (let k = 1; k <= n; k++) {
    const r = HUB + (k - .5) * W;
    base.push(`<text class="ring-no" x="${f2(CX - r)}" y="${CY + 22}">${ROMAN[k]}</text><text class="ring-no" x="${f2(CX + r)}" y="${CY + 22}">${ROMAN[k]}</text>`);
  }
  return {svg: `<svg class="fan" viewBox="-6 -6 1012 540" role="group" aria-label="Веер поколений: слева линия папы, справа линия мамы">${out.join('')}<g class="base" aria-hidden="true"><line x1="0" x2="1000" y1="${CY + .5}" y2="${CY + .5}" stroke="var(--line2)" stroke-width="1"/>${base.join('')}</g></svg>`, n};
}
function labelHTML(id) {
  const p = P[id];
  const meta = [p.yr, p.rl].filter(Boolean).map(esc).join(' · ');
  return `<div class="pv">${portrait(id, 1, {eager: true, cls: ''}).replace('class="pt ', 'class="pt " style="position:absolute;inset:0" ')}</div>
    <div><div class="nm">${esc(p.name)}</div><div class="meta">${meta}</div><div class="meta">${stHTML(p.st)}</div></div>
    <a class="go" href="#/p/${id}">Открыть экспонат →</a>`;
}

/* ───────── страницы ───────── */
let cleanups = [];
const pages = {};

pages.home = () => {
  const fl = F.LAYOUT.father, ml = F.LAYOUT.mother;
  const me = F.ME.filter(has);
  const story = Object.keys(F.STORIES || {}).map(k => ({k, s: F.STORIES[k], pid: Object.keys(P).find(id => P[id].story === k)}));
  const albums = D.albums.map(a => ({...a, ph: albumPhotos(a.id)})).filter(a => a.ph.length);
  const firstPara = s => { for (const [, ps] of s.parts) if (ps[0]) return ps[0]; return ''; };
  const quoteOf = s => { const last = s.parts[s.parts.length - 1]; return last ? (last[1][0] || '') : ''; };
  app.innerHTML = `
  <section class="hall" aria-labelledby="h-hall">
    <div class="hall-head">
      <div><p class="eyebrow">Семейная экспозиция · главный зал</p><h1 id="h-hall">Наша семья</h1></div>
      <p class="lead">Две линии рода сходятся в центре веера. Слева — ${esc(fl.title.toLowerCase())}, справа — ${esc(ml.title.toLowerCase())}; каждое кольцо веера — поколение. Нажмите на имя, чтобы перейти к экспонату.</p>
    </div>
    <div class="fan-stage" id="fanStage"></div>
    <div class="fan-foot">
      <div class="line-t f">${esc(fl.title)}<b>${esc(fl.sub).replace(/ · /g, '\u00a0· ')}</b></div>
      <div class="center-t">${me.map(id => `<a href="#/p/${id}">${esc(nameParts(id).first)}</a>`).join('')}</div>
      <div class="line-t m">${esc(ml.title)}<b>${esc(ml.sub).replace(/ · /g, '\u00a0· ')}</b></div>
    </div>
    <div class="fan-label hint" id="fanLabel" aria-live="polite">${HOVER.matches ? 'Наведите на имя в веере — здесь появится этикетка' : 'Коснитесь имени в веере — здесь появится этикетка'}</div>
    <p class="rings-note">Кольца: I — родители, II — бабушки и дедушки, III — прадеды, IV — прапрадеды. Пустые сектора — предки, о которых пока ничего не известно.</p>
    <div class="legend">${legendHTML()}</div>
  </section>

  <section class="sec" id="wall" aria-labelledby="h-wall">
    <div class="sec-head"><div><p class="eyebrow">Зал второй</p><h2 class="h-sec" id="h-wall">Портретная стена</h2></div>
      <p class="lead">Все, кто есть в родословной, — по поколениям. Под каждым портретом — этикетка: имя, годы, кем приходится и насколько надёжны сведения.</p></div>
    ${WG.groups.map((ids, g) => ids && ids.length ? `<div class="gen"><div class="gen-h"><span class="no">${g ? 'Поколение ' + ROMAN[g] : 'Центр'}</span><h3>${g ? esc(GEN_TITLE[g] || '') : me.map(id => esc(nameParts(id).first)).join(' и ')}</h3><span class="cnt">${ids.length}</span></div>
      <div class="wall">${ids.map(wallCard).join('')}</div></div>` : '').join('')}
    ${WG.rest.length ? `<div class="gen"><div class="gen-h"><span class="no">&nbsp;</span><h3>Другие</h3></div><div class="wall">${WG.rest.map(wallCard).join('')}</div></div>` : ''}
  </section>

  ${story.map(({k, s, pid}) => `<section class="sec" aria-label="Статья">
    <div class="sec-head"><div><p class="eyebrow">Зал третий</p><h2 class="h-sec">Статья</h2></div><p class="lead">Полный текст — без сокращений, как он напечатан.</p></div>
    <a class="feature" href="#/story/${k}">
      ${pid ? `<div class="mat">${portrait(pid, 0.8, {big: true})}</div>` : '<div></div>'}
      <div><p class="eyebrow">${pid ? esc(P[pid].name) : ''}</p><h3>${esc(storyTitle(s))}</h3><p class="sub">${esc(s.sub || '')}</p>
      ${quoteOf(s) ? `<blockquote>${esc(clip(quoteOf(s), 260))}</blockquote>` : ''}
      <span class="more">Читать статью <span aria-hidden="true">→</span></span></div>
    </a></section>`).join('')}

  <section class="sec" id="archive" aria-labelledby="h-arch">
    <div class="sec-head"><div><p class="eyebrow">Зал четвёртый</p><h2 class="h-sec" id="h-arch">Хранилище</h2></div>
      <p class="lead">Фотоархив семьи: ${nPhoto(albums.reduce((s, a) => s + a.ph.length, 0))} в ${albums.length} ${plural(albums.length, 'альбоме', 'альбомах', 'альбомах')}. Каждую можно открыть на весь экран.</p></div>
    ${albumsGrid(albums)}
  </section>`;
  // веер
  const stage = $('#fanStage');
  const drawFan = () => {
    const {svg} = fanSVG();
    stage.innerHTML = svg;
    const s = $('svg', stage);
    if (!RM.matches && !drawFan.done) s.classList.add('anim');
    drawFan.done = true;
    wireFan(s);
  };
  const fontsP = Promise.all(['500 16px "Golos"', '400 16px "Golos"', '400 16px "Spectral"'].map(f => document.fonts.load(f, 'АаБб').catch(() => 0)));
  Promise.race([fontsP, new Promise(r => setTimeout(r, 1500))]).then(drawFan);
};
function clip(s, n) { if (s.length <= n) return s; const c = s.slice(0, n); return c.slice(0, c.lastIndexOf(' ')) + '…'; }
const storyTitle = s => (s.title || '').replace(/\s*—\s*читать целиком\s*$/i, '');
function wallCard(id) {
  const p = P[id];
  return `<a class="wall-card" href="#/p/${id}" data-line="${lineOf[id] || ''}">
    ${portrait(id, 0.8)}
    <div class="lbl"><p class="nm">${esc(p.name)}</p>${p.yr ? `<div class="yr">${esc(p.yr)}</div>` : ''}${p.rl ? `<div class="rl">${esc(p.rl)}</div>` : ''}${stHTML(p.st)}</div></a>`;
}
function albumsGrid(albums) {
  return `<div class="albums">${albums.map(a => `<a class="alb-card" href="#/archive/${a.id}">
    <div class="cv"><img src="${T(a.ph[0])}" alt="" loading="lazy" decoding="async"></div>
    <h3 class="t">${esc(a.title)}</h3><div class="k"><b>${esc(albumEyebrow(a.id))}</b> · ${nPhoto(a.ph.length)}</div></a>`).join('')}</div>`;
}
function wireFan(svg) {
  const label = $('#fanLabel');
  let sel = null;
  const show = id => { label.classList.remove('hint'); label.innerHTML = labelHTML(id); };
  svg.querySelectorAll('a.sector').forEach(a => {
    const id = a.dataset.id;
    a.addEventListener('mouseenter', () => { if (HOVER.matches) show(id); });
    a.addEventListener('focus', () => show(id));
    a.addEventListener('click', e => {
      if (!HOVER.matches && sel !== id) {
        e.preventDefault();
        svg.querySelectorAll('a.sel').forEach(x => x.classList.remove('sel'));
        a.classList.add('sel'); sel = id; show(id);
      }
    });
  });
}

/* экспонат */
const YEAR_RE = /(^|\D)(1[6-9]\d\d|20\d\d)(?!\d)/;
pages.person = id => {
  const p = P[id];
  if (!p) return pages.notfound();
  const line = lineOf[id] || '';
  const lineT = line === 'f' ? F.LAYOUT.father.title : line === 'm' ? F.LAYOUT.mother.title : 'Центр экспозиции';
  const facts = (p.facts || []).map((t, i) => { const m = t.match(YEAR_RE); return {t, i, y: m ? +m[2] : null}; });
  const dated = facts.filter(f => f.y != null).sort((a, b) => a.y - b.y || a.i - b.i);
  const plain = facts.filter(f => f.y == null);
  const yLabel = f => { const m = f.t.match(/(1[6-9]\d\d|20\d\d)\s*[–-]\s*(1[6-9]\d\d|20\d\d)/); return m && f.t.indexOf(m[0]) < 12 ? `${m[1]}–<br>${m[2]}` : f.y; };
  let factsHTML = '';
  if (dated.length >= 2) {
    factsHTML = `<section class="blk"><h2>Хронология</h2><ol class="tl">${dated.map(f => `<li><span class="y">${yLabel(f)}</span><p>${esc(f.t)}</p></li>`).join('')}</ol></section>`;
    if (plain.length) factsHTML += `<section class="blk"><h2>Также известно</h2><ul class="facts">${plain.map(f => `<li><p>${esc(f.t)}</p></li>`).join('')}</ul></section>`;
  } else if (facts.length) {
    factsHTML = `<section class="blk"><h2>Что известно</h2><ul class="facts">${facts.map(f => `<li><p>${esc(f.t)}</p></li>`).join('')}</ul></section>`;
  }
  const s = p.story && F.STORIES[p.story];
  const items = personItems(id);
  // соседи по семье
  const groups = [];
  const par = parentsOf[id] || [];
  if (par.length) groups.push(['Родители', par]);
  const spouses = new Map();
  (childrenOf[id] || []).forEach(c => (parentsOf[c.id] || []).forEach(x => { if (x.id !== id) spouses.set(x.id, {id: x.id}); }));
  for (const side of ['father', 'mother']) F.LAYOUT[side].gens.forEach(row => row.forEach(g => {
    const i = g.ids.indexOf(id); if (i < 0) return;
    [[i - 1, (g.joins || [])[i - 1]], [i + 1, (g.joins || [])[i]]].forEach(([j, jn]) => { const o = g.ids[j]; if (o && has(o)) spouses.set(o, {id: o, note: jn}); });
  }));
  if (spouses.size) groups.push(['Супруги', [...spouses.values()]]);
  const ch = childrenOf[id] || [];
  if (ch.length) groups.push(['Дети', ch]);
  const sib = new Map();
  par.forEach(x => (childrenOf[x.id] || []).forEach(c => { if (c.id !== id) sib.set(c.id, {id: c.id}); }));
  const fs = F.SIBLINGS.father || [], sk = F.SIBLINGS.sukhov || [];
  if (id === 'evgeny' || fs.includes(id)) ['evgeny', ...fs].forEach(x => { if (x !== id && has(x)) sib.set(x, {id: x}); });
  if (sib.size) groups.push(['Братья и сёстры', [...sib.values()]]);
  if (id === 'klavdia' || sk.includes(id)) {
    const t = ['klavdia', ...sk].filter(x => x !== id && has(x) && !sib.has(x));
    if (t.length) groups.push(['Тернопольская родня', t.map(x => ({id: x}))]);
  }
  const kinHTML = groups.map(([h, list]) => `<div class="kin-g"><h3>${h}</h3>${list.map(x => `<a href="#/p/${x.id}">${portrait(x.id, 0.8)}<span><b>${esc(P[x.id].name)}</b><small>${esc([P[x.id].rl, P[x.id].yr].filter(Boolean).join(' · '))}${x.note ? ' · ' + esc(x.note) : ''}${x.hyp ? ' · связь предположительная' : ''}</small></span></a>`).join('')}</div>`).join('');
  const oi = ORDER.indexOf(id), prev = ORDER[oi - 1], next = ORDER[oi + 1];
  document.title = p.name + ' — Наша семья';
  app.innerHTML = `
  <nav class="crumbs" aria-label="Путь"><a href="#/">Главный зал</a><span aria-hidden="true">/</span><a href="#/wall">Портретная стена</a><span aria-hidden="true">/</span><span>${esc(p.name)}</span></nav>
  <article class="exhibit" data-line="${line}">
    <div class="ex-side"><figure class="mat" style="margin:0">${portrait(id, 0.8, {big: true, eager: true})}</figure>
      ${p.av ? '' : '<p class="cap">Портрета в архиве нет.</p>'}</div>
    <div class="ex-body">
      <p class="eyebrow"><i aria-hidden="true"></i>${esc(p.rl || (F.ME.includes(id) ? 'Центр экспозиции' : ''))}${p.rl || F.ME.includes(id) ? ' · ' : ''}${esc(lineT)}</p>
      <h1 tabindex="-1">${esc(p.name)}</h1>
      ${p.yr ? `<p class="ex-yr">${esc(p.yr)}</p>` : ''}
      <div class="ex-st">${stHTML(p.st)}<span class="why">${esc(ST_WHY[p.st] || '')}</span></div>
      ${factsHTML}
      ${p.src ? `<section class="blk"><h2>Источник</h2><p class="src">${esc(p.src)}</p></section>` : ''}
      ${s ? `<section class="blk"><h2>Статья</h2><a class="story-card" href="#/story/${p.story}"><h3>${esc(storyTitle(s))}</h3><p>${esc(s.sub || '')}</p><span class="more">Читать целиком <span aria-hidden="true">→</span></span></a></section>` : ''}
    </div>
  </article>
  ${items.length ? `<section class="sec album-sec" aria-labelledby="h-alb"><div class="sec-head"><div><p class="eyebrow">Фотоальбом</p><h2 class="h-sec" id="h-alb">${items.length > 1 ? 'Фотографии' : 'Фотография'}</h2></div><p class="lead">${nPhoto(items.length)}. Нажмите, чтобы посмотреть на весь экран.</p></div><div class="jgrid" id="pg"></div></section>` : ''}
  ${groups.length ? `<section class="sec" aria-labelledby="h-kin"><div class="sec-head"><div><p class="eyebrow">Связи</p><h2 class="h-sec" id="h-kin">Семья</h2></div><p class="lead">Переходите от человека к человеку — так можно пройти по всему дереву.</p></div><div class="kin">${kinHTML}</div></section>` : ''}
  <nav class="pn" aria-label="Соседние экспонаты">${prev ? `<a href="#/p/${prev}"><span>← Предыдущий экспонат</span><b>${esc(P[prev].name)}</b></a>` : ''}${next ? `<a class="nx" href="#/p/${next}"><span>Следующий экспонат →</span><b>${esc(P[next].name)}</b></a>` : ''}</nav>`;
  if (items.length) justify($('#pg'), items, {h: innerWidth < 560 ? 120 : 200});
};

/* статья */
pages.story = key => {
  const s = F.STORIES[key]; if (!s) return pages.notfound();
  const pid = Object.keys(P).find(id => P[id].story === key);
  document.title = storyTitle(s) + ' — Наша семья';
  app.innerHTML = `
  <nav class="crumbs" aria-label="Путь"><a href="#/">Главный зал</a><span aria-hidden="true">/</span>${pid ? `<a href="#/p/${pid}">${esc(P[pid].name)}</a><span aria-hidden="true">/</span>` : ''}<span>Статья</span></nav>
  <div class="story">
    <aside>${pid ? `<div class="mat">${portrait(pid, 0.8, {big: true, eager: true})}</div><a class="who" href="#/p/${pid}">${esc(P[pid].name)}</a><div class="yr">${esc(P[pid].yr || '')}</div>` : ''}
      <ol class="toc">${s.parts.map((pt, i) => `<li><button type="button" data-p="${i}">${esc(pt[0])}</button></li>`).join('')}</ol></aside>
    <article><p class="eyebrow">Статья</p><h1 tabindex="-1">${esc(storyTitle(s))}</h1><p class="sub">${esc(s.sub || '')}</p>
      ${s.parts.map(([h, ps], i) => `<h2 id="part${i}">${esc(h)}</h2>${ps.map(t => `<p>${esc(t)}</p>`).join('')}`).join('')}
      ${pid ? `<nav class="pn" aria-label="Дальше"><a href="#/p/${pid}"><span>← К экспонату</span><b>${esc(P[pid].name)}</b></a></nav>` : ''}
    </article>
  </div>`;
  app.querySelectorAll('.toc button').forEach(b => b.addEventListener('click', () => $('#part' + b.dataset.p).scrollIntoView({behavior: RM.matches ? 'auto' : 'smooth'})));
};

/* хранилище */
pages.archive = () => {
  const albums = D.albums.map(a => ({...a, ph: albumPhotos(a.id)})).filter(a => a.ph.length);
  document.title = 'Хранилище — Наша семья';
  app.innerHTML = `<header class="page-head"><div><p class="eyebrow">Зал четвёртый</p><h1 tabindex="-1">Хранилище</h1></div><span class="k">${nPhoto(albums.reduce((s, a) => s + a.ph.length, 0))} · ${albums.length} ${plural(albums.length, 'альбом', 'альбома', 'альбомов')}</span></header>${albumsGrid(albums)}`;
};
pages.album = aid => {
  const a = D.albums.find(x => x.id === aid); if (!a) return pages.notfound();
  const ids = albumPhotos(aid), items = ids.map(photoItem);
  const list = D.albums.filter(x => albumPhotos(x.id).length), i = list.findIndex(x => x.id === aid);
  const prev = list[i - 1], next = list[i + 1];
  document.title = a.title + ' — Наша семья';
  app.innerHTML = `<nav class="crumbs" aria-label="Путь"><a href="#/">Главный зал</a><span aria-hidden="true">/</span><a href="#/archive">Хранилище</a><span aria-hidden="true">/</span><span>${esc(a.title)}</span></nav>
  <header class="page-head"><div><p class="eyebrow">${esc(albumEyebrow(aid))}</p><h1 tabindex="-1">${esc(a.title)}</h1></div><span class="k">${nPhoto(items.length)}</span></header>
  <div class="jgrid" id="ag"></div>
  <nav class="pn" aria-label="Соседние альбомы">${prev ? `<a href="#/archive/${prev.id}"><span>← Предыдущий альбом</span><b>${esc(prev.title)}</b></a>` : ''}${next ? `<a class="nx" href="#/archive/${next.id}"><span>Следующий альбом →</span><b>${esc(next.title)}</b></a>` : ''}</nav>`;
  justify($('#ag'), items);
};
pages.notfound = () => { app.innerHTML = `<header class="page-head"><div><p class="eyebrow">Нет такого зала</p><h1 tabindex="-1">Страница не найдена</h1></div></header><p><a class="more" href="#/">В главный зал →</a></p>`; };

/* ───────── маршрутизация ───────── */
history.scrollRestoration = 'manual';
const scrolls = new Map();
let curKey = null, byClick = false, booted = false;
document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (a && !e.defaultPrevented) byClick = true; }, true);
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  if (h === curKey) return;
  if (LB.isOpen()) LB.close(true);
  if (curKey !== null) scrolls.set(curKey, scrollY);
  const prevKey = curKey; curKey = h;
  cleanups.forEach(f => f()); cleanups = [];
  const [a, b] = h.split('/');
  let navKey = 'home';
  document.title = 'Наша семья';
  const homeKey = !a || a === 'wall';
  const sameHome = homeKey && prevKey !== null && (prevKey === '' || prevKey === 'wall') && app.querySelector('#fanStage');
  if (!sameHome) {
    if (homeKey) pages.home();
    else if (a === 'p') { pages.person(decodeURIComponent(b || '')); navKey = 'wall'; }
    else if (a === 'story') { pages.story(b); navKey = ''; }
    else if (a === 'archive') { b ? pages.album(b) : pages.archive(); navKey = 'archive'; }
    else pages.notfound();
    if (booted && !RM.matches) { app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter'); }
  }
  if (a === 'wall') navKey = 'wall';
  document.querySelectorAll('.nav a').forEach(x => { if (x.dataset.r === navKey) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
  // прокрутка
  const saved = scrolls.get(h);
  requestAnimationFrame(() => {
    if (a === 'wall' && (byClick || saved == null)) { const w = $('#wall'); if (w) window.scrollTo(0, w.getBoundingClientRect().top + scrollY - 70); }
    else if (!byClick && saved != null) window.scrollTo(0, saved);
    else if (!sameHome || !homeKey) window.scrollTo(0, 0);
    else window.scrollTo(0, 0);
    if (booted && !homeKey) { const h1 = app.querySelector('h1[tabindex]'); if (h1) h1.focus({preventScroll: true}); }
    byClick = false; booted = true;
  });
}
addEventListener('hashchange', route);

/* ───────── тема ───────── */
const themeBtn = $('#theme');
function setTheme(t, save) {
  document.documentElement.dataset.theme = t;
  $('#themeColor').content = t === 'dark' ? '#1C1B19' : '#EDE9E2';
  themeBtn.setAttribute('aria-label', t === 'dark' ? 'Светлая тема' : 'Тёмная тема');
  if (save) try { localStorage.setItem('v3theme', t); } catch (e) {}
}
setTheme(document.documentElement.dataset.theme || 'light');
themeBtn.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => { let s = null; try { s = localStorage.getItem('v3theme'); } catch (_) {} if (!s) setTheme(e.matches ? 'dark' : 'light'); });

/* ───────── просмотр на весь экран ───────── */
const LB = (() => {
  const el = $('#lb'), img = $('#lbImg'), cap = $('#lbCap'), cnt = $('#lbCnt'), frame = $('#lbFrame'), stage = $('#lbStage');
  const facesB = $('#lbFaces'), facesBox = $('#lbFacesBox');
  let items = [], i = 0, open = false, opener = null, showFaces = false, capH = 0, pushed = false;
  const capHTML = it => {
    const who = it.who.length > 1 ? `<p class="w">На фото: ${it.who.map(id => `<a href="#/p/${id}">${esc(P[id].name)}</a>`).join(', ')}</p>` : '';
    const alb = it.a ? `<p class="a">${esc(albumTitle(it.a))}</p>` : '';
    return `<p class="c">${esc(it.cap || (it.who.length === 1 ? P[it.who[0]].name : ''))}</p>${who}${alb}`;
  };
  function measure() {
    const m = document.createElement('div');
    m.className = 'in'; m.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;width:${cap.clientWidth || cap.parentNode.clientWidth}px`;
    cap.parentNode.appendChild(m);
    let mx = 0;
    for (const it of items) { m.innerHTML = capHTML(it); mx = Math.max(mx, m.offsetHeight); }
    m.remove(); capH = mx; cap.style.minHeight = mx + 'px';
  }
  function placeFaces() {
    const it = items[i];
    facesBox.hidden = !(showFaces && it.faces.length);
    if (facesBox.hidden) return;
    const fr = frame.getBoundingClientRect(), ir = img.getBoundingClientRect();
    facesBox.style.cssText = `left:${ir.left - fr.left}px;top:${ir.top - fr.top}px;width:${ir.width}px;height:${ir.height}px`;
    facesBox.innerHTML = it.faces.filter(f => has(f[4])).map(f => `<a href="#/p/${f[4]}" style="left:${f[0] * 100}%;top:${f[1] * 100}%;width:${f[2] * 100}%;height:${f[3] * 100}%" aria-label="${esc(P[f[4]].name)}"><span>${esc(nameParts(f[4]).first + (nameParts(f[4]).sur ? ' ' + nameParts(f[4]).sur : ''))}</span></a>`).join('');
  }
  function show(k) {
    i = (k + items.length) % items.length;
    const it = items[i];
    cnt.textContent = `${i + 1} / ${items.length}`;
    img.alt = it.cap || 'Фотография';
    img.src = it.th;
    const want = it.full, im = new Image();
    im.decoding = 'async';
    im.onload = () => { if (items[i] === it) { img.src = want; requestAnimationFrame(placeFaces); } };
    im.src = want;
    cap.innerHTML = capHTML(it);
    facesB.hidden = !it.faces.some(f => has(f[4]));
    facesB.setAttribute('aria-pressed', showFaces);
    facesBox.hidden = true;
    img.onload = () => placeFaces();
    [1, -1].forEach(d => { const n = items[(i + d + items.length) % items.length]; if (n) { const p = new Image(); p.src = n.full; } });
    $('#lbPrev').hidden = $('#lbNext').hidden = items.length < 2;
  }
  function openLB(list, k, from) {
    items = list; opener = from; open = true; showFaces = false;
    el.hidden = false; document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => el.classList.add('on'));
    measure(); show(k);
    history.pushState({lb: 1}, '', location.href); pushed = true;
    $('#lbX').focus({focusVisible: false});
  }
  function close(fromNav) {
    if (!open) return;
    open = false; el.classList.remove('on'); el.hidden = true;
    document.documentElement.style.overflow = '';
    img.removeAttribute('src');
    if (pushed && !fromNav) { pushed = false; history.back(); }
    pushed = false;
    if (opener && document.contains(opener)) opener.focus({preventScroll: true});
  }
  addEventListener('popstate', () => { if (open) { pushed = false; close(true); } });
  $('#lbX').addEventListener('click', () => close());
  $('#lbPrev').addEventListener('click', () => show(i - 1));
  $('#lbNext').addEventListener('click', () => show(i + 1));
  facesB.addEventListener('click', () => { showFaces = !showFaces; facesB.setAttribute('aria-pressed', showFaces); placeFaces(); });
  cap.addEventListener('click', e => { if (e.target.closest('a')) { pushed = false; open = false; el.classList.remove('on'); el.hidden = true; document.documentElement.style.overflow = ''; history.replaceState(null, '', location.href); } });
  facesBox.addEventListener('click', e => { if (e.target.closest('a')) { pushed = false; open = false; el.classList.remove('on'); el.hidden = true; document.documentElement.style.overflow = ''; } });
  addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'Tab') {
      const f = [...el.querySelectorAll('button:not([hidden]),a[href]')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  addEventListener('resize', () => { if (open) { measure(); placeFaces(); } });
  // свайп
  let sx = 0, sy = 0, dx = 0, drag = false, pid = null;
  stage.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || items.length < 2) return; drag = true; pid = e.pointerId; sx = e.clientX; sy = e.clientY; dx = 0; frame.style.transition = 'none'; });
  stage.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== pid) return;
    dx = e.clientX - sx; const dy = e.clientY - sy;
    if (Math.abs(dy) > Math.abs(dx) * 1.2 && Math.abs(dx) < 12) return;
    frame.style.transform = `translateX(${dx}px)`;
  });
  const end = () => {
    if (!drag) return; drag = false;
    frame.style.transition = RM.matches ? 'none' : 'transform .28s cubic-bezier(.22,.7,.2,1)';
    if (Math.abs(dx) > 50) {
      const dir = dx < 0 ? 1 : -1;
      frame.style.transform = `translateX(${-dir * 40}px)`;
      show(i + dir);
      requestAnimationFrame(() => { frame.style.transform = 'translateX(0)'; });
    } else frame.style.transform = 'translateX(0)';
  };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  return {open: openLB, close, isOpen: () => open};
})();

route();
})();
