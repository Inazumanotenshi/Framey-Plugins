// Launch Arguments for Framey: tap together Steam launch options instead of typing them.
const ID = "launch-arguments";
const CODES = ["de", "en"];
const NAMES = { de: "Deutsch", en: "English" };

// Translations. Missing keys fall back to English. To add a language: add its code to
// CODES and NAMES above (and to LANGS in backend.py), then add a block here.
const LANGS = {
  en: {
    title: "Launch Arguments", games: "Games", changedTitle: "Changed by this plugin", shortcuts: "Non-Steam shortcuts",
    noGames: "No installed games found.", reload: "Reload", back: "‹ Back", loading: "Loading …", language: "Language",
    current: "Launch options", preview: "New launch options", empty: "(empty)", unsaved: "Not applied yet",
    apply: "Apply", applying: "Applying …", applied: "Launch options set.", discard: "Discard changes",
    clear: "Remove all", restore: "Restore original", restored: "Original launch options restored.",
    readOnly: "Steam's interface isn't reachable right now, so these were read from disk. Applying may fail.",
    extras: "Other parts", extrasHint: "Parts of the launch options that no building block knows. ✕ removes, ★ saves as building block.",
    custom: "My building blocks", customHint: "Available for every game. Tap to switch on or off for this game.",
    customNone: "No own building blocks yet.", addTitle: "New building block",
    addHint: "VARIABLE=value goes in front of %command%, everything else (like -arg or --flag=x) behind it. Several parts separated by spaces are fine.",
    valuePh: "e.g. MY_VAR=1 or -nolog", labelPh: "Name (optional)", add: "Save building block", added: "Building block saved.",
    del: "Delete", deleted: "Building block deleted.", edit: "Manage", done: "Done",
    typeTip: "Typing doesn't work here? Type it once into Steam's own launch options, open the game here again and tap ★ next to it. Or add it to ~/.config/framey/launch-arguments.json over SSH.",
    diag: "Check Steam interface", diagHint: "Shows whether launch options can be changed. Handy for bug reports.",
    failed: "Failed: ", appidLabel: "App ID",
    groups: { dll: "DLL overrides (mod loaders)", steam: "Steam", proton: "Proton & debugging", unity: "VR & Unity" },
    err: {
      no_steam: "Steam folder not found.", no_target: "Steam's main page isn't reachable (is Steam running?).",
      api_missing: "This Steam version can't change launch options from here.", timeout: "Timed out.",
      io: "File error.", bad_appid: "Invalid app ID.", bad_arg: "Invalid input.", too_many: "Too many building blocks.",
      no_backup: "No original saved.", generic: "Unknown error.",
    },
  },
  de: {
    title: "Launch Arguments", games: "Spiele", changedTitle: "Von diesem Plugin geändert", shortcuts: "Non-Steam-Verknüpfungen",
    noGames: "Keine installierten Spiele gefunden.", reload: "Neu laden", back: "‹ Zurück", loading: "Lade …", language: "Sprache",
    current: "Startoptionen", preview: "Neue Startoptionen", empty: "(leer)", unsaved: "Noch nicht übernommen",
    apply: "Übernehmen", applying: "Wird gesetzt …", applied: "Startoptionen gesetzt.", discard: "Änderungen verwerfen",
    clear: "Alles entfernen", restore: "Original wiederherstellen", restored: "Ursprüngliche Startoptionen wiederhergestellt.",
    readOnly: "Steams Schnittstelle ist gerade nicht erreichbar, die Werte kommen von der Festplatte. Übernehmen klappt eventuell nicht.",
    extras: "Weitere Teile", extrasHint: "Teile der Startoptionen, die kein Baustein kennt. ✕ entfernt, ★ speichert als Baustein.",
    custom: "Meine Bausteine", customHint: "Für jedes Spiel verfügbar. Antippen schaltet sie für dieses Spiel an oder aus.",
    customNone: "Noch keine eigenen Bausteine.", addTitle: "Neuer Baustein",
    addHint: "VARIABLE=Wert kommt vor %command%, alles andere (z. B. -arg oder --flag=x) dahinter. Mehrere Teile mit Leerzeichen getrennt gehen auch.",
    valuePh: "z. B. MEINE_VAR=1 oder -nolog", labelPh: "Name (optional)", add: "Baustein speichern", added: "Baustein gespeichert.",
    del: "Löschen", deleted: "Baustein gelöscht.", edit: "Verwalten", done: "Fertig",
    typeTip: "Tippen geht hier nicht? Einmal in Steams eigene Startoptionen eintragen, das Spiel hier neu öffnen und daneben auf ★ tippen. Oder per SSH in ~/.config/framey/launch-arguments.json eintragen.",
    diag: "Steam-Schnittstelle prüfen", diagHint: "Zeigt, ob Startoptionen geändert werden können. Nützlich für Fehlerberichte.",
    failed: "Fehlgeschlagen: ", appidLabel: "App-ID",
    groups: { dll: "DLL-Overrides (Mod-Loader)", steam: "Steam", proton: "Proton & Debugging", unity: "VR & Unity" },
    err: {
      no_steam: "Steam-Ordner nicht gefunden.", no_target: "Steams Hauptseite ist nicht erreichbar (läuft Steam?).",
      api_missing: "Diese Steam-Version kann Startoptionen von hier aus nicht ändern.", timeout: "Zeitüberschreitung.",
      io: "Dateifehler.", bad_appid: "Ungültige App-ID.", bad_arg: "Ungültige Eingabe.", too_many: "Zu viele Bausteine.",
      no_backup: "Kein Original gespeichert.", generic: "Unbekannter Fehler.",
    },
  },
};

