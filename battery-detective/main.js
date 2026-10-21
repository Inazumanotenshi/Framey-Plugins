// Battery Detective for Framey: battery drain per game, live readout, ETA.
const ID = "battery-detective";
const CODES = ["de", "en", "fr", "es", "it", "pt"];
const NAMES = { de: "Deutsch", en: "English", fr: "Français", es: "Español", it: "Italiano", pt: "Português" };

// Missing keys fall back to English. New language: add code to CODES/NAMES here, to LANGS in backend.py, and a block below.
const LANGS = {
  en: {
    back: "‹ Back", settings: "Settings", language: "Language", source: "Battery source", auto: "Auto",
    diag: "Show diagnostics", diagHint: "Raw power-supply values, handy for bug reports.", noDiag: "No battery devices found.",
    running: "Detected running app ID", none: "none",
    reset: "Delete all data", resetSure: "Tap again to confirm", resetDone: "Data deleted.", failed: "Failed: ",
    loading: "Loading …", noBattery: "No battery found. Open Settings → diagnostics.",
    charging: "Charging", discharging: "Discharging", full: "Full", other: "Not discharging",
    etaLive: "Time left (live)", etaHist: "Time left (from history)", etaWait: "Time left: collecting data …",
    nowPlaying: "Now playing", session: "session", noGame: "No game running",
    chartW: "Power draw, last hour (W)", chartP: "Charge level, last hour (%)",
    rankTitle: "Battery use per game", idle: "Menu / idle", avg: "avg", fullBat: "on a full battery",
    sessions: "sessions", measured: "measured", tooLittle: "not enough data yet",
    noStats: "No data yet. Play something while the headset runs on battery.",
  },
  de: {
    back: "‹ Zurück", settings: "Einstellungen", language: "Sprache", source: "Akku-Quelle", auto: "Automatisch",
    diag: "Diagnose anzeigen", diagHint: "Rohwerte der Stromversorgung, nützlich für Fehlerberichte.", noDiag: "Keine Akku-Geräte gefunden.",
    running: "Erkannte laufende App-ID", none: "keine",
    reset: "Alle Daten löschen", resetSure: "Zum Bestätigen nochmal tippen", resetDone: "Daten gelöscht.", failed: "Fehlgeschlagen: ",
    loading: "Lade …", noBattery: "Kein Akku gefunden. Einstellungen → Diagnose öffnen.",
    charging: "Lädt", discharging: "Entlädt", full: "Voll", other: "Entlädt nicht",
    etaLive: "Restzeit (live)", etaHist: "Restzeit (aus Verlauf)", etaWait: "Restzeit: sammle noch Daten …",
    nowPlaying: "Läuft gerade", session: "Sitzung", noGame: "Kein Spiel läuft",
    chartW: "Leistungsaufnahme, letzte Stunde (W)", chartP: "Ladestand, letzte Stunde (%)",
    rankTitle: "Akkuverbrauch pro Spiel", idle: "Menü / Leerlauf", avg: "Ø", fullBat: "mit vollem Akku",
    sessions: "Sitzungen", measured: "gemessen", tooLittle: "noch zu wenig Daten",
    noStats: "Noch keine Daten. Spiele etwas, während das Headset im Akkubetrieb läuft.",
  },
  fr: {
    back: "‹ Retour", settings: "Paramètres", language: "Langue", source: "Source de la batterie", auto: "Auto",
    diag: "Afficher le diagnostic", diagHint: "Valeurs brutes de l'alimentation, utiles pour les rapports de bug.", noDiag: "Aucune batterie trouvée.",
    running: "ID de l'appli en cours détecté", none: "aucun",
    reset: "Supprimer toutes les données", resetSure: "Touchez à nouveau pour confirmer", resetDone: "Données supprimées.", failed: "Échec : ",
    loading: "Chargement …", noBattery: "Aucune batterie trouvée. Ouvrez Paramètres → diagnostic.",
    charging: "En charge", discharging: "Décharge", full: "Pleine", other: "Ne se décharge pas",
    etaLive: "Temps restant (en direct)", etaHist: "Temps restant (d'après l'historique)", etaWait: "Temps restant : collecte des données …",
    nowPlaying: "En cours", session: "session", noGame: "Aucun jeu en cours",
    chartW: "Puissance absorbée, dernière heure (W)", chartP: "Niveau de charge, dernière heure (%)",
    rankTitle: "Consommation par jeu", idle: "Menu / repos", avg: "moy.", fullBat: "sur batterie pleine",
    sessions: "sessions", measured: "mesurées", tooLittle: "pas encore assez de données",
    noStats: "Pas encore de données. Jouez avec le casque sur batterie.",
  },
  es: {
    back: "‹ Atrás", settings: "Ajustes", language: "Idioma", source: "Fuente de batería", auto: "Automático",
    diag: "Mostrar diagnóstico", diagHint: "Valores en bruto de la alimentación, útiles para informes de errores.", noDiag: "No se encontraron baterías.",
    running: "ID de app en ejecución detectada", none: "ninguna",
    reset: "Borrar todos los datos", resetSure: "Toca de nuevo para confirmar", resetDone: "Datos borrados.", failed: "Error: ",
    loading: "Cargando …", noBattery: "No se encontró batería. Abre Ajustes → diagnóstico.",
    charging: "Cargando", discharging: "Descargando", full: "Completa", other: "No se descarga",
    etaLive: "Tiempo restante (en vivo)", etaHist: "Tiempo restante (según el historial)", etaWait: "Tiempo restante: recopilando datos …",
    nowPlaying: "Jugando ahora", session: "sesión", noGame: "Ningún juego en ejecución",
    chartW: "Consumo de potencia, última hora (W)", chartP: "Nivel de carga, última hora (%)",
    rankTitle: "Consumo de batería por juego", idle: "Menú / inactivo", avg: "prom.", fullBat: "con la batería llena",
    sessions: "sesiones", measured: "medidas", tooLittle: "aún hay pocos datos",
    noStats: "Aún no hay datos. Juega con el visor funcionando con batería.",
  },
  it: {
    back: "‹ Indietro", settings: "Impostazioni", language: "Lingua", source: "Sorgente batteria", auto: "Automatico",
    diag: "Mostra diagnostica", diagHint: "Valori grezzi dell'alimentazione, utili per segnalare errori.", noDiag: "Nessuna batteria trovata.",
    running: "ID app in esecuzione rilevato", none: "nessuno",
    reset: "Elimina tutti i dati", resetSure: "Tocca di nuovo per confermare", resetDone: "Dati eliminati.", failed: "Errore: ",
    loading: "Caricamento …", noBattery: "Nessuna batteria trovata. Apri Impostazioni → diagnostica.",
    charging: "In carica", discharging: "In scarica", full: "Piena", other: "Non in scarica",
    etaLive: "Tempo rimasto (live)", etaHist: "Tempo rimasto (dalla cronologia)", etaWait: "Tempo rimasto: raccolta dati …",
    nowPlaying: "In corso", session: "sessione", noGame: "Nessun gioco in esecuzione",
    chartW: "Potenza assorbita, ultima ora (W)", chartP: "Livello di carica, ultima ora (%)",
    rankTitle: "Consumo della batteria per gioco", idle: "Menu / inattivo", avg: "media", fullBat: "con la batteria piena",
    sessions: "sessioni", measured: "misurate", tooLittle: "dati ancora insufficienti",
    noStats: "Ancora nessun dato. Gioca con il visore a batteria.",
  },
  pt: {
    back: "‹ Voltar", settings: "Configurações", language: "Idioma", source: "Fonte da bateria", auto: "Automático",
    diag: "Mostrar diagnóstico", diagHint: "Valores brutos da alimentação, úteis para relatar erros.", noDiag: "Nenhuma bateria encontrada.",
    running: "ID do app em execução detectado", none: "nenhum",
    reset: "Apagar todos os dados", resetSure: "Toque de novo para confirmar", resetDone: "Dados apagados.", failed: "Falha: ",
    loading: "Carregando …", noBattery: "Nenhuma bateria encontrada. Abra Configurações → diagnóstico.",
    charging: "Carregando", discharging: "Descarregando", full: "Cheia", other: "Não está descarregando",
    etaLive: "Tempo restante (ao vivo)", etaHist: "Tempo restante (pelo histórico)", etaWait: "Tempo restante: coletando dados …",
    nowPlaying: "Jogando agora", session: "sessão", noGame: "Nenhum jogo em execução",
    chartW: "Consumo de energia, última hora (W)", chartP: "Nível de carga, última hora (%)",
    rankTitle: "Uso da bateria por jogo", idle: "Menu / ocioso", avg: "méd.", fullBat: "com a bateria cheia",
    sessions: "sessões", measured: "medidas", tooLittle: "ainda poucos dados",
    noStats: "Ainda sem dados. Jogue com o headset na bateria.",
  },
};

