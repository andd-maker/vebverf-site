// Вариант 1 · «Летопись». Данные — ../data.js (DATA) и ../people.js (FAM), здесь только вёрстка.
(() => {
"use strict";
const D = window.DATA, F = window.FAM, P = F.P, ST = F.ST, DIMS = window.DIMS || {};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const T = k => `../img/t/${k}.jpg`, FL = k => `../img/f/${k}.jpg`;
const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return n + " " + (m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c); };
const ratio = key => DIMS[key] || 4 / 3;
const first = n => n.includes(" и ") ? n : n.split(/\s+/)[0];
const two = n => n.split(/\s+/).slice(0, 2).join(" ");
const initials = n => n.replace(/\(.*?\)/g, "").split(/\s+/).filter(w => /^[А-ЯЁA-Z]/.test(w)).slice(0, 2).map(w => w[0]).join("");
const ICON = {
  arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5"/></svg>',
  moon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1Z"/></svg>',
  sun: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3"/></svg>'
};

/* ── фото ── */
const photo = k => { const v = D.photos[k]; return {k, th: T(k), src: FL(k), cap: v.cap || "", who: v.who || [], faces: v.faces || [], r: ratio("t/" + k)}; };
function avatar(id){
  const p = P[id]; if (!p.av) return null;
  if (D.avatars[p.av]) { const key = D.avatars[p.av].replace(/^img\//, "").replace(/\.jpg$/, ""); return {th: "../" + D.avatars[p.av], src: "../" + D.avatars[p.av], r: ratio(key), faces: [], who: [id], cap: p.name, k: null}; }
  if (D.photos[p.av]) return photo(p.av);
  return null;
}
function albumOf(id){
  const p = P[id], out = [], seen = new Set();
  const a = avatar(id); if (a) { out.push(a); if (a.k) seen.add(a.k); }
  for (const k of D.order) if (!seen.has(k) && D.photos[k]?.who?.includes(id)) { out.push(photo(k)); seen.add(k); }
  for (const k of p.gal || []) if (!seen.has(k) && D.photos[k]) { out.push(photo(k)); seen.add(k); }
  return out;
}
// кадрирование портрета по рамке лица, если она есть
function framing(id){
  const p = P[id], v = p.av && D.photos[p.av]; if (!v || !v.faces) return "";
  const f = v.faces.find(f => f[4] === id); if (!f) return "";
  const [x, y, w, h] = f, r = ratio("t/" + p.av), cx = (x + w / 2) * 100, cy = (y + h / 2) * 100;
  const frac = r < .8 ? w : w * r / .8, s = Math.min(1.9, Math.max(1, .72 / frac));
  return `style="object-position:${cx.toFixed(1)}% ${cy.toFixed(1)}%;transform-origin:${cx.toFixed(1)}% ${cy.toFixed(1)}%;--s:${s.toFixed(2)}"`;
}
function portrait(id, {tag = "button", big = false} = {}){
  const p = P[id], a = avatar(id);
  const inner = a ? `<img src="${big && a.k ? a.src : a.th}" alt="${esc(p.name)}" loading="${big ? "eager" : "lazy"}" decoding="async" ${framing(id)} onload="this.classList.add('ok')">`
                  : `<span class="ini" aria-hidden="true"><span>${esc(initials(p.name))}</span></span>`;
  return tag === "button" ? `<button class="portrait" type="button" data-open="${id}" aria-label="Открыть: ${esc(p.name)}">${inner}</button>`
                          : `<${tag} class="portrait">${inner}</${tag}>`;
}
const stHTML = id => `<span class="st st-${P[id].st}">${esc(ST[P[id].st])}</span>`;

/* ── главы ── */
const L = F.LAYOUT, SIB = F.SIBLINGS || {};
const ORD = ["первая", "вторая", "третья", "четвёртая", "пятая", "шестая"], ROM = ["I", "II", "III", "IV", "V", "VI"];
const CH = [
  {t: "Прапрадеды", p: "Самое старшее поколение, известное по именам."},
  {t: "Прадеды", p: "Поколение прадедушек и прабабушек — по обеим линиям."},
  {t: "Бабушки и дедушки", p: "Бабушки и дедушки, а рядом — их братья и сёстры."},
  {t: "Родители", p: "Папа и мама, их братья и сёстры."},
  {t: "Мы", p: "Здесь две линии сходятся."},
];
const isKin = id => /^(Сестр|Сёстр|Брат|Тётя|Дядя|Муж тёти)/.test(P[id]?.rl || "");
const chapterOf = {};
const KIN = [];  // {key, title, sub, ids, gen, side}
function buildChapters(){
  const chapters = [];
  for (let g = 0; g < 4; g++) {
    const ch = {i: g, ...CH[g], father: {groups: (L.father.gens[g] || []), kin: []}, mother: {groups: (L.mother.gens[g] || []), kin: []}};
    for (const side of ["father", "mother"]) {
      const kin = [];
      ch[side].groups = ch[side].groups.filter(gr => { if (gr.ids.every(isKin)) { kin.push(...gr.ids); return false; } return true; });
      if (kin.length) ch[side].kin.push({key: `kin-${side}-${g}`, title: side === "mother" ? "Сёстры и брат мамы" : "Родные", nav: "Сёстры, брат", ids: kin});
    }
    if (g === 2 && SIB.sukhov?.length) ch.father.kin.push({key: "kin-sukhov", title: "Суховы", sub: "тёти и дяди папы", nav: "Суховы · " + SIB.sukhov.length, ids: SIB.sukhov});
    if (g === 3 && SIB.father?.length) ch.father.kin.push({key: "kin-father", title: "Сёстры и брат папы", nav: "Сёстры, брат", ids: SIB.father});
    chapters.push(ch);
  }
  chapters.push({i: 4, ...CH[4], me: F.ME || []});
  chapters.forEach(ch => {
    const all = [];
    for (const side of ["father", "mother"]) if (ch[side]) { ch[side].groups.forEach(gr => all.push(...gr.ids)); ch[side].kin.forEach(k => { all.push(...k.ids); KIN.push({...k, gen: ch.i, side}); }); }
    (ch.me || []).forEach(id => all.push(id));
    all.forEach(id => chapterOf[id] = ch.i);
  });
  return chapters;
}

function spread(id){
  const p = P[id], f = p.facts || [], n = albumOf(id).length, extra = f.length - 3;
  const bits = [extra > 0 ? `ещё ${plural(extra, "факт", "факта", "фактов")}` : "", p.src ? "источник" : "", p.story ? "статья" : "", n ? plural(n, "фото", "фото", "фото") : ""].filter(Boolean);
  return `<article class="spread" id="p-${id}" data-pid="${id}">
    ${portrait(id)}
    <div class="sp-text">
      ${p.rl ? `<div class="sp-role">${esc(p.rl)}</div>` : ""}
      <h3 class="sp-name"><button type="button" data-open="${id}">${esc(p.name)}</button></h3>
      ${p.yr ? `<div class="sp-yr">${esc(p.yr)}</div>` : ""}
      ${stHTML(id)}
    </div>
    ${f.length ? `<ul class="sp-facts">${f.slice(0, 3).map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    <button class="more" type="button" data-open="${id}">${p.story ? "Читать статью и всё о нём" : "Подробнее"} ${ICON.arrow}${bits.length ? `<small>${bits.join(" · ")}</small>` : ""}</button>
  </article>`;
}
function kinItem(id, note = ""){
  const p = P[id];
  return `<button class="kp" type="button" data-open="${id}" data-kid="${id}">${portrait(id, {tag: "span"})}<span><b>${esc(p.name)}</b><small>${esc([p.rl, p.yr].filter(Boolean).join(" · "))}${note}</small></span></button>`;
}
function famHead(gr){
  if (!gr.joins || gr.ids.length < 2) return "";
  return `<div class="fam-h" style="grid-column:1/-1">` + gr.ids.map((id, i) => (i ? `<i>${esc(gr.joins[i - 1] || "")}</i>` : "") + `<b>${esc(two(P[id].name))}</b>`).join("") + `</div>`;
}
function lineHTML(ch, side){
  const s = ch[side]; if (!s.groups.length && !s.kin.length) return "";
  const meta = L[side];
  let h = `<section class="line"><div class="line-h"><span class="kicker">${esc(meta.title)}</span><span>${esc(meta.sub)}</span></div>`;
  if (s.groups.length) h += `<div class="spreads">` + s.groups.map(gr => famHead(gr) + gr.ids.map(spread).join("")).join("") + `</div>`;
  for (const k of s.kin) h += `<div id="${k.key}" data-kin="${k.key}" style="scroll-margin-top:24px"><div class="kin-h" style="margin-top:${s.groups.length ? "clamp(36px,5vw,64px)" : "0"}"><b>${esc(k.title)}</b>${k.sub ? `<span class="kicker">${esc(k.sub)}</span>` : ""}</div><div class="kin">${k.ids.filter(id => P[id]).map(id => kinItem(id)).join("")}</div></div>`;
  return h + `</section>`;
}
function chapterHTML(ch){
  const head = `<header class="ch-head"><div class="ch-num"><b>${ROM[ch.i]}</b><span class="kicker">Глава ${ORD[ch.i]}</span></div><h2>${esc(ch.t)}</h2><p>${esc(ch.p)}</p></header>`;
  if (ch.me) return `<section class="chapter finale" id="ch-${ch.i + 1}" data-ch="${ch.i}">${head}<div class="spreads">${ch.me.map(spread).join("")}</div></section>`;
  return `<section class="chapter" id="ch-${ch.i + 1}" data-ch="${ch.i}">${head}${lineHTML(ch, "father")}${lineHTML(ch, "mother")}</section>`;
}

/* ── архив ── */
const visible = D.order.filter(k => D.photos[k] && !D.photos[k].hide);
const inAlbum = a => visible.filter(k => D.photos[k].a === a);
const SZ = window.DSIZE || {};
function archiveHTML(){
  const usedSz = [];
  const cards = D.albums.map(a => {
    const ks = inAlbum(a.id); if (!ks.length) return "";
    // обложка: первый кадр крупно, ещё два — из середины и конца альбома
    // одинаковые картинки на обложки не берём — ни внутри альбома, ни между альбомами
    const n = ks.length, cand = [...new Set([ks[0], ks[Math.floor(n / 3)], ks[Math.floor(2 * n / 3)], ...ks])], cov = [];
    // «тот же снимок» = те же пропорции и размер файла в пределах 2 % (пересохранённые копии отличаются на байты)
    const same = k => SZ[k] && usedSz.some(([z, r]) => Math.abs(z - SZ[k]) / z < .02 && Math.abs(r - ratio("t/" + k)) < .01);
    for (const k of cand) { if (same(k)) continue; cov.push(k); if (SZ[k]) usedSz.push([SZ[k], ratio("t/" + k)]); if (cov.length === 3) break; }
    for (const k of ks) { if (cov.length >= 3) break; if (!cov.includes(k)) cov.push(k); }
    return `<button class="alb" type="button" data-album="${a.id}"><span class="alb-cov">${cov.map(k => `<span><img src="${T(k)}" alt="" loading="lazy" decoding="async"></span>`).join("")}</span>
      <span class="alb-t">${esc(a.title)}</span><span class="alb-n">${plural(ks.length, "фотография", "фотографии", "фотографий")}</span></button>`;
  }).join("");
  return `<section class="chapter" id="ch-6" data-ch="5"><header class="ch-head"><div class="ch-num"><b>${ROM[5]}</b><span class="kicker">Глава ${ORD[5]}</span></div><h2>Архив</h2><p>Семейные фотографии, собранные в альбомы.</p></header><div class="albums">${cards}</div></section>`;
}

/* ── оглавление-схема ── */
function tocHTML(chapters){
  const pi = id => `<button class="tn-p" type="button" data-go="p-${id}" data-nav="${id}">${esc(first(P[id].name))}</button>`;
  const ki = k => `<button class="tn-p grp" type="button" data-go="${k.key}" data-nav="${k.key}">${esc(k.nav || k.title)}</button>`;
  let h = `<p class="tn-h">Оглавление</p><div class="tn-lines"><span>Линия папы</span><span>Линия мамы</span></div>`;
  for (const ch of chapters) {
    h += `<div class="tn-ch"><button type="button" data-go="ch-${ch.i + 1}" data-navch="${ch.i}"><b>${ROM[ch.i]}</b><span>${esc(ch.t)}</span></button>`;
    if (ch.me) h += `<div class="tn-gen solo"><div class="tn-col">${ch.me.map(pi).join("")}</div></div>`;
    else h += `<div class="tn-gen">` + ["father", "mother"].map(s => { const ids = ch[s].groups.flatMap(g => g.ids); const items = ids.map(pi).join("") + ch[s].kin.map(ki).join(""); return `<div class="tn-col${items ? "" : " empty"}">${items || `<span class="tn-none">пока неизвестны</span>`}</div>`; }).join("") + `</div>`;
    h += `</div>`;
  }
  h += `<div class="tn-ch"><button type="button" data-go="ch-6" data-navch="5"><b>${ROM[5]}</b><span>Архив</span></button></div>`;
  h += `<div class="tn-foot"><button class="theme" type="button" data-theme-toggle></button></div>`;
  return h;
}

/* ── схема-сходимость на первом экране ── */
const conv = $("#conv");
function drawConv(){
  const W = conv.clientWidth, H = conv.clientHeight; if (!W || !H) return;
  const fam = L.father.sub.split(" · "), mom = L.mother.sub.split(" · "), names = [...fam, ...mom];
  const wide = W >= 560, n = names.length;
  const xs = names.map((_, i) => W * (.1 + .8 * i / (n - 1)));
  const ys = names.map((_, i) => wide ? 14 : (i % 2 ? 46 : 14));
  const my = H * (wide ? .44 : .45), ny = H * .6, cy = H * (wide ? .83 : .8), cx = W / 2;
  const Fm = {x: W * .24, y: my}, Mm = {x: W * .73, y: my};
  const Fn = {x: Fm.x, y: ny}, Mn = {x: Mm.x, y: ny};
  const cur = (a, b, k1 = .55, k2 = .45) => `M${a.x},${a.y} C${a.x},${a.y + (b.y - a.y) * k1} ${b.x},${b.y - (b.y - a.y) * k2} ${b.x},${b.y}`;
  let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
  names.forEach((nm, i) => {
    const to = i < fam.length ? Fm : Mm, st = {x: xs[i], y: ys[i] + 10};
    s += `<path class="strand draw" pathLength="1" style="--d:${(.15 + i * .12).toFixed(2)}s;--dur:1.5s" d="${cur(st, to)}"/>`;
    s += `<text class="lbl fade" style="--d:${(.05 + i * .12).toFixed(2)}s" x="${xs[i]}" y="${ys[i]}" text-anchor="middle">${esc(nm)}</text>`;
  });
  s += `<path class="trunk draw" pathLength="1" style="--d:1.45s;--dur:.6s" d="M${Fm.x},${Fm.y} L${Fn.x},${Fn.y}"/>`;
  s += `<path class="trunk draw" pathLength="1" style="--d:1.55s;--dur:.6s" d="M${Mm.x},${Mm.y} L${Mn.x},${Mn.y}"/>`;
  s += `<path class="final draw" pathLength="1" style="--d:2s;--dur:1.2s" d="${cur(Fn, {x: cx, y: cy}, .6, .55)}"/>`;
  s += `<path class="final draw" pathLength="1" style="--d:2.05s;--dur:1.2s" d="${cur(Mn, {x: cx, y: cy}, .6, .55)}"/>`;
  const node = (pt, id, sub, side) => {
    const tx = side === "l" ? pt.x - 14 : pt.x + 14, an = side === "l" ? "end" : "start";
    return `<a href="#p=${id}" data-open="${id}" tabindex="-1" class="fade" style="--d:1.9s" aria-label="${esc(P[id].name)}"><circle class="dot" cx="${pt.x}" cy="${pt.y}" r="4.5"/>
      <text class="nsub" x="${tx}" y="${pt.y - 9}" text-anchor="${an}">${esc(sub)}</text><text class="nlbl" x="${tx}" y="${pt.y + 13}" text-anchor="${an}">${esc(first(P[id].name))}</text></a>`;
  };
  const dad = (F.EDGES.find(e => e[0] === F.ME[0] && chapterOf[e[1]] === 3 && L.father.gens[3].some(g => g.ids.includes(e[1]))) || [])[1] || "evgeny";
  const mum = (F.EDGES.find(e => e[0] === F.ME[0] && e[1] !== dad) || [])[1] || "irina";
  s += node(Fn, dad, P[dad].rl || "", "l") + node(Mn, mum, P[mum].rl || "", "r");
  s += `<a href="#ch-5" data-go="ch-5" tabindex="-1" class="fade" style="--d:2.9s"><circle class="dot big" cx="${cx}" cy="${cy}" r="5.5"/>
    <text class="fin" x="${cx}" y="${cy + (wide ? 48 : 40)}" text-anchor="middle">${esc(F.ME.map(id => first(P[id].name)).join(" и "))}</text></a>`;
  conv.innerHTML = s + `</svg>`;
  // подписи не вылезают за край
  $$("text.lbl,text.fin", conv).forEach(t => { const b = t.getBBox(); const x = +t.getAttribute("x"); if (b.x < 0) t.setAttribute("x", x - b.x); else if (b.x + b.width > W) t.setAttribute("x", x - (b.x + b.width - W)); });
}

/* ── сборка страницы ── */
const chapters = buildChapters();
$("#book").innerHTML = chapters.map(chapterHTML).join("") + archiveHTML() +
  `<footer class="colophon"><div><b>Наша семья</b>Родословная по линиям папы и мамы. Тексты — из документов, семейных записей и рассказов; у каждого человека отмечено, на чём основан рассказ.</div>
   <div><b>Как читать</b>${["doc", "fam", "hyp"].map(k => `<div style="margin:4px 0">${`<span class="st st-${k}">${esc(ST[k])}</span>`}</div>`).join("")}</div></footer>`;
$("#toc").innerHTML = tocHTML(chapters);
$("#toc2").innerHTML = tocHTML(chapters).replace('<p class="tn-h">Оглавление</p>', "");
$("#stats").textContent = [plural(Object.keys(P).length, "человек", "человека", "человек"), plural(visible.length, "фотография", "фотографии", "фотографий"), plural(D.albums.length, "альбом", "альбома", "альбомов")].join(" · ");
$("#legend").innerHTML = ["doc", "fam", "hyp"].map(k => `<span class="st st-${k}">${esc(ST[k])}</span>`).join("");
drawConv();
let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { conv.classList.add("done"); drawConv(); if (viewer.open) vshow(vi, true); }, 150); });
setTimeout(() => conv.classList.add("done"), 4500);

/* ── тема ── */
function isDark(){ const t = document.documentElement.dataset.theme; return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
function paintTheme(){ $$("[data-theme-toggle]").forEach(b => { b.innerHTML = (isDark() ? ICON.sun + "Светлая тема" : ICON.moon + "Тёмная тема"); }); }
document.addEventListener("click", e => { const b = e.target.closest("[data-theme-toggle]"); if (!b) return;
  const t = isDark() ? "light" : "dark"; document.documentElement.dataset.theme = t; try { localStorage.setItem("v1-theme", t); } catch (_) {} paintTheme(); });
paintTheme();

/* ── листы и история ── */
const stack = [];
const html = document.documentElement;
function openDlg(d, hash){
  if (!d.open) { d.showModal(); html.classList.add("lock"); requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("in"))); }
  const pushed = !!hash;
  if (hash) history.pushState({dlg: d.id}, "", hash);
  stack.push({d, pushed});
}
function reallyClose(entry){
  const i = stack.lastIndexOf(entry); if (i < 0) return; stack.splice(i, 1);
  const d = entry.d;
  if (stack.some(e => e.d === d)) return;
  d.classList.remove("in"); d.style.removeProperty("--drag");
  setTimeout(() => { if (!d.classList.contains("in")) d.close(); if (!stack.length) html.classList.remove("lock"); }, 320);
}
function closeTop(){
  const top = stack[stack.length - 1]; if (!top) return;
  if (top.pushed) history.back(); else { reallyClose(top); if (!stack.length && location.hash.match(/^#(p|album|photo)=/)) history.replaceState(null, "", location.pathname + location.search); }
}
addEventListener("popstate", () => { const top = stack[stack.length - 1]; if (top && top.pushed) reallyClose(top); });
$$("dialog").forEach(d => {
  d.addEventListener("cancel", e => { e.preventDefault(); closeTop(); });
  d.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeTop(); else if (e.target === d && !d.classList.contains("viewer")) closeTop(); });
});
// перетаскивание листа вниз на телефоне
$$(".sheet").forEach(d => {
  const bar = $(".sheet-bar", d), inn = $(".sheet-in", d); let y0 = null, dy = 0;
  bar.addEventListener("pointerdown", e => { if (innerWidth >= 900 || e.target.closest("button")) return; y0 = e.clientY; dy = 0; d.classList.add("dragging"); bar.setPointerCapture(e.pointerId); });
  bar.addEventListener("pointermove", e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); d.style.setProperty("--drag", dy + "px"); });
  const end = () => { if (y0 == null) return; y0 = null; d.classList.remove("dragging"); if (dy > 110) closeTop(); else d.style.setProperty("--drag", "0px"); };
  bar.addEventListener("pointerup", end); bar.addEventListener("pointercancel", end);
  inn.addEventListener("scroll", () => bar.classList.toggle("sc", inn.scrollTop > 4), {passive: true});
});

const sheet = $("#sheet"), sheetIn = $("#sheet-in"), sheetBody = $("#sheet-body"), sheetKicker = $("#sheet-kicker");
function relatives(id){
  const E = F.EDGES, groups = [];
  const par = E.filter(e => e[0] === id).map(e => [e[1], e[2]]);
  const kids = E.filter(e => e[1] === id).map(e => [e[0], e[2]]);
  const sib = new Set(); par.forEach(([pp]) => E.filter(e => e[1] === pp && e[0] !== id).forEach(e => sib.add(e[0])));
  if (par.length) groups.push(["Родители", par]);
  if (sib.size) groups.push(["Братья и сёстры", [...sib].map(x => [x])]);
  if (kids.length) groups.push(["Дети", kids]);
  for (const k of KIN) if (k.ids.includes(id)) groups.push([k.title + (k.sub ? " — " + k.sub : ""), k.ids.filter(x => x !== id).map(x => [x])]);
  return groups.filter(g => g[1].length).map(([t, l]) => `<div class="rel-g"><h4>${esc(t)}</h4>${l.filter(([x]) => P[x]).map(([x, h]) => kinItem(x, h ? ` · <em>связь — предположение</em>` : "")).join("")}</div>`).join("");
}
function storyHTML(k){
  const s = F.STORIES?.[k]; if (!s) return "";
  const title = s.title.replace(/\s*—\s*читать целиком\s*$/i, "");
  const parts = s.parts.map(([h, ps], i) => {
    if (i === 0 && s.parts.length > 1) return `<aside class="art-note"><b>${esc(h)}</b>${ps.map(t => `<p>${esc(t)}</p>`).join("")}</aside>`;
    return `<h4>${esc(h)}</h4>` + ps.map((t, j) => `<p${j === 0 ? ' class="lead"' : ""}>${esc(t)}</p>`).join("");
  }).join("");
  return `<section class="article" aria-label="Статья"><div class="art-side"><span class="kicker">Статья</span><h3>${esc(title)}</h3><p>${esc(s.sub)}</p></div>
    <div class="art-body">${parts}<i class="art-end" aria-hidden="true"></i></div></section>`;
}
function justified(list, ctx){
  return `<div class="jg">` + list.map((it, i) => `<button class="ph" type="button" style="--r:${it.r}" data-v="${ctx}" data-i="${i}" aria-label="${esc(it.cap || "Фотография " + (i + 1))}"><img src="${it.th}" alt="${esc(it.cap)}" loading="lazy" decoding="async" onload="this.classList.add('ok')"></button>`).join("") + `<i class="fill"></i></div>`;
}
let ctxLists = {};
function openPerson(id, push = true){
  const p = P[id]; if (!p) return;
  const list = albumOf(id); ctxLists.person = list;
  const g = chapterOf[id];
  sheetKicker.textContent = g != null ? `Глава ${ROM[g]} · ${CH[g].t}` : (p.rl || "");
  sheetBody.innerHTML = `<div class="pp">
    <div class="pp-head">${list.length ? portrait(id, {tag: "span", big: true}).replace('<span class="portrait">', `<button class="portrait" type="button" data-v="person" data-i="0" aria-label="Открыть фото: ${esc(p.name)}">`).replace(/<\/span>$/, "</button>") : portrait(id, {tag: "span", big: true})}
      <div>${p.rl ? `<div class="sp-role">${esc(p.rl)}</div>` : ""}<h2 id="sheet-title">${esc(p.name)}</h2>${p.yr ? `<p class="pp-yr">${esc(p.yr)}</p>` : ""}
      <div class="pp-meta">${stHTML(id)}${list.length ? `<button class="more" type="button" data-scroll="pp-album" style="margin:0">Фотографии · ${list.length} ${ICON.arrow}</button>` : ""}${p.story ? `<button class="more" type="button" data-scroll="pp-article" style="margin:0">Статья ${ICON.arrow}</button>` : ""}</div></div>
    </div>
    <div class="pp-cols">
      <section><div class="sec-h"><h3>Что известно</h3><small>${plural((p.facts || []).length, "запись", "записи", "записей")}</small></div>
        <ol class="facts">${(p.facts || []).map(t => `<li><span>${esc(t)}</span></li>`).join("")}</ol>
        ${p.src ? `<div class="src"><b>Источник</b>${esc(p.src)}</div>` : ""}</section>
      <aside class="rel">${relatives(id)}</aside>
    </div>
    ${p.story ? `<div id="pp-article">${storyHTML(p.story)}</div>` : ""}
    ${list.length ? `<section class="album-sec" id="pp-album"><div class="sec-h"><h3>Фотографии</h3><small>${plural(list.length, "снимок", "снимка", "снимков")}</small></div>${justified(list, "person")}</section>` : ""}
  </div>`;
  sheetIn.scrollTop = 0;
  const hash = `#p=${id}`;
  if (sheet.open && stack.length && stack[stack.length - 1].d === sheet) { history.replaceState(history.state, "", stack[stack.length - 1].pushed ? hash : location.href); return; }
  openDlg(sheet, push ? hash : null);
}
function openAlbum(aid, push = true){
  const a = D.albums.find(x => x.id === aid); if (!a) return;
  const list = inAlbum(aid).map(photo); ctxLists.album = list; ctxLists.albumTitle = a.title;
  sheetKicker.textContent = `Глава ${ROM[5]} · Архив`;
  sheetBody.innerHTML = `<div class="pp alb-sheet"><div style="margin-bottom:clamp(24px,4vw,48px)"><span class="kicker">Альбом</span><h2 id="sheet-title">${esc(a.title)}</h2><span class="alb-n">${plural(list.length, "фотография", "фотографии", "фотографий")}</span></div>${justified(list, "album")}</div>`;
  sheetIn.scrollTop = 0;
  openDlg(sheet, push ? `#album=${aid}` : null);
}

/* ── просмотр фото ── */
const viewer = $("#viewer"), vbox = $("#v-box"), vcap = $("#v-cap"), vstrip = $("#v-strip"), vt = $("#v-t"), vfaces = $("#v-faces"), vstage = $("#v-stage");
let vl = [], vi = 0, facesOn = false, vtitle = "";
const whoLine = it => it.who.length > 1 ? "На фото: " + it.who.filter(w => P[w]).map(w => P[w].name).join(", ") : "";
function vfit(it){
  const cs = getComputedStyle(vstage), W = vstage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), H = vstage.clientHeight - 8;
  let w = W, h = W / it.r; if (h > H) { h = H; w = H * it.r; }
  return [Math.round(w), Math.round(h)];
}
function vshow(i, keep){
  vi = (i + vl.length) % vl.length; const it = vl[vi];
  const [w, h] = vfit(it);
  vbox.style.width = w + "px"; vbox.style.height = h + "px";
  if (!keep) {
    vbox.innerHTML = `<img class="lo" src="${it.th}" alt=""><img class="hi" src="${it.src}" alt="${esc(it.cap || whoLine(it) || "Фотография")}" decoding="async" onload="this.classList.add('ok')"><div class="faces"></div>`;
    [vl[vi + 1], vl[vi - 1]].forEach(n => { if (n) { const im = new Image(); im.decoding = "async"; im.src = n.src; } });
  }
  const fb = $(".faces", vbox);
  fb.innerHTML = facesOn ? it.faces.map(([x, y, fw, fh, pid]) => `<div class="face${x + fw / 2 > .78 ? " r" : x + fw / 2 < .22 ? " l" : ""}" style="left:${x * 100}%;top:${y * 100}%;width:${fw * 100}%;height:${fh * 100}%"><span>${esc(P[pid] ? first(P[pid].name) : pid)}</span></div>`).join("") : "";
  vfaces.hidden = !it.faces.length;
  vfaces.setAttribute("aria-pressed", facesOn && it.faces.length ? "true" : "false");
  vt.innerHTML = `<b>${vi + 1} / ${vl.length}</b>${esc(vtitle)}`;
  $$(".on", vcap).forEach(x => x.classList.remove("on")); vcap.children[vi]?.classList.add("on");
  $$("button", vstrip).forEach((b, j) => b.classList.toggle("on", j === vi));
  const on = vstrip.children[vi];
  if (on) vstrip.scrollTo({left: on.offsetLeft - (vstrip.clientWidth - on.offsetWidth) / 2, behavior: keep ? "auto" : "smooth"});
}
function openViewer(list, i, title){
  vl = list; vtitle = title || ""; facesOn = false;
  // все подписи в одной ячейке сетки: высота блока = самой длинной подписи, ничего не прыгает
  vcap.innerHTML = list.map(it => { const c = it.cap, w = whoLine(it); return `<div>${esc(c)}${w ? `<small>${esc(w)}</small>` : ""}</div>`; }).join("");
  vstrip.innerHTML = list.map((it, j) => `<button type="button" data-j="${j}" aria-label="Фото ${j + 1}"><img src="${it.th}" alt="" loading="lazy" decoding="async"></button>`).join("");
  vstrip.style.display = list.length > 1 ? "" : "none";
  $("#v-prev").hidden = $("#v-next").hidden = list.length < 2;
  if (!viewer.open) openDlg(viewer, location.hash || "#");
  requestAnimationFrame(() => vshow(i));
}
vstrip.addEventListener("click", e => { const b = e.target.closest("[data-j]"); if (b) vshow(+b.dataset.j); });
$("#v-prev").onclick = () => vshow(vi - 1); $("#v-next").onclick = () => vshow(vi + 1);
vfaces.onclick = () => { facesOn = !facesOn; vshow(vi, true); };
addEventListener("keydown", e => { if (!viewer.open || stack[stack.length - 1]?.d !== viewer) return;
  if (e.key === "ArrowRight") vshow(vi + 1); else if (e.key === "ArrowLeft") vshow(vi - 1); });
{ let x0 = null, y0 = 0, dx = 0;
  vstage.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; x0 = e.clientX; y0 = e.clientY; dx = 0; });
  vstage.addEventListener("pointermove", e => { if (x0 == null) return; dx = e.clientX - x0; if (Math.abs(dx) > Math.abs(e.clientY - y0)) vbox.style.transform = `translateX(${dx * .6}px)`; });
  const up = () => { if (x0 == null) return; x0 = null; vbox.style.transform = ""; if (Math.abs(dx) > 50 && vl.length > 1) vshow(vi + (dx < 0 ? 1 : -1)); };
  vstage.addEventListener("pointerup", up); vstage.addEventListener("pointercancel", up); vstage.addEventListener("pointerleave", up);
}

/* ── клики ── */
function go(id){
  const el = document.getElementById(id); if (!el) return;
  const tocOpen = stack.find(e => e.d.id === "tocsheet");
  const doScroll = () => el.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"});
  if (tocOpen) { closeTop(); setTimeout(doScroll, 340); } else doScroll();
}
document.addEventListener("click", e => {
  const t = e.target;
  const v = t.closest("[data-v]"); if (v) { e.preventDefault(); const ctx = v.dataset.v; openViewer(ctxLists[ctx], +v.dataset.i, ctx === "album" ? ctxLists.albumTitle : (P[location.hash.slice(3)]?.name || "")); return; }
  const o = t.closest("[data-open]"); if (o) { e.preventDefault(); const tocOpen = stack.find(x => x.d.id === "tocsheet"); if (tocOpen) closeTop(); setTimeout(() => openPerson(o.dataset.open), tocOpen ? 340 : 0); return; }
  const a = t.closest("[data-album]"); if (a) { openAlbum(a.dataset.album); return; }
  const g = t.closest("[data-go]"); if (g) { e.preventDefault(); go(g.dataset.go); return; }
  const sc = t.closest("[data-scroll]"); if (sc) { const el = document.getElementById(sc.dataset.scroll); el && sheetIn.scrollTo({top: el.offsetTop - 70, behavior: "smooth"}); return; }
});
$("#begin").addEventListener("click", e => { e.preventDefault(); go("ch-1"); });
$("#tocbtn").addEventListener("click", () => openDlg($("#tocsheet"), "#toc"));

/* ── подсветка текущего в оглавлении ── */
const tocbtn = $("#tocbtn"), tocnow = $("#tocnow");
new IntersectionObserver(([en]) => tocbtn.classList.toggle("show", !en.isIntersecting), {rootMargin: "0px 0px -40% 0px"}).observe($("#top"));
let cur = null;
const mark = key => {
  if (cur === key) return; cur = key;
  $$(".tn-p").forEach(b => b.classList.toggle("on", b.dataset.nav === key));
  const b = $(`#toc .tn-p[data-nav="${key}"]`), box = $(".toc");
  if (b && box && box.offsetParent) { const r = b.getBoundingClientRect(), rb = box.getBoundingClientRect(); if (r.top < rb.top + 40 || r.bottom > rb.bottom - 40) box.scrollTo({top: box.scrollTop + r.top - rb.top - rb.height / 2, behavior: "smooth"}); }
};
const io = new IntersectionObserver(ens => { for (const en of ens) if (en.isIntersecting) mark(en.target.dataset.pid || en.target.dataset.kin); }, {rootMargin: "-40% 0px -55% 0px"});
$$("[data-pid],[data-kin]").forEach(el => io.observe(el));
const io2 = new IntersectionObserver(ens => { for (const en of ens) if (en.isIntersecting) { const i = +en.target.dataset.ch; tocnow.textContent = "· " + (i === 5 ? "Архив" : CH[i].t); if (i === 5) mark("archive"); } }, {rootMargin: "-45% 0px -50% 0px"});
$$("[data-ch]").forEach(el => io2.observe(el));

/* ── прямые ссылки: #p=evgeny · #album=a1 · #photo=clan ── */
function route(){
  const m = location.hash.match(/^#(p|album|photo)=([\w-]+)/); if (!m) return;
  if (m[1] === "p") openPerson(m[2], false);
  else if (m[1] === "album") openAlbum(m[2], false);
  else if (D.photos[m[2]]) { const a = D.photos[m[2]].a, l = (D.photos[m[2]].hide ? [m[2]] : inAlbum(a)).map(photo); openViewer(l, Math.max(0, l.findIndex(x => x.k === m[2])), D.albums.find(x => x.id === a)?.title); stack[stack.length - 1].pushed = false; }
}
route();
window.__v1 = {openPerson, openAlbum, openViewer, albumOf, photo, inAlbum};
})();