// ---- building blocks ------------------------------------------------------
// "value" uses the same syntax as a launch option line. {appid} becomes the game's app ID.
const DLLS = [
  { dll: "winhttp", label: "winhttp", hint: "BepInEx" },
  { dll: "version", label: "version", hint: "MelonLoader" },
  { dll: "dinput8", label: "dinput8", hint: "ASI Loader" },
  { dll: "dxgi", label: "dxgi", hint: "ReShade / Special K" },
  { dll: "d3d11", label: "d3d11", hint: "" },
  { dll: "winmm", label: "winmm", hint: "" },
];
const PRESETS = [
  { group: "steam", value: "SteamAppId={appid}", label: "SteamAppId" },
  { group: "steam", value: "SteamGameId={appid}", label: "SteamGameId" },
  { group: "proton", value: "PROTON_LOG=1", label: "PROTON_LOG" },
  { group: "proton", value: "PROTON_USE_WINED3D=1", label: "WineD3D" },
  { group: "proton", value: "PROTON_NO_ESYNC=1", label: "No esync" },
  { group: "proton", value: "PROTON_NO_FSYNC=1", label: "No fsync" },
  { group: "proton", value: "DXVK_HUD=fps", label: "DXVK FPS-HUD" },
  { group: "proton", value: "WINEDEBUG=-all", label: "WINEDEBUG=-all" },
  { group: "unity", value: "--osc=9000:127.0.0.1:9001", label: "OSC 9000/9001" },
  { group: "unity", value: "--no-vr", label: "--no-vr" },
  { group: "unity", value: "-screen-fullscreen 0", label: "Windowed" },
  { group: "unity", value: "-window-mode borderless", label: "Borderless" },
  { group: "unity", value: "-force-d3d11", label: "-force-d3d11" },
  { group: "unity", value: "-force-vulkan", label: "-force-vulkan" },
];
const GROUPS = ["dll", "steam", "proton", "unity"];

function pick(code) {
  const c = String(code || "").toLowerCase().slice(0, 2);
  return CODES.indexOf(c) >= 0 ? c : "en";
}
function build(code) {
  const b = LANGS.en, l = LANGS[code] || {};
  const o = Object.assign({}, b, l);
  o.groups = Object.assign({}, b.groups, l.groups);
  o.err = Object.assign({}, b.err, l.err);
  return o;
}
let lang = pick(navigator.language);
let S = build(lang);

// ---- launch option parsing --------------------------------------------------
// A line is "ENV=x ENV2=y wrapper %command% -arg --flag". Without %command% everything is
// an argument (Steam appends it to the game's command line).
const RE_ENV = /^[A-Za-z_][A-Za-z0-9_]*=/;