function pick(code) {
  const c = String(code || "").toLowerCase().slice(0, 2);
  return CODES.indexOf(c) >= 0 ? c : "en";
}
function build(code) { return Object.assign({}, LANGS.en, LANGS[code] || {}); }

let lang = pick(navigator.language);
let S = build(lang);

const st = { snap: null, stats: null, view: "main", diag: null, sure: false, ticks: 0 };
let root = null, liveEl = null, rankEl = null, timer = null;

const DIM = "font-size:20px;color:#9aa5af;";
const BTN = "padding:14px 22px;font-size:22px;border-radius:12px;background:#3d6fd6;color:#fff;margin:6px 0;";
const BTN_DIM = "padding:14px 22px;font-size:22px;border-radius:12px;background:#3a434b;color:#fff;margin:6px 0;";

function api(method, arg) {
  return Promise.race([
    Framey.call(ID, method, arg),
    new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, 30000); }),
  ]).then(function (r) {
    if (r && r.error) throw new Error(r.error);
    return r;
  });
}

function num(n, d) { return n.toFixed(d).replace(".", lang === "en" ? "." : ","); }
function dur(h) {
  const m = Math.max(0, Math.round(h * 60)), hh = Math.floor(m / 60), mm = m % 60;
  return hh > 0 ? hh + " h " + mm + " min" : mm + " min";
}
function pctColor(p) { return p == null ? "#9aa5af" : p > 50 ? "#7fd18b" : p > 20 ? "#e6c34a" : "#ff8a80"; }
function statusText(s) {
  return s === "Charging" ? S.charging : s === "Discharging" ? S.discharging : s === "Full" ? S.full : S.other;
}
function gname(g) { return g.key === "idle" ? S.idle : g.name; }

