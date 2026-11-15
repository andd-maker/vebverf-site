// «Две реки» — вариант 2. Данные: ../data.js (DATA) и ../people.js (FAM), здесь только отображение.
(() => {
"use strict";
const D = window.DATA, F = window.FAM;
const { P, ST, STORIES = {}, LAYOUT, EDGES, ME = [], SIBLINGS = {} } = F;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const T = k => `../img/t/${k}.jpg`, FULL = k => `../img/f/${k}.jpg`, AVP = k => "../" + D.avatars[k];
const mqMobile = matchMedia("(max-width:760px)");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const has = id => !!P[id];
const ICON = {
  book: '<svg viewBox="0 0 24 24"><path d="M12 6.5C10 5 7 4.6 3.5 5v13.5c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5zM12 6.5V20"/></svg>',
  photo: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="14" rx="2"/><path d="M3.5 16l4.5-4.5 4 4 2.5-2.5 6 5"/><circle cx="15.5" cy="9.5" r="1.3"/></svg>',
  tree: '<svg viewBox="0 0 24 24"><circle cx="6" cy="4.5" r="2"/><circle cx="18" cy="4.5" r="2"/><circle cx="12" cy="19.5" r="2.4"/><path d="M6 6.5c0 6 6 5.5 6 10.6M18 6.5c0 6-6 5.5-6 10.6"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  card: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.4"/><path d="M5.5 19.5c.9-3.4 3.4-5.2 6.5-5.2s5.6 1.8 6.5 5.2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

// ── имена и годы ──
const short = n => { const w = n.replace(/\s*\(.*?\)/, "").split(" "); return n.includes(" и ") || w.length < 2 ? n : w[0] + " " + w[w.length - 1]; };
const initials = n => n.split(/\s+/).filter(w => /^[А-ЯЁA-Z]/.test(w)).slice(0, 2).map(w => w[0]).join("");
function years(yr) {               // для дерева: только годы из p.yr, без мест и дат
  if (!yr) return "";
  const parts = yr.split("—").map(s => { const m = s.match(/(ок\.\s*)?\d{4}/); return m ? m[0].replace(/\s+/, " ") : ""; });
  if (!parts.some(Boolean)) return "";
  return parts.length > 1 ? parts.map(x => x || "?").join(" — ") : parts[0];
}

// ── портрет: аватар или лицо, вырезанное из общего снимка по рамке faces ──
function portrait(id, cls = "") {
  const p = P[id] || {}, k = p.av;
  let inner;
  if (k && D.avatars[k]) inner = `<img src="${AVP(k)}" alt="" loading="lazy" decoding="async">`;
  else if (k && D.photos[k]) {
    const ph = D.photos[k], f = (ph.faces || []).find(f => f[4] === id) || (ph.faces?.length === 1 && (ph.who || []).length === 1 ? ph.faces[0] : null);
    inner = `<img src="${T(k)}" alt="" loading="lazy" decoding="async"${f ? ` data-face="${f.slice(0, 4).join(",")}" class="crop" style="opacity:0"` : ""}>`;
  } else inner = `<span class="mono">${esc(initials(p.name || "?"))}</span>`;
  return `<span class="pt ${cls}">${inner}</span>`;
}
function cropFace(img) {
  const [x, y, w, h] = img.dataset.face.split(",").map(Number), W = img.naturalWidth, H = img.naturalHeight;
  if (!W) return;
  let s = 0.6 / Math.max(w * W, h * H);
  s = Math.max(s, 1 / W, 1 / H);
  const wd = W * s, hd = H * s;
  let l = 0.5 - (x + w / 2) * wd, t = 0.47 - (y + h / 2) * hd;
  l = Math.min(0, Math.max(1 - wd, l)); t = Math.min(0, Math.max(1 - hd, t));
  Object.assign(img.style, { width: wd * 100 + "%", height: hd * 100 + "%", left: l * 100 + "%", top: t * 100 + "%", opacity: 1 });
}
document.addEventListener("load", e => { const t = e.target; if (t.tagName === "IMG" && t.dataset.face) cropFace(t); }, true);
const ringed = (id, cls = "") => `<span class="ring s-${P[id]?.st || "fam"}">${portrait(id, cls)}</span>`;

// ── фото и альбомы ──
const albumTitle = Object.fromEntries(D.albums.map(a => [a.id, a.title]));
function item(k) {
  const ph = D.photos[k], ext = ph.v ? String(ph.v) : "";
  return { k, th: T(k), src: ext ? `../img/v/${k}.${ext}` : FULL(k), cap: ph.cap || "", who: (ph.who || []).filter(has), faces: (ph.faces || []).filter(f => has(f[4])), a: ph.a, v: ext };
}
const albumCache = {};
function personAlbum(id) {          // портрет первым, затем все снимки, где человек отмечен (включая скрытые из общей галереи)
  if (albumCache[id]) return albumCache[id];
  const p = P[id], list = [];
  if (p.av && D.avatars[p.av]) list.push({ k: "av:" + p.av, th: AVP(p.av), src: AVP(p.av), cap: p.name, who: [id], faces: [], a: null, portrait: 1 });
  else if (p.av && D.photos[p.av]) list.push(item(p.av));
  for (const k of D.order) if (k !== p.av && D.photos[k]?.who?.includes(id)) list.push(item(k));
  return albumCache[id] = list;
}
const albumList = a => D.order.filter(k => D.photos[k] && D.photos[k].a === a && !D.photos[k].hide).map(item);

// ═════════════════════ ДЕРЕВО ═════════════════════
const MED = 71, LB = 141, TOP = 170, CW = 132, GAP = 96, PAD = 60;
let RH = 200;
const nodes = {};          // id -> {id, x, y, g, line, kind:'p'|'g', members?}
const parents = {}, children = {}, hypEdge = new Set();
for (const [c, p, h] of EDGES) {
  if (!has(c) || !has(p)) continue;
  (parents[c] ||= []).push(p); (children[p] ||= []).push(c);
  if (h) hypEdge.add(c + "|" + p);
}
const GROUP_ANCHOR = { father: "evgeny", sukhov: "klavdia" };
const groups = {};
for (const [key, ids] of Object.entries(SIBLINGS)) {
  const members = (ids || []).filter(has), anchor = GROUP_ANCHOR[key];
  if (!members.length || !anchor || !has(anchor)) continue;
  groups["g:" + key] = { key: "g:" + key, members, anchor };
}
const groupOf = {};
for (const g of Object.values(groups)) for (const m of g.members) groupOf[m] ||= g.key;
function groupLabel(g) {
  const roles = g.members.map(m => P[m].rl || "");
  if (g.anchor === "evgeny") return "Братья и сёстры папы";
  if (roles.some(r => /тёт|дяд/i.test(r))) return "Тёти и дяди папы";
  return "Родня";
}
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return n + " " + (m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c); };

function layout() {
  const lines = {};
  for (const L of ["father", "mother"]) {
    const gens = (LAYOUT[L]?.gens || []).map((units, g) => units.map(u => ({
      items: u.ids.filter(has).map(id => ({ kind: "p", id })), joins: u.joins || [], g,
    })).filter(u => u.items.length));
    // группы братьев/сестёр — отдельным узлом рядом с тем, к кому относятся (снаружи дерева)
    for (const gr of Object.values(groups)) gens.forEach((units, g) => {
      const ui = units.findIndex(u => u.items.some(it => it.id === gr.anchor));
      if (ui < 0) return;
      const unit = { items: [{ kind: "g", id: gr.key }], joins: [], g, grp: 1 }, its = units[ui].items;
      // рядом с тем, к кому относится: у пары — со стороны этого человека, у одиночки — снаружи дерева
      const before = its.length > 1 ? its[0].id === gr.anchor : L === "father";
      units.splice(before ? ui : ui + 1, 0, unit);
    });
    const hw = it => it.kind === "g" ? 80 : 62;
    const span = u => (u.items.length - 1) * CW;
    const pos = {};
    const setUnit = (u, x) => { u.x = x; u.items.forEach((it, i) => pos[it.id] = x + i * CW); };
    gens.forEach(units => {           // начальная раскладка — по центру
      let x = 0; units.forEach((u, i) => { if (i) x += hw(units[i - 1].items.at(-1)) + hw(u.items[0]) + 26; setUnit(u, x); x += span(u); });
      const sh = -x / 2; units.forEach(u => setUnit(u, u.x + sh));
    });
    const rel = (id, dir) => {        // соседи в соседнем поколении: dir=+1 дети, -1 родители
      if (id.startsWith("g:")) return dir < 0 ? (parents[groups[id].anchor] || []) : [];
      const r = (dir > 0 ? children[id] : parents[id]) || [];
      const extra = dir > 0 ? Object.values(groups).filter(g => (parents[g.anchor] || []).includes(id)).map(g => g.key) : [];
      return r.concat(extra).filter(o => o in pos);
    };
    const resolve = (units, want) => {
      if (!units.length) return;
      const xs = []; units.forEach((u, i) => {
        let x = want[i];
        if (i) x = Math.max(x, xs[i - 1] + span(units[i - 1]) + hw(units[i - 1].items.at(-1)) + hw(u.items[0]) + 26);
        xs.push(x);
      });
      const sh = want.reduce((a, w, i) => a + w - xs[i], 0) / units.length;
      units.forEach((u, i) => setUnit(u, xs[i] + sh));
    };
    for (let it = 0; it < 8; it++) {
      const pass = (g, dir) => {
        const units = gens[g]; if (!units?.length) return;
        resolve(units, units.map(u => {
          const ts = []; u.items.forEach((itm, i) => rel(itm.id, dir).forEach(o => ts.push(pos[o] - i * CW)));
          return ts.length ? ts.reduce((a, b) => a + b) / ts.length : u.x;
        }));
      };
      for (let g = gens.length - 2; g >= 0; g--) pass(g, +1);
      for (let g = 1; g < gens.length; g++) pass(g, -1);
    }
    let min = Infinity, max = -Infinity;
    gens.forEach(units => units.forEach(u => u.items.forEach(itm => { min = Math.min(min, pos[itm.id] - hw(itm)); max = Math.max(max, pos[itm.id] + hw(itm)); })));
    lines[L] = { gens, pos, min, max };
  }
  const f = lines.father, m = lines.mother;
  const fs = -GAP / 2 - f.max, ms = GAP / 2 - m.min;
  const units = [];
  for (const [L, sh, ln] of [["father", fs, f], ["mother", ms, m]]) ln.gens.forEach((us, g) => us.forEach(u => {
    u.line = L; units.push(u);
    u.items.forEach(itm => {
      nodes[itm.id] = { id: itm.id, kind: itm.kind, x: ln.pos[itm.id] + sh, y: TOP + g * RH, g, line: L };
    });
  }));
  // Виктория и Денис — внизу, между папой и мамой
  const [pa, ma] = [nodes.evgeny, nodes.irina];
  const mid = pa && ma ? (pa.x + ma.x) / 2 : 0;
  const me = ME.filter(has);
  me.forEach((id, i) => nodes[id] = { id, kind: "p", x: mid + (i - (me.length - 1) / 2) * (CW + 18), y: TOP + 4 * RH - 10, g: 4, line: "me" });
  // нормализация
  let minX = Infinity, maxX = -Infinity, maxY = 0;
  for (const n of Object.values(nodes)) { minX = Math.min(minX, n.x - 80); maxX = Math.max(maxX, n.x + 80); maxY = Math.max(maxY, n.y + LB); }
  const fx = f.min + fs, mx = m.max + ms;
  minX = Math.min(minX, fx); maxX = Math.max(maxX, mx);
  if (!mqMobile.matches) minX -= 150;
  const dx = PAD - minX;
  for (const n of Object.values(nodes)) n.x += dx;
  return { units, gl: !mqMobile.matches ? PAD : null, W: maxX - minX + 2 * PAD, H: maxY + PAD, conf: { x: mid + dx, y: TOP + 4 * RH - 46 }, titles: { f: fx + dx, m: mx + dx } };
}

const spouses = {};
for (const L of ["father", "mother"]) for (const units of LAYOUT[L]?.gens || []) for (const u of units) u.ids.forEach((id, i) => { if (i && has(id) && has(u.ids[i - 1])) { (spouses[id] ||= []).push(u.ids[i - 1]); (spouses[u.ids[i - 1]] ||= []).push(id); } });
const A = new Set(["denis"]);     // прямые предки Дениса
(function up(id) { (parents[id] || []).forEach(p => { if (!A.has(p)) { A.add(p); up(p); } }); })("denis");

const world = $("#world"), tv = $("#tv");
let L0, edgeEls = [], knotEls = [];
function buildTree() {
  RH = mqMobile.matches ? 270 : 200;
  for (const k in nodes) delete nodes[k];
  L0 = layout();
  const { W, H, conf, titles, units } = L0;
  world.style.width = W + "px"; world.style.height = H + "px";
  const svg = [], html = [];
  const delayG = g => 0.25 + g * 0.55;
  const lnc = n => n.line === "father" ? "ln-f" : n.line === "mother" ? "ln-m" : "ln-me";
  const top = n => n.y - 3, bottom = n => n.y + LB;
  const ctr = n => n.y + MED / 2;
  const curve = (x1, y1, x2, y2) => { const ym = (y1 + y2) / 2; return `M${x1.toFixed(1)} ${y1.toFixed(1)}C${x1.toFixed(1)} ${ym.toFixed(1)} ${x2.toFixed(1)} ${ym.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
  let ei = 0;
  const edge = (d, keys, cls, w, gDelay, extra = "") => {
    const hyp = keys.some(k => hypEdge.has(k));
    svg.push(`<path class="e ${cls}${hyp ? " hyp" : ""}" d="${d}" ${hyp ? "" : 'pathLength="1"'} data-k="${keys.join(" ")}" stroke-width="${w}" style="--w2:${Math.max(w + .8, 2.8)}px;--d:${gDelay}s;--du:${extra || ".95s"}" data-i="${ei++}"/>`);
  };
  // пары: линия между супругами, «узелок» и подпись брака
  const partnerOf = {};
  for (const u of units) {
    if (u.grp) continue;
    u.items.forEach((it, i) => {
      if (!i) return;
      const a = nodes[u.items[i - 1].id], b = nodes[it.id];
      partnerOf[a.id + "+" + b.id] = partnerOf[b.id + "+" + a.id] = { x: (a.x + b.x) / 2, y: ctr(a) };
      svg.push(`<line class="cpl ${lnc(a)}" data-k="${a.id}|${b.id} ${b.id}|${a.id}" x1="${a.x + MED / 2 + 4}" y1="${ctr(a)}" x2="${b.x - MED / 2 - 4}" y2="${ctr(a)}" style="--d:${delayG(a.g) + .2}s"/>`);
      if (u.joins[i - 1]) html.push(`<div class="jn ${lnc(a)}" style="left:${(a.x + b.x) / 2}px;top:${ctr(a) - 7}px;--d:${delayG(a.g) + .3}s">${esc(u.joins[i - 1])}</div>`);
    });
  }
  const knots = {};
  // рёбра «ребёнок ← родители»
  const childIds = Object.keys(nodes).filter(id => nodes[id].line !== "me");
  for (const c of childIds) {
    const n = nodes[c];
    const ps = c.startsWith("g:") ? (parents[groups[c].anchor] || []) : (parents[c] || []);
    const inTree = ps.filter(p => nodes[p]);
    if (!inTree.length) continue;
    const river = A.has(c) && inTree.every(p => A.has(p));
    const cls = (river ? (n.line === "father" ? "rf" : "rm") : "") + " " + lnc(n);
    const w = river ? +(1.5 + n.g * .55).toFixed(2) : 1.3;
    const keysFor = ps2 => c.startsWith("g:") ? groups[c].members.flatMap(m => ps2.map(p => m + "|" + p)).concat(ps2.map(p => c + "|" + p)) : ps2.map(p => c + "|" + p);
    const pk = inTree.length === 2 && partnerOf[inTree[0] + "+" + inTree[1]];
    const g0 = nodes[inTree[0]].g;
    if (pk) {
      const y1 = nodes[inTree[0]].y + LB;
      edge(`M${pk.x} ${pk.y + 6}L${pk.x} ${y1}` + curve(pk.x, y1, n.x, top(n)).slice(curve(pk.x, y1, n.x, top(n)).indexOf("C")), keysFor(inTree), cls, w, delayG(g0) + .25);
      const kk = inTree.slice().sort().join("+");
      if (!knots[kk]) { knots[kk] = 1; svg.push(`<circle class="knot ${lnc(n)}" cx="${pk.x}" cy="${pk.y}" r="4.2" data-k="${keysFor(inTree).join(" ")}" style="--d:${delayG(g0) + .2}s"/>`); }
    } else for (const p of inTree) {
      const pn = nodes[p];
      edge(curve(pn.x, bottom(pn), n.x, top(n)), keysFor([p]), cls, w, delayG(pn.g) + .25);
    }
  }
  // слияние двух рек
  const pa = nodes.evgeny, ma = nodes.irina;
  if (pa && ma) {
    const C = conf;
    edge(curve(pa.x, bottom(pa), C.x, C.y), ME.filter(has).map(m => m + "|evgeny"), "rf ln-f", 3.6, delayG(3) + .25, "1.1s");
    edge(curve(ma.x, bottom(ma), C.x, C.y), ME.filter(has).map(m => m + "|irina"), "rm ln-m", 3.6, delayG(3) + .25, "1.1s");
    for (const id of ME.filter(has)) {
      const n = nodes[id];
      edge(`M${C.x} ${C.y}C${C.x} ${C.y + 14} ${n.x} ${n.y - 22} ${n.x} ${n.y - 3}`, [id + "|evgeny", id + "|irina"], "conf ln-me " + (id === "denis" ? "rf" : ""), id === "denis" ? 3.6 : 2.4, delayG(3) + 1.25, ".55s");
    }
    svg.push(`<circle class="knot conf" cx="${C.x}" cy="${C.y}" r="5.5" data-k="${ME.filter(has).map(m => m + "|evgeny " + m + "|irina").join(" ")}" style="--d:${delayG(3) + 1.25}s"/>`);
  }
  // узлы
  for (const n of Object.values(nodes)) {
    const d = n.line === "me" ? delayG(4) + .1 : delayG(n.g);
    if (n.kind === "g") {
      const g = groups[n.id];
      html.push(`<button class="grp ${lnc(n)}" data-node="${n.id}" style="left:${n.x}px;top:${n.y + 4}px;--d:${d}s" aria-label="${esc(groupLabel(g))}: ${g.members.length}">
        <span class="stack">${g.members.slice(0, 3).map(m => portrait(m)).join("")}</span>
        <span class="gl">${esc(groupLabel(g))}<small>${plural(g.members.length, "человек", "человека", "человек")}</small></span></button>`);
      continue;
    }
    const p = P[n.id], yr = years(p.yr) || (p.rl || "");
    html.push(`<button class="nd ${lnc(n)} ${n.line === "me" ? "me" : ""} ${n.id}" data-node="${n.id}" style="left:${n.x}px;top:${n.y}px;--d:${d}s${n.id === "denis" ? ";--dg:" + (delayG(4) + .7) + "s" : ""}" aria-label="${esc(p.name)}${p.rl ? ", " + esc(p.rl) : ""}">
      ${ringed(n.id)}<span class="nm">${esc(short(p.name))}</span>${yr ? `<span class="yr">${esc(yr)}</span>` : ""}</button>`);
  }
  if (L0.gl != null) ["Прапрадеды", "Прадеды", "Бабушки и дедушки", "Родители", "Дети"].forEach((t, g) => html.push(`<div class="gl0" style="left:${L0.gl}px;top:${TOP + g * RH + (g === 4 ? -10 : 0) + MED / 2}px;--d:${delayG(g)}s">${t}</div>`));
  html.push(`<div class="ltitle f ln-f" style="left:${titles.f}px;top:34px;--d:0s"><b>${esc(LAYOUT.father?.title || "")}</b><span>${esc(LAYOUT.father?.sub || "")}</span></div>`);
  html.push(`<div class="ltitle m ln-m r" style="right:${L0.W - titles.m}px;top:34px;--d:.2s"><b>${esc(LAYOUT.mother?.title || "")}</b><span>${esc(LAYOUT.mother?.sub || "")}</span></div>`);
  world.innerHTML = `<svg class="edges" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${svg.join("")}</svg>` + html.join("");
  edgeEls = $$(".e", world); knotEls = $$(".knot", world);
  buildMini();
}

// ── камера: панорама пальцем, щипок, колесо, кнопки ──
const cam = { x: 0, y: 0, s: 1 };
let fitS = 1;
let mode = "both";
function vpSize() { return { w: tv.clientWidth, h: tv.clientHeight }; }
function insets() {
  const mob = mqMobile.matches, th = $(".thead"), tb = th.offsetTop + th.offsetHeight;
  const r = { t: mob ? tb + 6 : 30, b: mob ? 100 : 84, l: mob ? 8 : 24, r: mob ? 8 : 24 };
  if (!mob && sheetOpen()) r.r += $("#sheet").offsetWidth + 20;
  return r;
}
function apply(glide) {
  world.classList.toggle("glide", !!glide);
  world.style.transform = `translate(${cam.x.toFixed(1)}px,${cam.y.toFixed(1)}px) scale(${cam.s.toFixed(4)})`;
  world.classList.toggle("far", cam.s < 0.5);
  $("#v-tree").classList.toggle("zoomed", mode !== "both" || cam.s > fitS * 1.2 || sheetOpen());
  updMini();
}
function clampCam() {
  if (!L0) return;
  const { w, h } = vpSize(), s = cam.s, ins = insets();
  const aw = w - ins.l - ins.r, ah = h - ins.t - ins.b;
  const pad = mqMobile.matches ? 6 : 12;
  const treeW = L0.W * s, treeH = L0.H * s;
  if (treeW <= aw) cam.x = ins.l + (aw - treeW) / 2;
  else {
    const minX = ins.l + aw - treeW - pad, maxX = ins.l + pad;
    cam.x = Math.min(maxX, Math.max(minX, cam.x));
  }
  if (treeH <= ah) cam.y = ins.t + (ah - treeH) / 2;
  else {
    const minY = ins.t + ah - treeH - pad, maxY = ins.t + pad;
    cam.y = Math.min(maxY, Math.max(minY, cam.y));
  }
}
function bbox(ids) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const id of ids) { const n = nodes[id]; if (!n) continue; x0 = Math.min(x0, n.x - 70); x1 = Math.max(x1, n.x + 70); y0 = Math.min(y0, n.y - 10); y1 = Math.max(y1, n.y + LB); }
  return { x0, y0, x1, y1 };
}
function fit(m = mode, glide = true) {
  mode = m;
  $$(".seg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === m));
  world.classList.toggle("mode-father", m === "father"); world.classList.toggle("mode-mother", m === "mother");
  const ids = Object.keys(nodes).filter(id => m === "both" || nodes[id].line === m || nodes[id].line === "me");
  const b = m === "both" ? { x0: 0, y0: 20, x1: L0.W, y1: L0.H - PAD + 10 } : bbox(ids);
  if (m !== "both") b.y0 = Math.min(b.y0, TOP - 20);
  const { w, h } = vpSize(), ins = insets();
  const aw = w - ins.l - ins.r, ah = h - ins.t - ins.b;
  let s = Math.min(aw / (b.x1 - b.x0), ah / (b.y1 - b.y0), 1.1);
  const minS = m === "both" ? 0.15 : (mqMobile.matches ? 0.6 : 0.7);
  s = Math.max(s, minS);
  let cx = (b.x0 + b.x1) / 2;
  if ((b.x1 - b.x0) * s > aw) {        // не влезает — держим ствол линии ближе к центру
    const trunk = nodes[m === "father" ? "evgeny" : "irina"];
    if (trunk) cx = Math.min(b.x1 - aw / 2 / s, Math.max(b.x0 + aw / 2 / s, trunk.x));
  }
  let cy = (b.y0 + b.y1) / 2;
  if ((b.y1 - b.y0) * s > ah) {
    cy = mqMobile.matches && m === "both" ? b.y0 + ah / (2 * s) : b.y1 - ah / (2 * s);
  }
  if (m === "both") fitS = s;
  cam.s = s; cam.x = ins.l + aw / 2 - cx * s; cam.y = ins.t + ah / 2 - cy * s;
  clampCam();
  apply(glide);
}
function zoomAt(f, px, py, glide) {
  const s = Math.min(1.8, Math.max(0.15, cam.s * f)), k = s / cam.s;
  cam.x = px - (px - cam.x) * k; cam.y = py - (py - cam.y) * k; cam.s = s;
  clampCam(); apply(glide);
}
const ptrs = new Map();
let moved = false, pinch0 = null, last = null;
tv.addEventListener("pointerdown", e => {
  if (e.button > 0) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) { moved = false; last = { x: e.clientX, y: e.clientY }; }
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cam.s, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cx: cam.x, cy: cam.y }; moved = true; }
  finishIntro();
});
tv.addEventListener("pointermove", e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const r = tv.getBoundingClientRect();
  if (ptrs.size === 2 && pinch0) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const s = Math.min(1.8, Math.max(0.15, pinch0.s * d / pinch0.d)), k = s / pinch0.s;
    cam.s = s; cam.x = (mx - r.left) - (pinch0.mx - r.left - pinch0.cx) * k; cam.y = (my - r.top) - (pinch0.my - r.top - pinch0.cy) * k;
    clampCam(); apply(false); return;
  }
  if (ptrs.size === 1 && last) {
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    if (!moved) { moved = true; tv.setPointerCapture(e.pointerId); tv.classList.add("drag"); }
    cam.x += dx; cam.y += dy; last = { x: e.clientX, y: e.clientY };
    clampCam(); apply(false);
  }
});
const up = e => {
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch0 = null;
  if (ptrs.size === 1) { const [a] = ptrs.values(); last = { ...a }; }
  if (!ptrs.size) tv.classList.remove("drag");
};
tv.addEventListener("pointerup", up); tv.addEventListener("pointercancel", up);
tv.addEventListener("wheel", e => {
  e.preventDefault(); finishIntro();
  const r = tv.getBoundingClientRect();
  if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top, false);
  else { cam.x -= e.deltaX; cam.y -= e.deltaY; clampCam(); apply(false); }
}, { passive: false });
tv.addEventListener("click", e => {
  if (moved) { moved = false; return; }
  const b = e.target.closest("[data-node]");
  if (!b) { if (sheetOpen()) closeSheet(); return; }
  const id = b.dataset.node;
  id.startsWith("g:") ? openGroup(id) : openPerson(id);
});
$("#zin").onclick = () => { hideHint(); const { w, h } = vpSize(); zoomAt(1.3, w / 2, h / 2, true); };
$("#zout").onclick = () => { hideHint(); const { w, h } = vpSize(); zoomAt(1 / 1.3, w / 2, h / 2, true); };
$("#lg-btn").onclick = e => { e.stopPropagation(); const l = $(".legend"), on = !l.classList.contains("open"); l.classList.toggle("open", on); $("#lg-btn").setAttribute("aria-expanded", on); };
$("#zfit").onclick = () => fit("both");
$$(".seg button").forEach(b => b.onclick = () => { finishIntro(); hideHint(); fit(b.dataset.mode); });

// ── мини-вид ──
const mini = $("#mini");
function buildMini() {
  const { W, H } = L0;
  const e = edgeEls.map(p => `<path d="${p.getAttribute("d")}" fill="none" stroke="${p.classList.contains("rf") ? "var(--rf)" : p.classList.contains("rm") ? "var(--rm)" : "var(--edge)"}" stroke-width="6"/>`).join("");
  const c = Object.values(nodes).map(n => `<circle cx="${n.x}" cy="${n.y + MED / 2}" r="${n.kind === "g" ? 18 : 26}" fill="var(--ink3)"/>`).join("");
  mini.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${e}${c}<rect class="vp" rx="20"/></svg>`;
}
function updMini() {
  if (!L0) return;
  const { w, h } = vpSize(), big = L0.W * cam.s > w * 1.04 || L0.H * cam.s > h * 1.04;
  mini.hidden = !big || (mqMobile.matches && mode !== "both");   // на телефоне в «Папа/Мама» мини-вид не нужен — он закрывал бы дерево
  const r = mini.querySelector(".vp"); if (!r) return;
  const x = -cam.x / cam.s, y = -cam.y / cam.s;
  r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", w / cam.s); r.setAttribute("height", h / cam.s);
}
let miniDrag = false;
const miniGo = e => {
  const r = mini.getBoundingClientRect(), { W, H } = L0;
  const k = Math.min(r.width / W, r.height / H), ox = (r.width - W * k) / 2, oy = (r.height - H * k) / 2;
  const wx = (e.clientX - r.left - ox) / k, wy = (e.clientY - r.top - oy) / k, { w, h } = vpSize();
  cam.x = w / 2 - wx * cam.s; cam.y = h / 2 - wy * cam.s; clampCam(); apply(false);
};
mini.addEventListener("pointerdown", e => { e.stopPropagation(); miniDrag = true; mini.setPointerCapture(e.pointerId); miniGo(e); finishIntro(); });
mini.addEventListener("pointermove", e => miniDrag && miniGo(e));
mini.addEventListener("pointerup", () => miniDrag = false);
mini.addEventListener("click", e => e.stopPropagation());

// ── первое открытие: прорисовка ──
let introT = 0;
function playIntro() {
  if (reduced) return;
  world.classList.add("intro");
  introT = setTimeout(finishIntro, 4600);
}
function finishIntro() {
  if (!world.classList.contains("intro")) return;
  clearTimeout(introT); world.classList.remove("intro");
}

// ── путь до Дениса ──
function pathFor(id) {
  const start = nodes[id] ? id : groupOf[id];
  if (!start) return null;
  if (start === "denis") return { nodes: new Set(A), all: true };
  const par = x => x.startsWith("g:") ? (parents[groups[x].anchor] || []) : (parents[x] || []);
  let prev, hit = null;
  for (const withSp of [false, true]) {   // сначала по кровному родству, потом через супруга
    prev = { [start]: null }; const q = [start];
    while (q.length) { const x = q.shift(); if (A.has(x)) { hit = x; break; } for (const p of par(x).concat(withSp ? spouses[x] || [] : [])) if (!(p in prev) && nodes[p]) { prev[p] = x; q.push(p); } }
    if (hit) break;
  }
  if (!hit) return { nodes: new Set([start]), seq: [start] };
  const seq = []; for (let x = hit; x; x = prev[x]) seq.unshift(x);
  seq.reverse();                      // start … hit
  let x = hit;
  while (x !== "denis") { const c = (children[x] || []).find(c => A.has(c)); if (!c) break; seq.push(c); x = c; }
  return { nodes: new Set(seq), seq };
}
function highlight(id) {
  clearHighlight();
  const pth = pathFor(id); if (!pth) return;
  const keys = new Set();
  if (pth.all) { for (const c of A) for (const p of parents[c] || []) if (A.has(p)) keys.add(c + "|" + p); }
  else for (let i = 0; i + 1 < pth.seq.length; i++) {
    const a = pth.seq[i], b = pth.seq[i + 1];
    keys.add(a + "|" + b); keys.add(b + "|" + a);
  }
  world.classList.add("dim");
  pth.nodes.forEach(n => world.querySelector(`[data-node="${CSS.escape(n)}"]`)?.classList.add("on"));
  const sel = world.querySelector(`[data-node="${CSS.escape(nodes[id] ? id : groupOf[id])}"]`); sel?.classList.add("sel");
  for (const el of [...edgeEls, ...knotEls, ...$$(".cpl", world)]) if (el.dataset.k.split(" ").some(k => keys.has(k))) el.classList.add("on");
  $$(".ltitle", world).forEach(t => t.classList.add("on"));
}
function clearHighlight() { world.classList.remove("dim"); $$(".on,.sel", world).forEach(e => e.classList.remove("on", "sel")); }
function focusNode(id) {
  const n = nodes[id] || nodes[groupOf[id]]; if (!n) return;
  const { w, h } = vpSize(), mob = mqMobile.matches;
  if (cam.s < 0.62) cam.s = mob ? 0.8 : 0.9;
  const sh = $("#sheet");
  let tx, ty;
  if (mob) {
    const pth = pathFor(id), ids = pth ? [...pth.nodes] : [n.id];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const k of ids) { const m = nodes[k]; if (!m) continue; x0 = Math.min(x0, m.x - 66); x1 = Math.max(x1, m.x + 66); y0 = Math.min(y0, m.y - 8); y1 = Math.max(y1, m.y + LB - 20); }
    const top = tv.getBoundingClientRect().top, freeH = Math.max(160, innerHeight * 0.54 - top - 12);   // карточка в первой ступени — 46% экрана
    cam.s = Math.max(0.3, Math.min(0.9, (w - 24) / (x1 - x0), (freeH - 16) / (y1 - y0)));
    cam.x = w / 2 - (x0 + x1) / 2 * cam.s; cam.y = 8 + freeH / 2 - (y0 + y1) / 2 * cam.s;
    return apply(true);
  }
  if (mob) { const freeH = h - Math.min(sh.offsetHeight, h * .86) + (innerHeight - tv.getBoundingClientRect().bottom); tx = w / 2; ty = Math.max(90, freeH / 2) - (MED / 2) * cam.s; }
  else { const free = w - sh.offsetWidth - 34; tx = free / 2; ty = h / 2 - 40; }
  const sx = cam.x + n.x * cam.s, sy = cam.y + (n.y + MED / 2) * cam.s;
  if (!mob && sx > 60 && sx < w - sh.offsetWidth - 60 && sy > 100 && sy < h - 100) return apply(true);
  cam.x = tx - n.x * cam.s; cam.y = ty - MED / 2 * cam.s - n.y * cam.s + (mob ? 0 : 0);
  apply(true);
}

// ═════════════════════ КАРТОЧКА (sheet) ═════════════════════
const sheet = $("#sheet"), shBody = $("#sh-body"), scrim = $("#scrim");
let curSheet = null, lastFocus = null;
const sheetOpen = () => sheet.classList.contains("on");
function relRows(ids) { return `<div class="glist">${ids.filter(has).map(id => `<button class="prow" data-open="${id}">${ringed(id)}<span><b>${esc(P[id].name)}</b><small>${esc([P[id].rl, years(P[id].yr)].filter(Boolean).join(" · "))}</small></span></button>`).join("")}</div>`; }
// ── черновик виден в галерее до правки Дениса ──
const PENDING = {};                       // person -> {src, kind, text}
const draftMediaURL = id => `../draft?person=${encodeURIComponent(id)}&media=1&v=${Date.now()}`;
const pendingItem = id => {
  const p = PENDING[id];
  if (!p) return null;
  const video = p.kind === "video";
  return { k: "pending:" + id, th: p.src, src: p.src, cap: p.text || "", who: [id], faces: [], a: null, pending: 1, v: video ? "pending" : "" };
};
const albumForCard = id => {
  const list = personAlbum(id).slice(), it = pendingItem(id);
  if (it) list.push(it);
  return list;
};
function setPending(id, src, kind, text) {
  if (!src) return;
  PENDING[id] = { src, kind: kind === "video" ? "video" : "image", text: text || "" };
  if (curSheet === id && sheetOpen()) refreshCardGallery(id);
}
// ── кто правит: Денис по PIN, cookie ставит сервер ──
let ADMIN = false;
function loadAdmin() {
  fetch("../admin", { cache: "no-store" })
    .then(r => (r.ok ? r.json() : null))
    .then(j => { ADMIN = !!(j && j.admin); if (vw.classList.contains("on")) show(VI); })
    .catch(() => {});
}
function draftId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}
function draftDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("semya-draft", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("box");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function idbGet(id) {
  return draftDb().then(db => new Promise((resolve, reject) => {
    const req = db.transaction("box").objectStore("box").get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  }));
}
function idbPut(id, value) {
  return draftDb().then(db => new Promise((resolve, reject) => {
    const req = db.transaction("box", "readwrite").objectStore("box").put(value, id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}
function setDraftMsg(form, text) {
  const msg = form.querySelector(".draft-msg");
  if (msg) msg.textContent = text;
}
function showDraftMedia(form, file, serverKind) {
  const img = form.querySelector("img.draft-preview");
  const vid = form.querySelector("video.draft-preview");
  const video = file ? (file.type || "").startsWith("video") : serverKind === "video";
  img.hidden = true; vid.hidden = true;
  if (file) {
    const url = URL.createObjectURL(file);
    if (video) vid.src = url; else img.src = url;
  } else if (serverKind) {
    const url = `../draft?person=${encodeURIComponent(form.dataset.person)}&media=1&v=${Date.now()}`;
    if (video) vid.src = url; else img.src = url;
  } else return;
  (video ? vid : img).hidden = false;
  const cap = form.querySelector(".draft-pick span");
  if (cap && file) cap.textContent = file.name || "Выбрать фото";
}
function rememberDraft(form) {
  const file = form._file || null;
  return idbPut(form.dataset.person, {
    text: form.text.value,
    blob: file,
    type: file ? file.type : "",
    name: file ? file.name : "",
    clientId: form.dataset.clientId || "",
    dirty: form.dataset.dirty === "1",
  }).catch(() => {});
}
function touchDraft(form, immediate) {
  if (form._hydrating) return;
  form._hold = false;
  const text = form.text.value.trim();
  if (!text && !form._file) return;
  form.dataset.dirty = "1";
  if (form._inflight) form._rotate = true;
  else form.dataset.clientId = draftId();
  rememberDraft(form);
  if (!navigator.onLine) setDraftMsg(form, "не ушло, повторим");
  clearTimeout(form._draftTimer);
  if (immediate) flushDraft(form);
  else form._draftTimer = setTimeout(() => flushDraft(form), 800);
}
async function flushDraft(form) {
  if (!form || !form.isConnected || form._hydrating || form._hold || form.dataset.dirty !== "1") return;
  if (form._inflight) { form._again = true; return; }
  const text = form.text.value.trim();
  const file = form._file || null;
  if (!text && !file) return;
  if (!form.dataset.clientId) form.dataset.clientId = draftId();
  const clientId = form.dataset.clientId;
  form._inflight = true;
  try {
    const body = new FormData();
    body.append("person", form.dataset.person);
    body.append("text", text);
    body.append("client_id", clientId);
    if (file) body.append("photo", file, file.name || "file");
    const r = await fetch("../draft", { method: "POST", body, keepalive: document.visibilityState === "hidden" && !file });
    if (r.status === 400 || r.status === 413) {
      form._hold = true;
      form.dataset.dirty = "0";
      setDraftMsg(form, "не ушло, повторим");
      return;
    }
    if (!r.ok) throw new Error();
    const same = form.text.value.trim() === text && (form._file || null) === file;
    if (same) {
      form.dataset.dirty = "0";
      form.dataset.clientId = "";
      setDraftMsg(form, "сохранено");
      if (file) setPending(form.dataset.person, URL.createObjectURL(file), (file.type || "").startsWith("video") ? "video" : "image", text);
      await rememberDraft(form);
    }
  } catch (err) {
    setDraftMsg(form, "не ушло, повторим");
    await rememberDraft(form);
    clearTimeout(form._retry);
    form._retry = setTimeout(() => flushDraft(form), 3000);
  } finally {
    form._inflight = false;
    if (form._rotate) { form._rotate = false; form.dataset.clientId = draftId(); form.dataset.dirty = "1"; }
    if (form._again || (form.dataset.dirty === "1" && form.dataset.clientId && form.dataset.clientId !== clientId)) {
      form._again = false;
      flushDraft(form);
    }
  }
}
function idbDelete(id) {
  return draftDb().then(db => new Promise((resolve, reject) => {
    const req = db.transaction("box", "readwrite").objectStore("box").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  })).catch(() => {});
}
function clearDraftForm(form, id) {
  form._file = null;
  form.text.value = "";
  form.dataset.dirty = "0";
  form.dataset.clientId = "";
  const img = form.querySelector("img.draft-preview"), vid = form.querySelector("video.draft-preview");
  if (img) { img.hidden = true; img.removeAttribute("src"); }
  if (vid) { vid.hidden = true; vid.removeAttribute("src"); }
  const input = form.querySelector('input[name="photo"]');
  if (input) input.value = "";
  const cap = form.querySelector(".draft-pick span");
  if (cap) cap.textContent = "Выбрать фото";
  delete PENDING[id];
  setDraftMsg(form, "");
  if (curSheet === id && sheetOpen()) refreshCardGallery(id);
}
async function hydrateDraft(id) {
  const form = sheet.querySelector(`form.draft[data-person="${id}"]`);
  if (!form) return;
  let local = null;
  try { local = await idbGet(id); } catch (err) { local = null; }
  let remote = null, known = false;
  try {
    const r = await fetch(`../draft?person=${encodeURIComponent(id)}`, { cache: "no-store" });
    known = true;
    if (r.status === 200) remote = await r.json();
  } catch (err) { remote = null; }
  if (!form.isConnected) return;
  if (remote) {
    if (remote.media) setPending(id, draftMediaURL(id), remote.media, remote.text);
  } else if (known) {
    // на сервере черновика нет: он одобрен или удалён — локальную копию забываем,
    // иначе одобренное фото висит вторым, «на модерации»
    await idbDelete(id);
    if (form.dataset.dirty !== "1") clearDraftForm(form, id);
    return;
  }
  if (form.dataset.dirty === "1") {
    if (!form._file && remote && remote.media) showDraftMedia(form, null, remote.media);
    return;
  }
  form._hydrating = true;
  if (local && local.dirty) {
    form.text.value = local.text || "";
    if (local.blob) {
      form._file = new File([local.blob], local.name || "file", { type: local.type || local.blob.type || "" });
      showDraftMedia(form, form._file);
      const kind = ((local.type || local.blob.type || "").startsWith("video")) ? "video" : "image";
      setPending(id, URL.createObjectURL(local.blob), kind, local.text);
    } else if (remote && remote.media) {
      showDraftMedia(form, null, remote.media);
      setPending(id, draftMediaURL(id), remote.media, remote.text);
    }
    form.dataset.dirty = "1";
    form.dataset.clientId = local.clientId || draftId();
    form._hydrating = false;
    setDraftMsg(form, "не ушло, повторим");
    flushDraft(form);
    return;
  }
  const text = (remote && remote.text) || (!remote && local && local.text) || "";
  const media = (remote && remote.media) || "";
  if (text || media || (local && local.blob)) {
    form.text.value = text;
    if (local && local.blob && !media) {
      form._file = new File([local.blob], local.name || "file", { type: local.type || "" });
      showDraftMedia(form, form._file);
      const kind = ((local.type || local.blob.type || "").startsWith("video")) ? "video" : "image";
      setPending(id, URL.createObjectURL(local.blob), kind, local.text);
    } else if (media) {
      showDraftMedia(form, null, media);
      setPending(id, draftMediaURL(id), media, text);
    }
    setDraftMsg(form, remote || (local && !local.dirty) ? "сохранено" : "");
  }
  form._hydrating = false;
}
function draftForm(id) {
  return `<form class="draft" data-person="${esc(id)}" autocomplete="off">
    <p class="draft-lead">Фото и рассказ. На дереве появится только после правки Дениса.</p>
    <label class="draft-pick"><input type="file" name="photo" accept="image/*,video/*"><span>Выбрать фото</span></label>
    <img class="draft-preview" alt="" hidden>
    <video class="draft-preview" hidden playsinline controls></video>
    <textarea name="text" placeholder="Как вы это помните"></textarea>
    <button type="submit">Сохранить</button>
    <p class="draft-msg" role="status"></p>
  </form>`;
}
function actsHTML(id) {
  const p = P[id], al = albumForCard(id), story = p.story && STORIES[p.story];
  const showTree = curTab !== "tree" && (nodes[id] || groupOf[id]);
  return `<div class="sh-acts">
      ${story ? `<button class="btn pri" data-story="${esc(p.story)}">${ICON.book}Статья</button>` : ""}
      ${al.length ? `<button class="btn ${story ? "" : "pri"}" data-photos="${id}">${ICON.photo}Фото (${al.length})</button>` : ""}
      ${showTree ? `<button class="btn" data-totree="${id}">${ICON.tree}На дереве</button>` : ""}
    </div>`;
}
function thumbsHTML(id) {
  const al = albumForCard(id);
  let th = al.slice(0, 8);
  const pi = al.findIndex(it => it.pending);
  if (pi >= 8) th = al.slice(0, 7).concat(al[pi]);   // ожидающее фото не прячем за «+N»
  if (th.length <= 1) return "";
  return `<div class="sh-thumbs">${th.map((it, i) => `<button class="${it.pending ? "pend" : ""}" data-photos="${id}" data-i="${i}" aria-label="${it.pending ? "На модерации" : (it.v ? "Видео " : "Фото ") + (i + 1)}">${it.v && it.pending ? `<video src="${it.th}" muted playsinline preload="metadata"></video>` : `<img src="${it.th}" alt="" loading="lazy" decoding="async">`}${it.pending ? `<span class="pendtag">на модерации</span>` : ""}${i === 7 && al.length > 8 ? `<span class="more">+${al.length - 7}</span>` : ""}</button>`).join("")}</div>`;
}
function refreshCardGallery(id) {
  if (curSheet !== id || !sheetOpen()) return;
  const acts = shBody.querySelector(".sh-acts");
  if (acts) acts.outerHTML = actsHTML(id);
  const old = shBody.querySelector(".sh-thumbs"), html = thumbsHTML(id);
  if (old) { if (html) old.outerHTML = html; else old.remove(); }
  else if (html) shBody.querySelector(".sh-acts")?.insertAdjacentHTML("afterend", html);
}
function personHTML(id) {
  const p = P[id];
  const par = (parents[id] || []).filter(has), ch = (children[id] || []).filter(has);
  return `<div class="sh-top">${ringed(id)}<div><h2 class="sh-name" id="sh-name">${esc(p.name)}</h2>
      ${p.yr ? `<div class="sh-yr">${esc(p.yr)}</div>` : ""}${p.rl ? `<div class="sh-rl kicker">${esc(p.rl)}</div>` : ""}</div></div>
    ${draftForm(id)}
    <div class="sh-st"><span class="stmark"><i class="s-${p.st}"></i>${esc(ST[p.st] || "")}</span></div>
    ${actsHTML(id)}
    ${thumbsHTML(id)}
    ${p.facts?.length ? `<h3 class="sh-h">Что известно</h3><ul class="facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
    ${p.src ? `<h3 class="sh-h">Источник</h3><p class="src">${esc(p.src)}</p>` : ""}
    ${par.length ? `<h3 class="sh-h">Родители</h3>${relRows(par)}` : ""}
    ${ch.length ? `<h3 class="sh-h">Дети</h3>${relRows(ch)}` : ""}`;
}
function openSheet(html, key, scrimOn) {
  if (!sheetOpen()) lastFocus = document.activeElement;
  shBody.innerHTML = html; shBody.scrollTop = 0;
  sheet.classList.add("on"); sheet.classList.remove("full");
  scrim.classList.toggle("on", !!scrimOn);
  if (history.state?.sheet) history.replaceState({ sheet: key }, "");
  else history.pushState({ sheet: key }, "");
  curSheet = key;
  setTimeout(() => sheet.focus({ preventScroll: true }), 50);
}
function openPerson(id) {
  if (!has(id)) return;
  finishIntro();
  const onTree = curTab === "tree";
  openSheet(personHTML(id), id, !onTree);
  hydrateDraft(id);
  if (onTree) { highlight(id); requestAnimationFrame(() => focusNode(id)); }
  hideHint();
}
function openGroup(key) {
  const g = groups[key]; if (!g) return;
  finishIntro();
  openSheet(`<div class="sh-top" style="padding-right:44px"><div><div class="kicker">${esc(LAYOUT[nodes[key]?.line]?.title || "")}</div><h2 class="sh-name" id="sh-name" style="margin-top:8px">${esc(groupLabel(g))}</h2><div class="sh-yr">${plural(g.members.length, "человек", "человека", "человек")}</div></div></div><div style="margin-top:18px">${relRows(g.members)}</div>`, key, curTab !== "tree");
  if (curTab === "tree") { highlight(g.members[0]); requestAnimationFrame(() => focusNode(g.members[0])); }
}
function closeSheetNow() {
  sheet.classList.remove("on"); scrim.classList.remove("on"); curSheet = null;
  clearHighlight();
  if (curTab === "tree" && !mqMobile.matches) apply(true);
  lastFocus?.focus?.({ preventScroll: true });
}
function closeSheet() { if (history.state?.sheet) history.back(); else closeSheetNow(); }
$("#sh-x").onclick = closeSheet; scrim.onclick = closeSheet;
sheet.addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.open) return openPerson(t.dataset.open);
  if (t.dataset.photos) return openViewer(albumForCard(t.dataset.photos), +(t.dataset.i || 0), short(P[t.dataset.photos].name));
  if (t.dataset.story) { const k = t.dataset.story; closeSheetNow(); go("stories/" + k); return; }
  if (t.dataset.totree) { const id = t.dataset.totree; closeSheetNow(); go("tree"); setTimeout(() => openPerson(id), 60); }
});
sheet.addEventListener("input", e => {
  if (e.target.name !== "text" || !e.target.form?.classList.contains("draft")) return;
  touchDraft(e.target.form, false);
});
sheet.addEventListener("change", e => {
  if (e.target.name !== "photo" || !e.target.form?.classList.contains("draft")) return;
  const form = e.target.form;
  const file = e.target.files && e.target.files[0];
  const cap = form.querySelector(".draft-pick span");
  if (!file) { cap.textContent = "Выбрать фото"; return; }
  form._file = file;
  showDraftMedia(form, file);
  touchDraft(form, true);
});
sheet.addEventListener("submit", e => {
  const form = e.target;
  if (!form.classList?.contains("draft")) return;
  e.preventDefault();
  if (form.dataset.dirty === "1") flushDraft(form);
});
window.addEventListener("online", () => {
  document.querySelectorAll("form.draft").forEach(form => { if (form.dataset.dirty === "1") flushDraft(form); });
});
window.addEventListener("pagehide", () => {
  document.querySelectorAll("form.draft").forEach(form => { if (form.dataset.dirty === "1" && !form._file) flushDraft(form); });
});
// карточка на телефоне в две ступени: половина экрана → весь экран; ручку тянуть вверх/вниз
function setFull(on) { sheet.classList.toggle("full", on); $("#sh-exp").setAttribute("aria-label", on ? "Свернуть карточку" : "Развернуть карточку"); }
$("#sh-exp").onclick = () => setFull(!sheet.classList.contains("full"));
(() => {
  let y0 = null, dy = 0;
  const g = $("#grab");
  g.addEventListener("pointerdown", e => { y0 = e.clientY; dy = 0; g.setPointerCapture(e.pointerId); sheet.style.transition = "none"; });
  g.addEventListener("pointermove", e => { if (y0 == null) return; dy = e.clientY - y0; sheet.style.transform = dy > 0 ? `translateY(${dy}px)` : ""; });
  const end = () => {
    if (y0 == null) return; y0 = null; sheet.style.transition = ""; sheet.style.transform = "";
    const full = sheet.classList.contains("full");
    if (Math.abs(dy) < 6) return setFull(!full);
    if (dy < -40) setFull(true);
    else if (dy > 60) full ? setFull(false) : closeSheet();
  };
  g.addEventListener("pointerup", end); g.addEventListener("pointercancel", end);
})();

// ═════════════════════ ЛЮДИ ═════════════════════
const GEN_NAMES = ["Поколение прапрадедов", "Поколение прадедов", "Поколение бабушек и дедушек", "Поколение родителей"];
function peopleSections() {
  const seen = new Set(), secs = [];
  const take = ids => ids.filter(id => has(id) && !seen.has(id) && seen.add(id));
  const me = take(ME);
  if (me.length) secs.push({ cls: "k", title: me.map(id => P[id].name.split(" ")[0]).join(" и "), sub: "", gens: [{ name: "", ids: me }] });
  for (const L of ["father", "mother"]) {
    const lay = LAYOUT[L]; if (!lay) continue;
    const gens = [];
    lay.gens.forEach((units, g) => {
      let ids = [];
      units.forEach(u => u.ids.forEach(id => {
        ids.push(id);
        for (const gr of Object.values(groups)) if (gr.anchor === id) ids.push(...gr.members);
      }));
      ids = take(ids);
      if (ids.length) gens.push({ name: GEN_NAMES[g] || "", ids });
    });
    secs.push({ cls: L === "father" ? "f" : "m", title: lay.title, sub: lay.sub, gens });
  }
  const rest = take(Object.keys(P));
  if (rest.length) secs.push({ cls: "k", title: "Другие", sub: "", gens: [{ name: "", ids: rest }] });
  return secs;
}
const norm = s => s.toLowerCase().replace(/ё/g, "е");
function renderPeople() {
  const v = $("#v-people");
  const card = id => {
    const p = P[id], n = personAlbum(id).length;
    return `<button class="pc" data-open="${id}" data-q="${esc(norm(p.name + " " + (p.yr || "") + " " + (p.rl || "")))}">${ringed(id)}<span class="t"><b>${esc(p.name)}</b>${p.yr ? `<span class="y">${esc(p.yr)}</span>` : ""}<span class="r">${p.rl ? esc(p.rl) : ""}${n ? `<em>${plural(n, "фото", "фото", "фото")}</em>` : ""}</span></span></button>`;
  };
  v.innerHTML = `<div class="page"><div class="ph"><div><h2>Люди</h2><p>Все, кто есть на дереве, — по линиям и поколениям. Нажмите на человека, чтобы открыть его карточку и фотографии.</p></div>
    <label class="search"><span class="sr">Поиск по имени</span><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input id="q" type="search" placeholder="Поиск по имени" autocomplete="off" enterkeyhint="search"></label></div>
    ${peopleSections().map(s => `<section class="lsec ${s.cls}"><header><h3>${esc(s.title)}</h3>${s.sub ? `<span>${esc(s.sub)}</span>` : ""}</header>
      ${s.gens.map(g => `<div class="gen">${g.name ? `<h4>${esc(g.name)}</h4>` : ""}<div class="pgrid">${g.ids.map(card).join("")}</div></div>`).join("")}</section>`).join("")}
    <p class="empty" id="q-empty" hidden>Никого не нашли. Попробуйте написать имя иначе.</p></div>`;
  const q = $("#q", v);
  q.addEventListener("input", () => {
    const s = norm(q.value.trim());
    $$(".pc", v).forEach(c => c.hidden = !!s && !c.dataset.q.includes(s));
    $$(".gen", v).forEach(g => g.hidden = !$$(".pc", g).some(c => !c.hidden));
    $$(".lsec", v).forEach(g => g.hidden = !$$(".pc", g).some(c => !c.hidden));
    $("#q-empty", v).hidden = $$(".pc", v).some(c => !c.hidden);
  });
}
document.addEventListener("click", e => {
  const b = e.target.closest(".view [data-open]"); if (b) openPerson(b.dataset.open);
});

// ═════════════════════ ИСТОРИИ ═════════════════════
const storyOwner = k => Object.keys(P).find(id => P[id].story === k);
const storyTitle = s => (s.title || "").replace(/\s*—\s*читать целиком\s*$/i, "");
function renderStories(key) {
  const v = $("#v-stories");
  if (key && STORIES[key]) {
    const s = STORIES[key], id = storyOwner(key), p = P[id] || { name: "" }, n = id ? personAlbum(id).length : 0;
    v.innerHTML = `<div class="rprog"><i id="rp"></i></div><div class="reader">
      <aside class="raside"><button class="back" data-go="stories">${ICON.back}Все истории</button>
        ${id ? portrait(id) : ""}
        <div class="toc-wrap">${id ? `<div class="kicker" style="margin-top:18px">${esc(p.rl || "")}</div>` : ""}</div>
        <nav class="toc" aria-label="Разделы статьи">${s.parts.map(([h], i) => `<a href="#" data-to="part${i}">${esc(h)}</a>`).join("")}</nav>
        ${id ? `<div class="btns"><button class="btn" data-open="${id}">${ICON.card}Карточка</button>${n ? `<button class="btn" data-photos="${id}">${ICON.photo}Фото (${n})</button>` : ""}</div>` : ""}
      </aside>
      <article class="art">${id ? `<div class="art-pt">${ringed(id)}</div>` : ""}<div class="kicker">${esc(storyTitle(s))}</div><h1>${esc(p.name || storyTitle(s))}</h1>${s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ""}${id ? `<div class="art-acts"><button class="btn" data-open="${id}">${ICON.card}Карточка</button>${n ? `<button class="btn" data-photos="${id}">${ICON.photo}Фото (${n})</button>` : ""}</div>` : ""}<hr class="rule">
        ${s.parts.map(([h, ps], i) => `<h2 id="part${i}">${esc(h)}</h2>${ps.map(t => `<p>${esc(t)}</p>`).join("")}`).join("")}
      </article>
      ${n ? `<aside class="rrail"><h3 class="sh-h" style="margin-top:0">Фотографии</h3><div class="rgrid">${personAlbum(id).slice(0, 12).map((it, i) => `<button data-photos="${id}" data-i="${i}"><img src="${it.th}" alt="${esc(it.cap)}" loading="lazy" decoding="async"></button>`).join("")}</div></aside>` : ""}</div>`;
    v.scrollTop = 0;
    const heads = $$(".art h2", v), links = $$(".toc a", v), bar = $("#rp", v);
    v.onscroll = () => {
      const m = v.scrollHeight - v.clientHeight; bar.style.width = (m > 0 ? v.scrollTop / m * 100 : 0) + "%";
      let a = 0; heads.forEach((h, i) => { if (h.getBoundingClientRect().top < 160) a = i; });
      links.forEach((l, i) => l.classList.toggle("on", i === a));
    };
    v.onscroll();
    return;
  }
  v.onscroll = null;
  const keys = Object.keys(STORIES);
  v.innerHTML = `<div class="page"><div class="ph"><div><h2>Истории</h2><p>Статьи и воспоминания о людях из дерева. Читать удобно с телефона: крупный шрифт, разделы, без лишнего.</p></div></div>
    <div class="scards">${keys.map(k => { const s = STORIES[k], id = storyOwner(k), p = P[id] || {};
      return `<button class="scard" data-go="stories/${esc(k)}">${id ? ringed(id) : ""}<span><span class="kicker">${esc(p.rl || "")}</span><h3>${esc(p.name || storyTitle(s))}</h3><p>${esc(storyTitle(s))}</p><span class="go">Читать ${ICON.arrow}</span></span></button>`; }).join("")}
      <div class="scard soon"><span><h3 style="font-size:24px;color:var(--ink2)">Здесь появятся новые истории</h3><p>Каждая статья будет связана с карточкой человека на дереве.</p></span></div></div></div>`;
}
$("#v-stories").addEventListener("click", e => {
  const a = e.target.closest("[data-to]");
  if (a) { e.preventDefault(); document.getElementById(a.dataset.to)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); return; }
  const ph = e.target.closest("[data-photos]");
  if (ph) openViewer(personAlbum(ph.dataset.photos), +(ph.dataset.i || 0), short(P[ph.dataset.photos].name));
});

// ═════════════════════ АРХИВ ═════════════════════
const photoPeople = () => {
  const order = peopleSections().flatMap(s => s.gens.flatMap(g => g.ids));
  return order.filter(id => personAlbum(id).length);
};
function renderArchive(sub) {
  const v = $("#v-archive");
  const [kind, id] = (sub || "").split("/");
  if ((kind === "a" && albumTitle[id]) || (kind === "p" && has(id))) {
    const list = kind === "a" ? albumList(id) : personAlbum(id);
    const ttl = kind === "a" ? albumTitle[id] : P[id].name;
    const chips = kind === "a"
      ? D.albums.filter(a => albumList(a.id).length).map(a => `<button data-go="archive/a/${a.id}" aria-pressed="${a.id === id}">${esc(a.title)}</button>`).join("")
      : photoPeople().map(pid => `<button data-go="archive/p/${pid}" aria-pressed="${pid === id}">${portrait(pid)}${esc(short(P[pid].name))}</button>`).join("");
    v.innerHTML = `<div class="page"><button class="back" data-go="archive">${ICON.back}Архив</button>
      <div class="ttl"><h2>${esc(ttl)}</h2><span>${plural(list.length, "фотография", "фотографии", "фотографий")}</span>${kind === "p" ? `<button class="btn" data-open="${id}" style="height:38px;margin-left:auto">${ICON.card}Карточка</button>` : ""}</div>
      <div class="fbar" role="group" aria-label="${kind === "a" ? "Альбомы" : "Люди"}">${chips}</div>
      <div class="pgal" data-list="${kind}/${id}">${list.map((it, i) => `<button data-i="${i}" aria-label="${esc(it.cap || "Фото " + (i + 1))}"><img src="${it.th}" alt="${esc(it.cap)}" loading="lazy" decoding="async"></button>`).join("")}</div></div>`;
    v.scrollTop = 0;
    const on = $(".fbar [aria-pressed=true]", v); on?.scrollIntoView({ inline: "center", block: "nearest" });
    $(".pgal", v).onclick = e => { const b = e.target.closest("[data-i]"); if (b) openViewer(list, +b.dataset.i, ttl); };
    return;
  }
  const total = D.order.filter(k => D.photos[k] && !D.photos[k].hide).length;
  v.innerHTML = `<div class="page"><div class="ph"><div><h2>Архив</h2><p>Фотографии и документы семьи — ${plural(total, "снимок", "снимка", "снимков")}. Смотрите по альбомам или выберите человека.</p></div></div>
    <div class="agrid">${D.albums.map(a => { const l = albumList(a.id); if (!l.length) return "";
      const c = [l[2] || l[0], l[1] || l[0], l[0]];
      return `<button class="alb" data-go="archive/a/${a.id}"><span class="stk">${c.map(x => `<span><img src="${x.th}" alt="" loading="lazy" decoding="async"></span>`).join("")}</span><b>${esc(a.title)}</b><small>${plural(l.length, "фотография", "фотографии", "фотографий")}</small></button>`; }).join("")}</div>
    <section class="asec"><h3>Люди на фотографиях</h3><div class="prail">${photoPeople().map(id => `<button class="pchip" data-go="archive/p/${id}">${ringed(id)}<b>${esc(short(P[id].name))}</b><small>${personAlbum(id).length} фото</small></button>`).join("")}</div></section></div>`;
}

// ═════════════════════ ПРОСМОТР ФОТО ═════════════════════
const vw = $("#vw"), vimg = $("#vw-img"), vfit = $("#vw-fit"), vfc = $("#vw-fc"), vstage = $("#vw-stage"), vcap = $("#vw-cap"), vstrip = $("#vw-strip");
let VL = [], VI = 0, vTitle = "", facesOn = false, vFocus = null;
const ratio = {};
function capHTML(it) {
  const names = it.who.length > 1 ? "На фото: " + it.who.map(w => short(P[w].name)).join(", ") : "";
  const al = it.portrait ? "Портрет" : it.a && it.a !== "old" ? "Альбом «" + albumTitle[it.a] + "»" : it.a ? albumTitle[it.a] : "";
  const pend = it.pending ? `<span class="pend">на модерации — на дереве появится после правки Дениса</span>` : "";
  return `<div class="in">${pend}${it.cap ? esc(it.cap) : ""}${names ? `<span class="w">${esc(names)}</span>` : ""}${al ? `<span class="a">${esc(al)}</span>` : ""}</div>`;
}
function openViewer(list, i, title) {
  if (!list.length) return;
  VL = list; vTitle = title || ""; vFocus = document.activeElement;
  vstrip.innerHTML = list.map((it, j) => `<button data-j="${j}" aria-label="${it.v ? "Видео" : "Фото"} ${j + 1}">${it.v && it.pending ? `<video src="${it.th}" muted playsinline preload="metadata"></video>` : `<img src="${it.th}" alt="" loading="lazy" decoding="async">`}</button>`).join("");
  vw.classList.add("on");
  history.pushState({ sheet: history.state?.sheet || null, viewer: 1 }, "");
  // высота подписи — по самой длинной в этом наборе: ничего не прыгает при листании
  const m = document.createElement("div"); m.className = "vw-cap measure"; vw.appendChild(m);
  let mh = 0; for (const it of list) { m.innerHTML = capHTML(it); mh = Math.max(mh, m.offsetHeight); }
  m.remove(); vcap.style.height = mh + "px";
  show(i, true);
  setTimeout(() => vw.focus({ preventScroll: true }), 40);
}
function layoutFit() {
  const it = VL[VI], r = ratio[it.th] || ratio[it.src] || 1.33;
  const sw = vstage.clientWidth - (mqMobile.matches ? 0 : 140), sh = vstage.clientHeight - 16;
  let w = Math.min(sw, sh * r), h = w / r;
  Object.assign(vfit.style, { width: w + "px", height: h + "px", marginLeft: -w / 2 + "px", marginTop: -h / 2 + "px" });
}
function show(i, first) {
  VI = Math.max(0, Math.min(VL.length - 1, i));
  const it = VL[VI], vid = $("#vw-video");
  if (it.v) {
    vimg.hidden = true; vimg.removeAttribute("src");
    vid.hidden = false; vid.poster = it.th; vid.src = it.src;
    vid.onloadedmetadata = () => { if (vid.videoWidth) { ratio[it.src] = vid.videoWidth / vid.videoHeight; layoutFit(); } };
    vid.play().catch(() => {});
  } else {
    vid.pause(); vid.hidden = true; vid.removeAttribute("src"); vid.removeAttribute("poster"); vid.onloadedmetadata = null;
    vimg.hidden = false;
    vimg.alt = it.cap || (it.who.length ? "Фото: " + it.who.map(w => P[w].name).join(", ") : "Фотография");
    const setR = (img, key) => { if (img.naturalWidth) { ratio[key] = img.naturalWidth / img.naturalHeight; layoutFit(); } };
    vimg.onload = () => setR(vimg, vimg.getAttribute("src") === it.src ? it.src : it.th);
    vimg.src = it.th;
    if (it.src !== it.th) { const im = new Image(); im.decoding = "async"; im.onload = () => { ratio[it.src] = im.naturalWidth / im.naturalHeight; if (VL[VI] === it) { vimg.src = it.src; layoutFit(); } }; im.src = it.src; }
  }
  layoutFit();
  $("#vw-ttl").innerHTML = `<b>${VI + 1} / ${VL.length}</b>${esc(vTitle)}`;
  vcap.innerHTML = capHTML(it);
  const fb = $("#vw-faces"); fb.hidden = !it.faces.length; fb.setAttribute("aria-pressed", facesOn && !!it.faces.length);
  const ok = $("#vw-ok"), pb = $("#vw-pin-btn");
  if (ok) { ok.hidden = !(it.pending && ADMIN); ok.disabled = false; ok.innerHTML = "<span>Одобрить</span>"; }
  if (pb) pb.hidden = !(it.pending && !ADMIN);
  vfc.innerHTML = it.faces.map(([x, y, w, h, id]) => `<div style="left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;height:${h * 100}%"><span>${esc(short(P[id].name))}</span></div>`).join("");
  vfc.classList.toggle("on", facesOn && !!it.faces.length);
  $("#vw-p").disabled = VI === 0; $("#vw-n").disabled = VI === VL.length - 1;
  $$("button", vstrip).forEach(b => b.classList.toggle("on", +b.dataset.j === VI));
  const on = $(`[data-j="${VI}"]`, vstrip);
  if (on) vstrip.scrollTo({ left: on.offsetLeft - (vstrip.clientWidth - on.offsetWidth) / 2, behavior: first || reduced ? "auto" : "smooth" });
  // соседние полноразмерные — заранее
  [VI + 1, VI - 1].forEach(j => { const n = VL[j]; if (n && n.src !== n.th) { const im = new Image(); im.src = n.src; } });
}
function closeViewerNow() { vw.classList.remove("on"); vimg.removeAttribute("src"); vFocus?.focus?.({ preventScroll: true }); }
function closeViewer() { if (history.state?.viewer) history.back(); else closeViewerNow(); }
$("#vw-x").onclick = closeViewer;
$("#vw-p").onclick = () => show(VI - 1); $("#vw-n").onclick = () => show(VI + 1);
$("#vw-faces").onclick = () => { facesOn = !facesOn; show(VI); };
async function approvePending(it) {
  const id = it.k.slice("pending:".length), btn = $("#vw-ok");
  if (!btn) return;
  btn.disabled = true; btn.innerHTML = "<span>Одобряю…</span>";
  try {
    const r = await fetch("../approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person: id }),
    });
    if (!r.ok && r.status !== 404) throw new Error(String(r.status));
    await idbDelete(id);
    delete PENDING[id];
    try { sessionStorage.setItem("semya-open", id); } catch (e) {}
    location.reload();
  } catch (e) {
    btn.disabled = false; btn.innerHTML = "<span>Не вышло — повторить</span>";
  }
}
$("#vw-ok").onclick = () => approvePending(VL[VI]);
$("#vw-pin-btn").onclick = () => {
  const box = $("#vw-pin");
  box.hidden = false;
  const input = $("#vw-pin-in");
  input.value = "";
  setTimeout(() => input.focus(), 30);
};
async function sendPin() {
  const input = $("#vw-pin-in"), go = $("#vw-pin-go");
  const pin = input.value.trim();
  if (!pin) return;
  go.disabled = true; go.textContent = "…";
  try {
    const r = await fetch("../admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!r.ok) throw new Error(String(r.status));
    ADMIN = true;
    $("#vw-pin").hidden = true;
    show(VI);
  } catch (e) {
    go.textContent = "Не тот PIN";
    setTimeout(() => { go.textContent = "Войти"; }, 1600);
  } finally {
    go.disabled = false;
  }
}
$("#vw-pin-go").onclick = sendPin;
$("#vw-pin-in").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); sendPin(); } });
loadAdmin();
vstrip.onclick = e => { const b = e.target.closest("[data-j]"); if (b) show(+b.dataset.j); };
vfc.addEventListener("click", e => { const s = e.target.closest("span"); if (!s) return; });
addEventListener("resize", () => { if (vw.classList.contains("on")) layoutFit(); });
(() => {               // свайп
  let x0 = null, dx = 0, id = null;
  vstage.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; x0 = e.clientX; dx = 0; id = e.pointerId; vfit.classList.add("drag"); });
  vstage.addEventListener("pointermove", e => { if (x0 == null || e.pointerId !== id) return; dx = e.clientX - x0; if (Math.abs(dx) > 8) vstage.setPointerCapture(id); vfit.style.transform = `translateX(${dx}px)`; });
  const end = () => {
    if (x0 == null) return; x0 = null; vfit.classList.remove("drag");
    const dir = dx < -50 ? 1 : dx > 50 ? -1 : 0;
    if (dir && VL[VI + dir]) {
      vfit.style.transform = `translateX(${-dir * 40}px)`; vfit.style.opacity = 0;
      setTimeout(() => { show(VI + dir); vfit.classList.add("drag"); vfit.style.transform = `translateX(${dir * 40}px)`; requestAnimationFrame(() => { vfit.classList.remove("drag"); vfit.style.transform = ""; vfit.style.opacity = ""; }); }, 140);
    } else vfit.style.transform = "";
  };
  vstage.addEventListener("pointerup", end); vstage.addEventListener("pointercancel", end);
})();
vfit.style.transition = "transform .3s var(--ease), opacity .14s";

// ═════════════════════ НАВИГАЦИЯ ═════════════════════
let curTab = null, treeBuilt = false, introDone = false;
function go(h) { location.hash = "#" + h; }
function route() {
  const h = decodeURIComponent(location.hash.slice(1)) || "tree";
  const [tab, ...rest] = h.split("/"), sub = rest.join("/");
  const t = ["tree", "people", "stories", "archive"].includes(tab) ? tab : "tree";
  if (sheetOpen()) closeSheetNow();
  const changed = t !== curTab; curTab = t;
  $$(".tab").forEach(b => b.toggleAttribute("aria-current", false));
  $(`.tab[data-tab="${t}"]`).setAttribute("aria-current", "page");
  $$(".view").forEach(v => v.hidden = v.id !== "v-" + t);
  if (t === "tree") {
    if (!treeBuilt) { buildTree(); treeBuilt = true; }
    fit(mode, false);
    if (!introDone) { introDone = true; playIntro(); showHint(); }
  }
  if (t === "people" && (changed || !$("#v-people").innerHTML)) renderPeople();
  if (t === "stories") renderStories(sub);
  if (t === "archive") renderArchive(sub);
  if (changed && t !== "tree") $("#v-" + t).scrollTop = 0;
  document.title = { tree: "Наша семья — дерево", people: "Наша семья — люди", stories: "Наша семья — истории", archive: "Наша семья — архив" }[t];
}
$$(".tab").forEach(b => b.onclick = () => go(b.dataset.tab));
document.addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) go(g.dataset.go); });
addEventListener("hashchange", route);
addEventListener("popstate", e => {
  const s = e.state || {};
  if (!s.viewer && vw.classList.contains("on")) closeViewerNow();
  if (!s.sheet && sheetOpen()) closeSheetNow();
});
addEventListener("keydown", e => {
  if (vw.classList.contains("on")) {
    if (e.key === "Escape") { e.preventDefault(); closeViewer(); }
    else if (e.key === "ArrowRight") show(VI + 1);
    else if (e.key === "ArrowLeft") show(VI - 1);
    return;
  }
  if (e.key === "Escape" && sheetOpen()) { e.preventDefault(); closeSheet(); }
  if (curTab === "tree" && !e.target.closest("input")) {
    if (e.key === "+" || e.key === "=") $("#zin").click();
    if (e.key === "-") $("#zout").click();
  }
});
mqMobile.addEventListener("change", () => { if (treeBuilt) { buildTree(); if (curTab === "tree") fit(mode, false); } });
let rT; addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => { if (curTab === "tree" && L0 && !sheetOpen()) fit(mode, false); }, 120); });

// подсказка — один раз
const hint = $("#hint");
function showHint() {
  if (mqMobile.matches) hint.textContent = "Выберите линию внизу или нажмите на портрет";
  try { if (localStorage.getItem("v2-hint")) return; } catch (e) {}
  setTimeout(() => {
    if (hintDone) return;
    const th = $(".thead"), zoomed = $("#v-tree").classList.contains("zoomed");
    hint.style.top = mqMobile.matches ? (zoomed ? 10 : th.offsetTop + th.offsetHeight + 8) + "px" : "";
    hint.classList.add("on"); setTimeout(hideHint, 4000);
  }, reduced ? 300 : 3800);
}
let hintDone = false;
tv.addEventListener("pointerdown", () => { hideHint(); $(".legend").classList.remove("open"); $("#lg-btn").setAttribute("aria-expanded", false); });
function hideHint() { hintDone = true; hint.classList.remove("on"); try { localStorage.setItem("v2-hint", "1"); } catch (e) {} }

// тема
const themeBtn = $("#theme");
function setTheme(t, save) {
  document.documentElement.dataset.theme = t;
  $('meta[name="theme-color"]').content = t === "light" ? "#eee7d9" : "#12161c";
  themeBtn.innerHTML = t === "light"
    ? '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'
    : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';
  themeBtn.setAttribute("aria-label", t === "light" ? "Тёмная тема" : "Светлая тема");
  if (save) try { localStorage.setItem("v2-theme", t); } catch (e) {}
}
setTheme(document.documentElement.dataset.theme || "dark");
matchMedia("(prefers-color-scheme: light)").addEventListener("change", e => { try { if (localStorage.getItem("v2-theme")) return; } catch (x) {} setTheme(e.matches ? "light" : "dark"); });
themeBtn.onclick = () => setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light", true);

const fName = P.evgeny ? "папы" : "", lead = $("#tree-lead");
lead.textContent = `Слева — линия ${fName || "отца"}, справа — линия мамы. От старших поколений ветви сходятся к ${ME.filter(has).map(id => P[id].name.split(" ")[0].replace(/я$/, "и").replace(/с$/, "су")).join(" и ")}.`;
window.__v2 = { openPerson, openViewer, personAlbum, fit, go, albumList };
route();
(() => {                       // вернуться в карточку после одобрения
  let id = "";
  try { id = sessionStorage.getItem("semya-open") || ""; sessionStorage.removeItem("semya-open"); } catch (e) {}
  if (id && has(id)) setTimeout(() => openPerson(id), 120);
})();
})();