function tokenize(s) {
  const out = [];
  let cur = "", q = "", has = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      cur += c;
      if (c === "\\" && q === '"' && i + 1 < s.length) { cur += s[++i]; continue; }
      if (c === q) q = "";
    } else if (c === '"' || c === "'") {
      q = c; cur += c; has = true;
    } else if (c === "\\" && i + 1 < s.length) {
      cur += c + s[++i]; has = true;
    } else if (/\s/.test(c)) {
      if (has) { out.push(cur); cur = ""; has = false; }
    } else {
      cur += c; has = true;
    }
  }
  if (has) out.push(cur);
  return out;
}
function unquote(t) {
  let o = "", q = "";
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === q) q = "";
      else if (c === "\\" && q === '"' && i + 1 < t.length) o += t[++i];
      else o += c;
    } else if (c === '"' || c === "'") q = c;
    else if (c === "\\" && i + 1 < t.length) o += t[++i];
    else o += c;
  }
  return o;
}
function quote(key, v) {
  if (key !== "WINEDLLOVERRIDES" && /^[A-Za-z0-9_\-.,:\/=+@%]+$/.test(v)) return v;
  return '"' + v.replace(/(["\\$`])/g, "\\$1") + '"';
}
function parse(s) {
  const t = tokenize(String(s || ""));
  const i = t.indexOf("%command%");
  const m = { env: [], pre: [], args: [] };
  if (i < 0) { m.args = t; return m; }
  t.slice(0, i).forEach(function (x) {
    if (RE_ENV.test(x)) {
      const p = x.indexOf("=");
      setEnv(m, x.slice(0, p), unquote(x.slice(p + 1)));
    } else m.pre.push(x);
  });
  m.args = t.slice(i + 1);
  return m;
}
function render(m) {
  const env = m.env.map(function (e) { return e.k + "=" + quote(e.k, e.v); });
  if (env.length || m.pre.length) return env.concat(m.pre, ["%command%"], m.args).join(" ");
  return m.args.join(" ");
}
function getEnv(m, k) {
  for (let i = 0; i < m.env.length; i++) if (m.env[i].k === k) return m.env[i].v;
  return null;
}
function setEnv(m, k, v) {
  for (let i = 0; i < m.env.length; i++) if (m.env[i].k === k) { m.env[i].v = v; return; }
  m.env.push({ k: k, v: v });
}
function delEnv(m, k) { m.env = m.env.filter(function (e) { return e.k !== k; }); }

// WINEDLLOVERRIDES="winhttp,version=n,b;d3d11=n" -> {winhttp:"n,b", version:"n,b", d3d11:"n"}
function dllMap(m) {
  const v = getEnv(m, "WINEDLLOVERRIDES");
  const out = {};
  if (!v) return out;
  v.split(";").forEach(function (part) {
    const p = part.indexOf("=");
    const names = (p < 0 ? part : part.slice(0, p)).split(",");
    const mode = p < 0 ? "" : part.slice(p + 1);
    names.forEach(function (n) { n = n.trim(); if (n) out[n] = mode; });
  });
  return out;
}
function setDlls(m, map) {
  const by = {}, order = [];
  Object.keys(map).forEach(function (n) {
    const mode = map[n];
    if (!by[mode]) { by[mode] = []; order.push(mode); }
    by[mode].push(n);
  });
  const v = order.map(function (mode) { return by[mode].join(",") + (mode ? "=" + mode : ""); }).join(";");
  if (v) setEnv(m, "WINEDLLOVERRIDES", v); else delEnv(m, "WINEDLLOVERRIDES");
}

// A block value split into env assignments and argument tokens.
function blockParts(value, appid) {
  const env = [], args = [];
  tokenize(String(value).split("{appid}").join(appid)).forEach(function (x) {
    if (x === "%command%") return;
    if (RE_ENV.test(x)) {
      const p = x.indexOf("=");
      env.push({ k: x.slice(0, p), v: unquote(x.slice(p + 1)) });
    } else args.push(x);
  });
  return { env: env, args: args };
}
function seqAt(arr, seq) {
  if (!seq.length) return -1;
  for (let i = 0; i + seq.length <= arr.length; i++) {
    let ok = true;
    for (let j = 0; j < seq.length && ok; j++) ok = arr[i + j] === seq[j];
    if (ok) return i;
  }
  return -1;
}
function blockOn(m, b) {
  if (!b.env.length && !b.args.length) return false;
  for (let i = 0; i < b.env.length; i++) if (getEnv(m, b.env[i].k) !== b.env[i].v) return false;
  return !b.args.length || seqAt(m.args, b.args) >= 0;
}
function toggleBlock(m, b) {
  if (blockOn(m, b)) {
    b.env.forEach(function (e) { delEnv(m, e.k); });
    const i = seqAt(m.args, b.args);
    if (i >= 0) m.args.splice(i, b.args.length);
  } else {
    b.env.forEach(function (e) { setEnv(m, e.k, e.v); });
    if (b.args.length && seqAt(m.args, b.args) < 0) m.args = m.args.concat(b.args);
  }
}
function allBlocks() {
  return PRESETS.map(function (p) { return p.value; }).concat((st.custom || []).map(function (c) { return c.value; }));
}
// Parts of the line that no switched-on block covers: env keys, wrappers, argument runs.
function extras(m, appid) {
  const envOk = { WINEDLLOVERRIDES: true }, argOk = [];
  allBlocks().forEach(function (v) {
    const b = blockParts(v, appid);
    if (!blockOn(m, b)) return;
    b.env.forEach(function (e) { envOk[e.k] = true; });
    const i = seqAt(m.args, b.args);
    for (let j = 0; i >= 0 && j < b.args.length; j++) argOk[i + j] = true;
  });
  const out = [];
  m.env.forEach(function (e) { if (!envOk[e.k]) out.push({ type: "env", k: e.k, text: e.k + "=" + quote(e.k, e.v) }); });
  const map = dllMap(m), known = {};
  DLLS.forEach(function (d) { known[d.dll] = true; });
  Object.keys(map).forEach(function (n) { if (!known[n]) out.push({ type: "dll", k: n, text: "DLL " + n + (map[n] ? "=" + map[n] : "") }); });
  m.pre.forEach(function (p, i) { out.push({ type: "pre", i: i, text: p }); });
  // An argument followed by a value ("-screen-fullscreen 0") stays together.
  for (let i = 0; i < m.args.length; i++) {
    if (argOk[i]) continue;
    let j = i + 1;
    while (j < m.args.length && !argOk[j] && !/^-/.test(m.args[j])) j++;
    out.push({ type: "arg", i: i, n: j - i, text: m.args.slice(i, j).join(" ") });
    i = j - 1;
  }
  return out;
}

// ---- state and helpers ---------------------------------------------------------

const st = {
  conf: null, games: null, loading: false, homeErr: "", diag: null,
  appid: null, name: "", saved: null, draft: null, live: true, orig: null, busy: false, req: 0,
  custom: [], manage: false, detailErr: "", dirtyHome: false,
};
let root = null;

const BTN = "padding:14px 22px;font-size:22px;border-radius:12px;background:#3d6fd6;color:#fff;margin:6px 0;";
const BTN_DIM = "padding:14px 22px;font-size:22px;border-radius:12px;background:#3a434b;color:#fff;margin:6px 0;";
const BTN_RED = "padding:14px 22px;font-size:22px;border-radius:12px;background:#8a3b3b;color:#fff;margin:6px 0;";
const CHIP = "padding:12px 18px;font-size:20px;border-radius:24px;margin:0;";
const CHIP_ON = CHIP + "background:#3d6fd6;color:#fff;";
const CHIP_OFF = CHIP + "background:#2f363d;color:#d4dae0;";
const H2 = "font-size:26px;font-weight:600;margin:18px 0 6px;";
const HINT = "font-size:17px;color:#7d8791;margin-bottom:6px;";
const ROW = "display:flex;flex-wrap:wrap;gap:10px;margin:8px 0;";

function errText(e) {
  const m = String((e && e.message) || e);
  if (S.err[m]) return S.err[m];
  if (m.indexOf("cdp") === 0) return S.err.no_target + " (" + m + ")";
  return S.err.generic + " (" + m.slice(0, 60) + ")";
}
function api(method, arg) {
  return Promise.race([
    Framey.call(ID, method, arg),
    new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, 45000); }),
  ]).then(function (r) {
    if (r && r.error) throw new Error(r.error);
    return r;
  });
}
function field(ph) {
  const i = document.createElement("input");
  i.setAttribute("data-fy", "1");
  i.placeholder = ph;
  i.style.cssText = "width:100%;box-sizing:border-box;padding:16px;font-size:22px;border-radius:12px;" +
    "border:2px solid #4a5560;background:#1b2024;color:#fff;margin:8px 0;";
  return i;
}
function chip(label, hint, on, fn) {
  const b = Framey.button(label + (hint ? "  ·  " + hint : ""), on ? CHIP_ON : CHIP_OFF, fn);
  return b;
}
function setLang(code, save) {
  lang = code;
  S = build(code);
  if (save) api("set_lang", { lang: code }).catch(function () {});
  draw();
}