function setLang(code, save) {
  lang = code;
  S = build(code);
  if (save) api("set_lang", { lang: code }).catch(function () {});
  draw();
}

// ---- live card ------------------------------------------------------------

function spark(h) {
  const useW = h.some(function (p) { return p[2] != null; });
  const vals = h.map(function (p) { return useW ? p[2] : p[1]; }).filter(function (v) { return v != null; });
  if (vals.length < 2) return null;
  const NS = "http://www.w3.org/2000/svg";
  const wrap = Framey.el("margin:10px 0;", "");
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("data-fy", "1");
  svg.setAttribute("viewBox", "0 0 300 60");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.cssText = "width:100%;height:80px;background:#14181c;border-radius:10px;display:block;";
  const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = (hi - lo) || 1;
  const pts = vals.map(function (v, i) {
    return (i / (vals.length - 1) * 300).toFixed(1) + "," + (55 - (v - lo) / span * 50).toFixed(1);
  }).join(" ");
  const pl = document.createElementNS(NS, "polyline");
  pl.setAttribute("points", pts);
  pl.setAttribute("fill", "none");
  pl.setAttribute("stroke", useW ? "#e6c34a" : "#7fd18b");
  pl.setAttribute("stroke-width", "2");
  pl.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(pl);
  wrap.appendChild(svg);
  wrap.appendChild(Framey.el("font-size:16px;color:#7d8791;margin-top:4px;", useW ? S.chartW : S.chartP));
  return wrap;
}

