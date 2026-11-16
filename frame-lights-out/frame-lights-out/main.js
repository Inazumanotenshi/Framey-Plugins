// Status Light: a toggle for the Steam Frame's side status LED.
// Adds a row to SteamVR's Quick Settings (next to Wi-Fi / Airplane mode) and a
// Framey tab as a fallback. The row is cloned from Valve's own toggle row so it
// picks up the native look without depending on hashed class names.
const ID = "frame-lights-out";
const LABEL = "Status light";
const MARK = "data-frame-lights-out";
const ICON =
  '<circle cx="18" cy="18" r="6.5" fill="currentColor"/>' +
  '<path fill="currentColor" d="M16.5 2h3v6h-3zM16.5 28h3v6h-3zM2 16.5h6v3H2zM28 16.5h6v3h-6z' +
  'M5.6 7.7l2.1-2.1 4.3 4.2-2.2 2.2zM24 26.1l2.2-2.1 4.2 4.3-2.1 2.1zM5.6 28.3l4.2-4.3 2.2 2.2-4.3 4.2zM24 9.9l4.3-4.3 2.1 2.1-4.2 4.3z"/>';

if (window.__frameLed) window.__frameLed.dispose();
const S = (window.__frameLed = { light: true, known: false, dead: false, misses: 0, docs: new Map(), tabBtn: null });
let onCls = [];
try { onCls = JSON.parse(localStorage.frameLedOnCls || "[]"); } catch (e) {}

const popups = () => {
  try {
    return window.opener.g_PopupManager.GetPopups().filter(p => /barpopup/.test(p.m_strName) && p.m_popup && !p.m_popup.closed).map(p => p.m_popup);
  } catch (e) { return []; }
};

const paint = () => {
  for (const doc of S.docs.keys()) {
    let row;
    try { row = doc.querySelector("[" + MARK + "]"); } catch (e) { continue; }
    if (!row) continue;
    const cb = row.querySelector("[role=checkbox]");
    cb.setAttribute("aria-checked", String(S.light));
    onCls.forEach(c => cb.classList.toggle(c, S.light));
    row.style.opacity = S.known ? "" : "0.5";
    const t = row.querySelector("[data-frame-lights-out-text]");
    if (t) t.textContent = LABEL + (onCls.length ? "" : S.light ? " (on)" : " (off)");
  }
  if (S.tabBtn && S.tabBtn.isConnected) {
    S.tabBtn.textContent = S.light ? "On" : "Off";
    S.tabBtn.style.background = S.light ? "#5585ff" : "#2a2a3a";
  }
};

const apply = r => {
  if (r && typeof r.light === "boolean") { S.light = r.light; S.known = true; }
  if (r && r.error) Framey.toast("Status light: " + r.error, 4000);
  paint();
};
const refresh = () => Framey.call(ID, "get").then(apply);
const toggle = () => {
  S.light = !S.light; // optimistic; the backend's answer corrects it
  paint();
  Framey.call(ID, "set", S.light).then(apply);
};

const mount = doc => {
  const panel = doc.querySelector('[role=tabpanel][class*="tab_Settings"]');
  if (!panel || panel.querySelector("[" + MARK + "]")) return;
  const boxes = [...panel.querySelectorAll("[role=checkbox]")];
  if (!boxes.length) return;
  // Learn which class Valve uses for "checked" from a native on/off pair.
  const on = boxes.find(b => b.getAttribute("aria-checked") === "true");
  const off = boxes.find(b => b.getAttribute("aria-checked") === "false");
  if (on && off) {
    onCls = [...on.classList].filter(c => !off.classList.contains(c));
    try { localStorage.frameLedOnCls = JSON.stringify(onCls); } catch (e) {}
  }
  // The row is the outermost ancestor of the last toggle that holds only its label.
  let row = boxes[boxes.length - 1];
  while (row.parentElement && row.parentElement !== panel && !row.textContent.trim()) row = row.parentElement;
  const label = row.textContent.trim();
  while (row.parentElement && row.parentElement !== panel && row.parentElement.textContent.trim() === label) row = row.parentElement;
  if (!label || row.querySelectorAll("[role=checkbox]").length !== 1) return;

  const mine = row.cloneNode(true);
  mine.setAttribute(MARK, "");
  mine.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));
  const cb = mine.querySelector("[role=checkbox]");
  cb.removeAttribute("aria-labelledby");
  cb.setAttribute("aria-label", LABEL);
  if (off) cb.className = off.className;
  const w = doc.createTreeWalker(mine, 4);
  const texts = [];
  for (let n; (n = w.nextNode()); ) if (n.textContent.trim()) texts.push(n);
  texts.forEach((n, i) => {
    if (i) return void (n.textContent = "");
    const span = doc.createElement("span");
    span.setAttribute("data-frame-lights-out-text", "");
    span.textContent = LABEL;
    n.replaceWith(span);
  });
  const svg = mine.querySelector("svg");
  if (svg) { svg.setAttribute("viewBox", "0 0 36 36"); svg.innerHTML = ICON; }
  mine.style.cursor = "pointer";
  mine.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggle(); }, true);

  const sep = row.parentElement.querySelector("[role=separator]");
  if (sep) {
    const s = sep.cloneNode(true);
    s.setAttribute(MARK + "-sep", "");
    row.after(s, mine);
  } else row.after(mine);
  paint();
  refresh();
};

const watch = () => {
  if (S.dead) return;
  // Framey re-runs this file on reload; if the plugin is disabled or removed it
  // does not, so notice that and clean up.
  const live = window.Framey && Framey.plugins.some(p => p.id === ID);
  S.misses = live ? 0 : S.misses + 1;
  if (S.misses > 3) return S.dispose();
  for (const [doc, obs] of S.docs) if (!doc.defaultView || doc.defaultView.closed) { obs.disconnect(); S.docs.delete(doc); }
  for (const win of popups()) {
    const doc = win.document;
    if (!doc || !doc.body) continue;
    if (!S.docs.has(doc)) {
      let pending = 0;
      const obs = new win.MutationObserver(() => {
        if (S.dead || pending) return;
        pending = win.setTimeout(() => { pending = 0; try { mount(doc); } catch (e) { console.warn("frame-lights-out", e); } }, 100);
      });
      obs.observe(doc.body, { childList: true, subtree: true });
      S.docs.set(doc, obs);
    }
    try { mount(doc); } catch (e) { console.warn("frame-lights-out", e); }
  }
};

S.timer = setInterval(watch, 1500);
S.dispose = () => {
  S.dead = true;
  clearInterval(S.timer);
  for (const [doc, obs] of S.docs) {
    obs.disconnect();
    try { doc.querySelectorAll("[" + MARK + "],[" + MARK + "-sep]").forEach(e => e.remove()); } catch (e) {}
  }
  S.docs.clear();
  if (window.__frameLed === S) delete window.__frameLed;
};

Framey.register({
  id: ID,
  render(box) {
    const row = Framey.el("display:flex;align-items:center;gap:12px;margin-bottom:14px");
    S.tabBtn = Framey.button("...", "width:110px;height:64px;font-size:22px", toggle);
    row.append(Framey.el("flex:1;font-size:22px", "Status light"), S.tabBtn);
    box.append(row, Framey.el("font-size:18px;color:#8a8aa0;line-height:1.4", "The LED on the side of the headset. This switch is also in Quick Settings, under Airplane mode. The setting is remembered across restarts."));
    paint();
    refresh();
  },
});
watch();
refresh();