// ---- icons (same lazy queue as SteamGridDB for Framey) ------------------------
const ANIM_CSS = "@keyframes fySpin{to{transform:rotate(360deg)}}" +
  "@keyframes fyIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}";
const iconCache = {}, iconWait = {};
let iconQ = [], iconBusy = false;

function pumpIcons() {
  if (iconBusy || !iconQ.length) return;
  iconBusy = true;
  const batch = iconQ.splice(0, 8);
  api("icons", { appids: batch }).then(function (r) {
    batch.forEach(function (a) {
      const v = (r.icons && typeof r.icons[a] === "string") ? r.icons[a] : "";
      iconCache[a] = v;
      (iconWait[a] || []).forEach(function (f) { f(v); });
      delete iconWait[a];
    });
  }).catch(function () {
    batch.forEach(function (a) { delete iconWait[a]; });
  }).then(function () { iconBusy = false; pumpIcons(); });
}
function iconEl(appid, size) {
  const box = Framey.el("flex:none;width:" + size + "px;height:" + size + "px;border-radius:" + Math.round(size / 5) +
    "px;background:#14181c;overflow:hidden;", "");
  const put = function (src, cached) {
    box.textContent = "";
    if (!src) return;
    const im = document.createElement("img");
    im.style.cssText = "display:block;width:100%;height:100%;object-fit:cover;" + (cached ? "" : "animation:fyIn .35s ease;");
    im.src = src;
    box.appendChild(im);
  };
  if (iconCache[appid] !== undefined) put(iconCache[appid], true);
  else {
    const ring = Math.max(14, Math.round(size / 3));
    box.appendChild(Framey.el("position:relative;left:50%;top:50%;margin:-" + Math.round(ring / 2) + "px 0 0 -" + Math.round(ring / 2) +
      "px;width:" + ring + "px;height:" + ring + "px;border-radius:50%;border:3px solid #3d6fd6;border-top-color:transparent;box-sizing:border-box;animation:fySpin .8s linear infinite;", ""));
    (iconWait[appid] = iconWait[appid] || []).push(put);
    if (iconQ.indexOf(appid) < 0) iconQ.push(appid);
    pumpIcons();
  }
  return box;
}