function drawLive() {
  if (!liveEl) return;
  liveEl.textContent = "";
  const s = st.snap;
  if (!s) { liveEl.appendChild(Framey.el(DIM, S.loading)); return; }
  if (!s.battery) { liveEl.appendChild(Framey.el("font-size:22px;color:#ff8a80;", S.noBattery)); return; }
  const b = s.battery;
  const top = Framey.el("display:flex;flex-wrap:wrap;align-items:baseline;gap:16px;", "");
  top.appendChild(Framey.el("font-size:64px;font-weight:700;color:" + pctColor(b.pct) + ";",
    b.pct == null ? "?" : Math.round(b.pct) + " %"));
  const parts = [statusText(b.status)];
  if (b.watts != null) parts.push(num(b.watts, 1) + " W");
  if (b.temp != null) parts.push(num(b.temp, 0) + " °C");
  top.appendChild(Framey.el("font-size:22px;color:#9aa5af;", parts.join(" · ")));
  liveEl.appendChild(top);

  if (s.eta) {
    liveEl.appendChild(Framey.el("font-size:26px;margin:6px 0;", (s.eta.src === "live" ? S.etaLive : S.etaHist) + ": " + dur(s.eta.h)));
  } else if (b.status === "Discharging") {
    liveEl.appendChild(Framey.el(DIM, S.etaWait));
  }
  if (s.game) {
    let t = S.nowPlaying + ": " + s.game.name + " · " + S.session + " " + dur(s.game.sec / 3600);
    if (s.game.drop > 0) t += " · −" + Math.round(s.game.drop) + " %";
    liveEl.appendChild(Framey.el("font-size:22px;margin:6px 0;", t));
  } else {
    liveEl.appendChild(Framey.el(DIM, S.noGame));
  }
  const sp = spark(s.hist || []);
  if (sp) liveEl.appendChild(sp);
}

// ---- ranking --------------------------------------------------------------

function drawRank() {
  if (!rankEl) return;
  rankEl.textContent = "";
  rankEl.appendChild(Framey.el("font-size:26px;font-weight:600;margin:18px 0 6px;", S.rankTitle));
  const list = (st.stats || []).filter(function (g) { return g.sec > 0; });
  if (!list.length) { rankEl.appendChild(Framey.el(DIM, S.noStats)); return; }
  const max = Math.max.apply(null, list.map(function (g) { return g.rate || 0; })) || 1;
  list.slice(0, 30).forEach(function (g) {
    const row = Framey.el("padding:14px 18px;margin:8px 0;border-radius:14px;background:#2a3138;", "");
    const head = Framey.el("display:flex;justify-content:space-between;gap:12px;font-size:24px;", "");
    head.appendChild(Framey.el("overflow:hidden;text-overflow:ellipsis;white-space:nowrap;", gname(g)));
    head.appendChild(Framey.el("white-space:nowrap;color:" + (g.reliable ? "#e6e9ec" : "#7d8791") + ";",
      g.reliable ? num(g.rate, 1) + " %/h" : "–"));
    row.appendChild(head);
    if (g.reliable) {
      const track = Framey.el("height:8px;border-radius:4px;background:#14181c;margin:8px 0;", "");
      track.appendChild(Framey.el("height:8px;border-radius:4px;background:#3d6fd6;width:" + Math.max(3, Math.round(g.rate / max * 100)) + "%;", ""));
      row.appendChild(track);
    }
    const bits = [];
    if (g.reliable) {
      if (g.avg_w) bits.push(S.avg + " " + num(g.avg_w, 1) + " W");
      if (g.full_h) bits.push("≈ " + dur(g.full_h) + " " + S.fullBat);
    } else {
      bits.push(S.tooLittle);
    }
    bits.push(g.n + " " + S.sessions);
    bits.push(dur(g.sec / 3600) + " " + S.measured);
    row.appendChild(Framey.el("font-size:16px;color:#7d8791;", bits.join(" · ")));
    rankEl.appendChild(row);
  });
}

// ---- views ----------------------------------------------------------------

