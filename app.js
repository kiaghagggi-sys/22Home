/* ───────── ابزارهای کمکی ───────── */
const $ = (s, el = document) => el.querySelector(s);
const C = window.SITE_CONFIG;
const fa = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const num = v => Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0;
const money = v => {
  const n = num(v);
  if (!n) return "—";
  if (n >= 1e9) return fa((n / 1e9).toFixed(n % 1e9 ? 2 : 0).replace(/\.?0+$/, "")) + " میلیارد";
  if (n >= 1e6) return fa(Math.round(n / 1e6).toLocaleString("en")) + " میلیون";
  return fa(n.toLocaleString("en"));
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ───────── CSV parser (با پشتیبانی از نقل‌قول) ───────── */
function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], nx = text[i + 1];
    if (q) {
      if (ch === '"' && nx === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && nx === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map(h => h.trim());
  return rows.filter(r => r.some(c => c.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}
async function loadCSV(url, fallback) {
  try {
    if (url) { const r = await fetch(url + (url.includes("?") ? "&" : "?") + "t=" + Date.now()); if (r.ok) return parseCSV(await r.text()); }
  } catch (e) { console.warn("sheet fetch failed, using fallback", e); }
  const r = await fetch(fallback); return parseCSV(await r.text());
}

/* ───────── وضعیت ───────── */
const S = { projects: [], payments: [], q: "", type: null, region: null, status: null, sort: "updated" };

/* ───────── SVG هنری کارت ───────── */
function skyline(p, big = false) {
  const seed = [...(p.id || p.name)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const floors = Math.min(num(p.floors) || 8, 40);
  const h = big ? 170 : 110, w = 400;
  const n = 7; let x = 20, out = "";
  for (let i = 0; i < n; i++) {
    const bw = 30 + ((seed * (i + 3)) % 30);
    const bh = 20 + ((seed * (i + 7)) % (h - 50));
    const main = i === 3;
    const mh = main ? Math.min(h - 20, 30 + floors * 3.5) : bh;
    out += `<rect class="${main ? "bar" : "sk"}" x="${x}" y="${h - mh}" width="${main ? 48 : bw}" height="${mh}" rx="2" style="transform-origin:${x}px ${h}px;animation:rise .9s cubic-bezier(.2,.8,.2,1) both;animation-delay:${i * 0.08}s"/>`;
    x += (main ? 48 : bw) + 12;
  }
  const prog = num(p.progress);
  const crane = prog < 100 ? `<g style="transform-origin:${w - 60}px ${h}px"><rect x="${w - 62}" y="${h - 90}" width="4" height="90" fill="#e8a020"/><rect x="${w - 110}" y="${h - 92}" width="70" height="3" fill="#e8a020" style="transform-origin:${w - 60}px ${h - 90}px;animation:swing 10s ease-in-out infinite"/></g>` : "";
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax meet">${out}${crane}</svg>`;
}
const statusClass = s => /تحویل/.test(s) ? "ok" : /پیش/.test(s) ? "warn" : "";

/* ───────── رندر لیست ───────── */
function filtered() {
  const q = S.q.trim().toLowerCase();
  let list = S.projects.filter(p =>
    (!S.type || p.type === S.type) && (!S.region || p.region === S.region) && (!S.status || p.status === S.status) &&
    (!q || [p.name, p.district, p.region, p.developer, p.address, p.description, p.amenities].join(" ").toLowerCase().includes(q))
  );
  const by = {
    "updated": (a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""),
    "price-asc": (a, b) => num(a.price_per_meter) - num(b.price_per_meter),
    "price-desc": (a, b) => num(b.price_per_meter) - num(a.price_per_meter),
    "progress": (a, b) => num(b.progress) - num(a.progress),
    "delivery": (a, b) => (a.delivery || "").localeCompare(b.delivery || ""),
  };
  return list.sort(by[S.sort]);
}
function renderChips(id, key) {
  const vals = [...new Set(S.projects.map(p => p[key]).filter(Boolean))];
  $("#" + id).innerHTML = vals.map(v => `<button class="chip ${S[key] === v ? "on" : ""}" data-v="${esc(v)}">${esc(v)}</button>`).join("");
  $("#" + id).onclick = e => { const b = e.target.closest(".chip"); if (!b) return; S[key] = S[key] === b.dataset.v ? null : b.dataset.v; renderChips(id, key); renderGrid(); };
}
function renderGrid() {
  const list = filtered();
  $("#count").textContent = list.length ? `${fa(list.length)} پروژه` : "";
  $("#grid").innerHTML = list.length ? list.map((p, i) => `
    <a class="card" href="#p/${esc(p.id)}" style="animation-delay:${i * 0.05}s">
      <div class="card-art">${skyline(p)}</div>
      <div class="card-body">
        <div class="card-head"><h3>${esc(p.name)}</h3><span class="tag ${statusClass(p.status)}">${esc(p.status)}</span></div>
        <div class="loc">${esc(p.region)} · ${esc(p.district)} · ${esc(p.type)}</div>
        <div class="kv">
          <div><span>قیمت هر متر</span>${money(p.price_per_meter)} تومان</div>
          <div><span>تحویل</span>${fa(p.delivery || "—")}</div>
          <div><span>متراژ</span>${fa(p.area_min)} تا ${fa(p.area_max)} متر</div>
          <div><span>آخرین واریزی</span>${fa(p.last_payment_date || "—")}</div>
        </div>
        <div class="prog"><div class="bar-bg"><div class="bar-fg" data-w="${num(p.progress)}"></div></div>
        <div class="txt"><span>پیشرفت فیزیکی</span><span>${fa(num(p.progress))}٪</span></div></div>
      </div>
    </a>`).join("") : `<div class="empty">پروژه‌ای با این مشخصات پیدا نشد.</div>`;
  requestAnimationFrame(() => setTimeout(() => document.querySelectorAll(".bar-fg").forEach(b => b.style.width = b.dataset.w + "%"), 50));
}
function renderStats() {
  const ps = S.projects;
  const regions = new Set(ps.map(p => p.region)).size;
  const units = ps.reduce((a, p) => a + num(p.units), 0);
  const items = [["پروژه", ps.length], ["منطقه", regions], ["واحد", units.toLocaleString("en")]];
  $("#hero-stats").innerHTML = items.map(([l, v], i) => `<div class="stat" style="animation-delay:${.3 + i * .12}s"><b>${fa(v)}</b>${l}</div>`).join("");
}

/* ───────── صفحهٔ جزئیات ───────── */
const I = {
  info: `<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/><path d="M9 10h.01M15 10h.01M9 13h.01M15 13h.01"/></svg>`,
  home: `<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`,
  money: `<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>`,
  contract: `<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>`,
};
function renderDetail(id) {
  const p = S.projects.find(x => x.id === id);
  if (!p) { location.hash = ""; return; }
  const pays = S.payments.filter(x => x.project_id === id);
  let nextMarked = false;
  const payRows = pays.map(x => {
    const done = /شده|پرداخت شد|paid/i.test(x.status);
    let cls = done ? "done" : (!nextMarked ? (nextMarked = true, "next") : "");
    return `<div class="pay ${cls}"><div><b>${esc(x.title)}</b><span class="dt">${fa(x.due_date)}</span></div><div style="text-align:left"><b>${money(x.amount)}</b><span class="st" style="display:block">${esc(x.status)}</span></div></div>`;
  }).join("");
  const amen = (p.amenities || "").split(/[;،|]/).map(s => s.trim()).filter(Boolean);
  const row = (k, v) => v && v !== "—" ? `<div class="row"><span>${k}</span><b>${v}</b></div>` : "";
  const shareText = `${p.name} — ${p.region}، ${p.district}\nقیمت هر متر: ${money(p.price_per_meter)} تومان\n${location.href}`;

  $("#detail").innerHTML = `
    <a class="back-btn" href="#">→ بازگشت به لیست</a>
    <div class="d-head">
      <div><h1>${esc(p.name)}</h1><div class="loc">${esc(p.region)} · ${esc(p.district)}${p.address ? " · " + esc(p.address) : ""}</div></div>
      <div class="d-tags"><span class="tag">${esc(p.type)}</span><span class="tag ${statusClass(p.status)}">${esc(p.status)}</span></div>
    </div>
    ${p.description ? `<p class="d-desc">${esc(p.description)}</p>` : ""}
    <div class="d-art">${skyline(p, true)}</div>
    <div class="secs">
      <div class="sec"><h2>${I.info} اطلاعات عمومی</h2>
        ${row("سازنده / کارفرما", esc(p.developer))}${row("تعداد طبقات", fa(p.floors))}${row("تعداد واحد", fa(p.units))}
        ${row("زمان تحویل", fa(p.delivery))}${row("پیشرفت فیزیکی", fa(num(p.progress)) + "٪")}
        <div class="prog"><div class="bar-bg"><div class="bar-fg" data-w="${num(p.progress)}"></div></div></div>
      </div>
      <div class="sec"><h2>${I.home} اطلاعات ملکی</h2>
        ${row("کاربری", esc(p.type))}${row("متراژ واحدها", `${fa(p.area_min)} تا ${fa(p.area_max)} متر`)}
        ${row("وضعیت", esc(p.status))}${row("منطقه", esc(p.region))}${row("محله", esc(p.district))}
      </div>
      <div class="sec"><h2>${I.star} امکانات</h2>
        ${amen.length ? `<ul class="amen">${amen.map(a => `<li>${esc(a)}</li>`).join("")}</ul>` : `<div class="note">ثبت نشده</div>`}
      </div>
      <div class="sec"><h2>${I.money} اطلاعات مالی</h2>
        <div class="big">${money(p.price_per_meter)} <small style="font-size:12px;font-weight:400;color:var(--mute)">تومان / متر</small></div>
        ${row("پیش‌پرداخت", money(p.down_payment) + (num(p.down_payment) ? " تومان" : ""))}
        ${row("تعداد اقساط", num(p.installment_count) ? fa(p.installment_count) + " قسط" : "—")}
        ${row("مبلغ هر قسط", money(p.installment_amount) + (num(p.installment_amount) ? " تومان" : ""))}
        ${row("آخرین واریزی", fa(p.last_payment_date))}
        ${p.last_payment_note ? `<div class="note">${esc(p.last_payment_note)}</div>` : ""}
      </div>
      ${pays.length ? `<div class="sec" style="grid-column:1/-1"><h2>${I.contract} جدول واریزی‌ها</h2><div class="pay-tl">${payRows}</div></div>` : ""}
    </div>
    <div class="share">
      <button class="btn primary" id="copy">کپی لینک پروژه</button>
      <a class="btn" target="_blank" rel="noopener" href="https://wa.me/${C.contactWhatsapp ? C.contactWhatsapp : ""}?text=${encodeURIComponent(shareText)}">ارسال در واتساپ</a>
      ${C.contactPhone ? `<a class="btn" href="tel:${C.contactPhone}">تماس</a>` : ""}
    </div>
    <div class="note" style="margin-top:14px">آخرین به‌روزرسانی اطلاعات: ${fa(p.updated_at || "—")}</div>`;
  $("#copy").onclick = () => navigator.clipboard.writeText(location.href).then(() => { $("#copy").textContent = "کپی شد ✓"; setTimeout(() => $("#copy").textContent = "کپی لینک پروژه", 1600); });
  requestAnimationFrame(() => setTimeout(() => document.querySelectorAll("#detail .bar-fg").forEach(b => b.style.width = b.dataset.w + "%"), 50));
}

/* ───────── مسیریابی ───────── */
function route() {
  const m = location.hash.match(/^#p\/(.+)$/);
  const isDetail = !!m;
  ["hero", "tools", "grid"].forEach(id => $("#" + id).hidden = isDetail);
  $("#detail").hidden = !isDetail;
  if (isDetail) { renderDetail(decodeURIComponent(m[1])); window.scrollTo({ top: 0 }); }
  document.title = isDetail ? `${S.projects.find(p => p.id === decodeURIComponent(m[1]))?.name || ""} — ${C.siteName}` : C.siteName;
}

/* ───────── شروع ───────── */
async function init() {
  document.querySelectorAll("[data-sitename]").forEach(e => e.textContent = C.siteName);
  $("#grid").innerHTML = `<div class="loader"><svg viewBox="0 0 60 50"><rect x="0" y="0" width="12" height="50"/><rect x="16" y="0" width="12" height="50"/><rect x="32" y="0" width="12" height="50"/><rect x="48" y="0" width="12" height="50"/></svg>در حال دریافت اطلاعات…</div>`;
  const [projects, payments] = await Promise.all([loadCSV(C.sheets.projects, C.fallback.projects), loadCSV(C.sheets.payments, C.fallback.payments)]);
  S.projects = projects.filter(p => p.id && p.name); S.payments = payments;
  const last = S.projects.map(p => p.updated_at).filter(Boolean).sort().pop();
  if (last) $("#last-updated").textContent = "به‌روزرسانی: " + fa(last);
  if (C.contactPhone) $("#foot-contact").textContent = "تماس: " + fa(C.contactPhone);
  renderStats(); renderChips("f-type", "type"); renderChips("f-region", "region"); renderChips("f-status", "status");
  $("#q").oninput = e => { S.q = e.target.value; renderGrid(); };
  $("#sort").onchange = e => { S.sort = e.target.value; renderGrid(); };
  renderGrid(); route();
}
window.addEventListener("hashchange", route);
init();