function draw() {
  if (!root) return;
  root.textContent = "";
  const sty = document.createElement("style");
  sty.textContent = ANIM_CSS;
  root.appendChild(sty);
  root.appendChild(st.appid ? detailView() : homeView());
}

// ---- home -----------------------------------------------------------------

function loadHome() {
  if (st.loading) return;
  st.loading = true;
  Promise.all([api("conf"), api("games")]).then(function (r) {
    st.conf = r[0];
    st.custom = r[0].custom || [];
    st.games = r[1].games || [];
    st.homeErr = "";
    if (r[0].lang && r[0].lang !== lang) { lang = r[0].lang; S = build(lang); }
  }).catch(function (e) {
    st.conf = {};
    st.games = [];
    st.homeErr = errText(e);
  }).then(function () { st.loading = false; draw(); });
}

function gameRow(g) {
  const row = Framey.el("display:flex;align-items:center;gap:16px;padding:12px 20px;margin:8px 0;border-radius:14px;background:#2a3138;cursor:pointer;", "");
  row.appendChild(iconEl(g.appid, 56));
  const txt = Framey.el("flex:1;min-width:0;", "");
  txt.appendChild(Framey.el("font-size:24px;", g.name));
  txt.appendChild(Framey.el("font-size:16px;color:#7d8791;", String(g.appid)));
  row.appendChild(txt);
  if (g.changed) row.appendChild(Framey.el("font-size:22px;color:#7fd18b;", "●"));
  row.onclick = function () { select(g.appid, g.name); };
  return row;
}