function settingsView() {
  const w = Framey.el("padding:8px;color:#e6e9ec;", "");
  w.appendChild(Framey.button(S.back, BTN_DIM, function () { st.view = "main"; st.sure = false; draw(); refresh(true); }));
  w.appendChild(Framey.el("font-size:32px;font-weight:600;margin:10px 0;", S.settings));

  w.appendChild(Framey.el("font-size:26px;font-weight:600;margin:12px 0 6px;", S.language));
  const langs = Framey.el("display:flex;flex-wrap:wrap;gap:8px;", "");
  CODES.forEach(function (c) {
    langs.appendChild(Framey.button(NAMES[c], c === lang ? BTN : BTN_DIM, function () { if (c !== lang) setLang(c, true); }));
  });
  w.appendChild(langs);

  const s = st.snap;
  if (s && s.devices && s.devices.length) {
    w.appendChild(Framey.el("font-size:26px;font-weight:600;margin:18px 0 6px;", S.source));
    const src = Framey.el("display:flex;flex-wrap:wrap;gap:8px;", "");
    src.appendChild(Framey.button(S.auto, s.auto ? BTN : BTN_DIM, function () { setDevice(""); }));
    s.devices.forEach(function (d) {
      src.appendChild(Framey.button(d, !s.auto && s.device === d ? BTN : BTN_DIM, function () { setDevice(d); }));
    });
    w.appendChild(src);
  }

  w.appendChild(Framey.el("font-size:26px;font-weight:600;margin:18px 0 6px;", S.diag));
  w.appendChild(Framey.el("font-size:17px;color:#7d8791;", S.diagHint));
  w.appendChild(Framey.button(S.diag, BTN_DIM, function () {
    api("diag").then(function (r) { st.diag = r; draw(); }).catch(function (e) { Framey.toast(S.failed + e.message, 4000); });
  }));
  if (st.diag) {
    w.appendChild(Framey.el("font-size:17px;margin:6px 0;", S.running + ": " + (st.diag.running || S.none)));
    if (!st.diag.items.length) w.appendChild(Framey.el(DIM, S.noDiag));
    st.diag.items.forEach(function (it) {
      w.appendChild(Framey.el("font-size:18px;font-weight:600;margin-top:8px;", it.name));
      w.appendChild(Framey.el("font-family:monospace;font-size:15px;white-space:pre-wrap;background:#14181c;padding:10px;border-radius:8px;color:#c4ccd3;", it.text));
    });
  }

  w.appendChild(Framey.button(st.sure ? S.resetSure : S.reset, st.sure ? "padding:14px 22px;font-size:22px;border-radius:12px;background:#b3402f;color:#fff;margin:18px 0 6px;" : BTN_DIM, function () {
    if (!st.sure) {
      st.sure = true;
      draw();
      setTimeout(function () { if (st.sure) { st.sure = false; if (st.view === "settings") draw(); } }, 5000);
      return;
    }
    st.sure = false;
    api("reset").then(function () { st.stats = []; Framey.toast(S.resetDone, 2500); draw(); })
      .catch(function (e) { Framey.toast(S.failed + e.message, 4000); });
  }));
  return w;
}

function setDevice(name) {
  api("set_device", { device: name }).then(function () { return refresh(true); })
    .catch(function (e) { Framey.toast(S.failed + e.message, 4000); });
}

function draw() {
  if (!root) return;
  root.textContent = "";
  liveEl = rankEl = null;
  if (st.view === "settings") { root.appendChild(settingsView()); return; }
  const w = Framey.el("padding:8px;color:#e6e9ec;", "");
  w.appendChild(Framey.el("font-size:32px;font-weight:600;margin-bottom:10px;", "Battery Detective"));
  liveEl = Framey.el("", "");
  rankEl = Framey.el("", "");
  w.appendChild(liveEl);
  w.appendChild(rankEl);
  w.appendChild(Framey.button(S.settings, BTN_DIM, function () { st.view = "settings"; st.diag = null; draw(); }));
  root.appendChild(w);
  drawLive();
  drawRank();
}

// ---- data refresh ---------------------------------------------------------

function refresh(withStats) {
  const jobs = [api("snapshot")];
  if (withStats) jobs.push(api("stats"));
  return Promise.all(jobs).then(function (r) {
    st.snap = r[0];
    if (r[1]) st.stats = r[1].stats;
    if (r[0].lang && r[0].lang !== lang) { lang = r[0].lang; S = build(lang); draw(); return; }
    if (st.view === "main") { drawLive(); if (withStats) drawRank(); }
  }).catch(function () {});
}

function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
function startTimer() {
  stopTimer();
  st.ticks = 0;
  timer = setInterval(function () {
    if (!root || !root.isConnected) { stopTimer(); return; }
    st.ticks++;
    refresh(st.ticks % 12 === 0);
  }, 5000);
}

Framey.register({
  name: "Battery Detective",
  short: "Battery",
  render: function (box) {
    root = box;
    st.view = "main";
    st.sure = false;
    draw();
    refresh(true);
    startTimer();
  },
});