function homeView() {
  const w = Framey.el("padding:8px;color:#e6e9ec;");
  w.appendChild(Framey.el("font-size:32px;font-weight:600;margin-bottom:14px;", S.title));
  if (st.conf === null) {
    loadHome();
    w.appendChild(Framey.el("font-size:22px;color:#9aa5af;", S.loading));
    return w;
  }
  if (st.homeErr) w.appendChild(Framey.el("font-size:22px;color:#ff8a80;margin-bottom:10px;", st.homeErr));

  const changed = st.games.filter(function (g) { return g.changed; });
  const steam = st.games.filter(function (g) { return !g.shortcut; });
  const sc = st.games.filter(function (g) { return g.shortcut; });
  if (changed.length) {
    w.appendChild(Framey.el(H2, S.changedTitle));
    changed.forEach(function (g) { w.appendChild(gameRow(g)); });
  }
  w.appendChild(Framey.el(H2, S.games));
  if (!st.games.length) w.appendChild(Framey.el("font-size:20px;color:#9aa5af;", S.noGames));
  steam.forEach(function (g) { w.appendChild(gameRow(g)); });
  if (sc.length) {
    w.appendChild(Framey.el(H2, S.shortcuts));
    sc.forEach(function (g) { w.appendChild(gameRow(g)); });
  }
  w.appendChild(Framey.button(S.reload, BTN_DIM, function () { st.conf = null; st.games = null; draw(); }));

  w.appendChild(Framey.el(H2, S.language));
  const langs = Framey.el("display:flex;flex-wrap:wrap;gap:8px;", "");
  CODES.forEach(function (c) {
    langs.appendChild(Framey.button(NAMES[c], c === lang ? BTN : BTN_DIM, function () { if (c !== lang) setLang(c, true); }));
  });
  w.appendChild(langs);

  w.appendChild(Framey.el(H2, S.diag));
  w.appendChild(Framey.el(HINT, S.diagHint));
  w.appendChild(Framey.button(S.diag, BTN_DIM, function () {
    const a = localApps();
    st.diag = { localApps: !!a, localSet: !!(a && typeof a.SetAppLaunchOptions === "function") };
    draw();
    api("probe").then(function (r) { st.diag.backend = r; })
      .catch(function (e) { st.diag.backend = String((e && e.message) || e); })
      .then(function () { if (root && !st.appid) draw(); });
  }));
  if (st.diag) {
    w.appendChild(Framey.el("font-family:monospace;font-size:15px;white-space:pre-wrap;word-break:break-all;background:#14181c;padding:10px;border-radius:8px;color:#c4ccd3;",
      JSON.stringify(st.diag, null, 1)));
  }
  return w;
}

// ---- detail ---------------------------------------------------------------

function localApps() {
  try { return (window.SteamClient && window.SteamClient.Apps) || null; } catch (e) { return null; }
}

function select(appid, name) {
  const token = ++st.req;
  st.appid = appid;
  st.name = name || appid;
  st.saved = null;
  st.draft = null;
  st.orig = null;
  st.manage = false;
  st.detailErr = "";
  Promise.all([api("get", { appid: appid }), api("backup", { appid: appid })]).then(function (r) {
    if (token !== st.req) return;
    st.saved = r[0].opts || "";
    st.live = !!r[0].live;
    st.draft = parse(st.saved);
    st.orig = r[1].orig;
  }).catch(function (e) {
    if (token !== st.req) return;
    st.saved = "";
    st.draft = parse("");
    st.detailErr = errText(e);
  }).then(function () { if (token === st.req) draw(); });
  draw();
}

function writeOpts(opts, before) {
  const a = localApps();
  if (a && typeof a.SetAppLaunchOptions === "function") {
    return Promise.resolve().then(function () { return a.SetAppLaunchOptions(Number(st.appid), opts); }).then(function () {
      if (before === null) return { opts: opts };
      return api("remember", { appid: st.appid, before: before }).catch(function () {}).then(function () { return { opts: opts }; });
    });
  }
  const arg = { appid: st.appid, opts: opts };
  if (before !== null) arg.before = before;
  return api("set", arg);
}

function applyDraft() {
  if (st.busy) return;
  st.busy = true;
  const opts = render(st.draft);
  const appid = st.appid;
  Framey.toast(S.applying, 1500);
  writeOpts(opts, st.saved).then(function (r) {
    if (appid !== st.appid) return;
    st.saved = typeof r.opts === "string" ? r.opts : opts;
    st.draft = parse(st.saved);
    st.live = true;
    if (st.orig === null || st.orig === undefined) st.orig = "";
    st.dirtyHome = true;
    Framey.toast(S.applied, 3000);
  }).catch(function (e) {
    Framey.toast(S.failed + errText(e), 6000);
  }).then(function () { st.busy = false; draw(); });
  draw();
}

function restoreOrig() {
  if (st.busy || typeof st.orig !== "string") return;
  st.busy = true;
  const appid = st.appid, orig = st.orig;
  const a = localApps();
  const job = a && typeof a.SetAppLaunchOptions === "function"
    ? Promise.resolve().then(function () { return a.SetAppLaunchOptions(Number(appid), orig); })
      .then(function () { return api("forget_backup", { appid: appid }); }).then(function () { return { opts: orig }; })
    : api("restore", { appid: appid });
  job.then(function (r) {
    if (appid !== st.appid) return;
    st.saved = typeof r.opts === "string" ? r.opts : orig;
    st.draft = parse(st.saved);
    st.orig = null;
    st.dirtyHome = true;
    Framey.toast(S.restored, 3000);
  }).catch(function (e) {
    Framey.toast(S.failed + errText(e), 6000);
  }).then(function () { st.busy = false; draw(); });
}

function saveCustom(value, label) {
  return api("add_custom", { value: value, label: label || "" }).then(function (r) {
    const it = r.item;
    if (it && !st.custom.some(function (c) { return c.id === it.id; })) st.custom.push(it);
    Framey.toast(S.added, 2500);
    draw();
  }).catch(function (e) { Framey.toast(S.failed + errText(e), 4000); });
}

function codeBox(text, color) {
  return Framey.el("font-family:monospace;font-size:20px;white-space:pre-wrap;word-break:break-all;background:#14181c;" +
    "padding:14px;border-radius:10px;color:" + (color || "#c4ccd3") + ";margin:6px 0;", text || S.empty);
}

function detailView() {
  const w = Framey.el("padding:8px;color:#e6e9ec;");
  w.appendChild(Framey.button(S.back, BTN_DIM, function () {
    st.appid = null;
    st.req++;
    if (st.dirtyHome) { st.dirtyHome = false; st.conf = null; st.games = null; }
    draw();
  }));
  const head = Framey.el("display:flex;align-items:center;gap:16px;margin:10px 0;", "");
  head.appendChild(iconEl(st.appid, 64));
  const ht = Framey.el("min-width:0;", "");
  ht.appendChild(Framey.el("font-size:30px;font-weight:600;", st.name));
  ht.appendChild(Framey.el("font-size:16px;color:#7d8791;", S.appidLabel + " " + st.appid));
  head.appendChild(ht);
  w.appendChild(head);

  if (st.detailErr) w.appendChild(Framey.el("font-size:22px;color:#ff8a80;margin:10px 0;", st.detailErr));
  if (st.draft === null) {
    w.appendChild(Framey.el("font-size:22px;color:#9aa5af;margin:10px 0;", S.loading));
    return w;
  }
  const m = st.draft, appid = st.appid;
  const now = render(m);
  const dirty = now !== render(parse(st.saved));

  // Current / new line and actions
  w.appendChild(Framey.el(H2, dirty ? S.preview : S.current));
  w.appendChild(codeBox(now, dirty ? "#ffd479" : null));
  if (!st.live) w.appendChild(Framey.el("font-size:17px;color:#e6c34a;", S.readOnly));
  const acts = Framey.el("display:flex;flex-wrap:wrap;gap:8px;", "");
  if (dirty) {
    acts.appendChild(Framey.el("font-size:18px;color:#ffd479;align-self:center;margin-right:6px;", S.unsaved));
    acts.appendChild(Framey.button(st.busy ? S.applying : S.apply, BTN, applyDraft));
    acts.appendChild(Framey.button(S.discard, BTN_DIM, function () { st.draft = parse(st.saved); draw(); }));
  }
  if (now) acts.appendChild(Framey.button(S.clear, BTN_DIM, function () { st.draft = parse(""); draw(); }));
  if (typeof st.orig === "string") acts.appendChild(Framey.button(S.restore, BTN_DIM, restoreOrig));
  if (acts.children.length) w.appendChild(acts);

  // Preset groups
  GROUPS.forEach(function (gr) {
    w.appendChild(Framey.el(H2, S.groups[gr]));
    const row = Framey.el(ROW, "");
    if (gr === "dll") {
      const map = dllMap(m);
      DLLS.forEach(function (d) {
        row.appendChild(chip(d.label, d.hint, map[d.dll] !== undefined, function () {
          const mm = dllMap(st.draft);
          if (mm[d.dll] !== undefined) delete mm[d.dll]; else mm[d.dll] = "n,b";
          setDlls(st.draft, mm);
          draw();
        }));
      });
    } else {
      PRESETS.filter(function (p) { return p.group === gr; }).forEach(function (p) {
        const b = blockParts(p.value, appid);
        const label = p.label + (p.value.indexOf("{appid}") >= 0 ? "=" + appid : "");
        row.appendChild(chip(label, "", blockOn(m, b), function () { toggleBlock(st.draft, b); draw(); }));
      });
    }
    w.appendChild(row);
  });

  // Own building blocks (global)
  w.appendChild(Framey.el(H2, S.custom));
  w.appendChild(Framey.el(HINT, S.customHint));
  const crow = Framey.el(ROW, "");
  if (!st.custom.length) crow.appendChild(Framey.el("font-size:20px;color:#9aa5af;", S.customNone));
  st.custom.forEach(function (c) {
    const b = blockParts(c.value, appid);
    if (st.manage) {
      crow.appendChild(Framey.button("✕  " + (c.label || c.value), CHIP + "background:#5a2f2f;color:#fff;", function () {
        api("del_custom", { id: c.id }).then(function () {
          st.custom = st.custom.filter(function (x) { return x.id !== c.id; });
          Framey.toast(S.deleted, 2000);
          draw();
        }).catch(function (e) { Framey.toast(S.failed + errText(e), 4000); });
      }));
    } else {
      crow.appendChild(chip(c.label || c.value, c.label ? c.value : "", blockOn(m, b), function () { toggleBlock(st.draft, b); draw(); }));
    }
  });
  w.appendChild(crow);
  if (st.custom.length) w.appendChild(Framey.button(st.manage ? S.done : S.edit, st.manage ? BTN : BTN_DIM, function () { st.manage = !st.manage; draw(); }));

  // Parts nobody knows: remove or save as own building block
  const ex = extras(m, appid);
  if (ex.length) {
    w.appendChild(Framey.el(H2, S.extras));
    w.appendChild(Framey.el(HINT, S.extrasHint));
    ex.forEach(function (x) {
      const r = Framey.el("display:flex;align-items:center;gap:10px;margin:6px 0;", "");
      r.appendChild(Framey.el("flex:1;min-width:0;font-family:monospace;font-size:20px;background:#14181c;padding:12px;border-radius:10px;word-break:break-all;", x.text));
      if (x.type === "env" || x.type === "arg") {
        r.appendChild(Framey.button("★", CHIP_OFF, function () { saveCustom(x.text, ""); }));
      }
      r.appendChild(Framey.button("✕", CHIP + "background:#5a2f2f;color:#fff;", function () {
        const d = st.draft;
        if (x.type === "env") delEnv(d, x.k);
        else if (x.type === "dll") { const mm = dllMap(d); delete mm[x.k]; setDlls(d, mm); }
        else if (x.type === "pre") d.pre.splice(x.i, 1);
        else d.args.splice(x.i, x.n);
        draw();
      }));
      w.appendChild(r);
    });
  }

  // New building block
  w.appendChild(Framey.el(H2, S.addTitle));
  w.appendChild(Framey.el(HINT, S.addHint));
  const vIn = field(S.valuePh);
  const lIn = field(S.labelPh);
  w.appendChild(vIn);
  w.appendChild(lIn);
  w.appendChild(Framey.button(S.add, BTN, function () {
    const v = vIn.value.trim();
    if (v) saveCustom(v, lIn.value.trim());
  }));
  w.appendChild(Framey.el(HINT, S.typeTip));
  return w;
}

Framey.register({
  name: "Launch Arguments",
  short: "Launch",
  render: function (box) {
    root = box;
    st.appid = null;
    st.req++;
    draw();
  },
});
