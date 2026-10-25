// SteamGridDB for Framey: pick Steam artwork from SteamGridDB inside the VR panel.
const ID = "steamgriddb";
const CODES = ["de", "en", "fr", "es", "it", "pt"];
const NAMES = { de: "Deutsch", en: "English", fr: "Français", es: "Español", it: "Italiano", pt: "Português" };

// Translations. Missing keys fall back to English. To add a language: add its code to
// CODES and NAMES above (and to LANGS in backend.py), then add a block here.
const LANGS = {
  en: {
    installed: "Installed games", noGames: "No installed games found.", reload: "Reload",
    appidPh: "Steam app ID", open: "Open", back: "‹ Back", language: "Language",
    keyTitle: "API key", keyText: "SteamGridDB needs a free API key (steamgriddb.com → profile → Preferences → API).",
    keyPh: "Paste API key", keySave: "Save", keyChange: "Change API key",
    keyFile: "If typing does not work here: save the key over SSH to ~/.config/framey/steamgriddb.json as {\"api_key\": \"...\"}.",
    loading: "Loading …", more: "Load more", empty: "No images found.", applying: "Applying …",
    done: "Applied, but Steam may only show it after restarting SteamVR (instant refresh unavailable).", doneLive: "Applied and refreshed right away.", diagBtn: "Check Steam interface", diagHint: "Shows whether instant artwork refresh is available. Handy for bug reports.", failed: "Failed: ",
    reset: "Remove custom artwork", resetDone: "Reset.", custom: "Custom artwork active",
    kinds: { grid_p: "Portrait", grid_w: "Wide", hero: "Hero", logo: "Logo", icon: "Icon" },
    err: {
      no_key: "No API key saved.", bad_key: "Invalid API key.", bad_key_format: "That key looks invalid.",
      not_found: "Nothing on SteamGridDB for this game.", no_steam: "Steam folder not found.",
      no_user: "No Steam user folder found.", timeout: "Timed out.", network: "Network error.",
      io: "File error.", bad_appid: "Invalid app ID.", too_large: "Image too large.",
      bad_image: "Unsupported image format.", bad_data: "Unexpected response.", generic: "Unknown error.",
    },
  },
  de: {
    installed: "Installierte Spiele", noGames: "Keine installierten Spiele gefunden.", reload: "Neu laden",
    appidPh: "Steam-App-ID", open: "Öffnen", back: "‹ Zurück", language: "Sprache",
    keyTitle: "API-Key", keyText: "Für SteamGridDB brauchst du einen kostenlosen API-Key (steamgriddb.com → Profil → Preferences → API).",
    keyPh: "API-Key einfügen", keySave: "Speichern", keyChange: "API-Key ändern",
    keyFile: "Falls die Eingabe hier nicht geht: Key per SSH in ~/.config/framey/steamgriddb.json als {\"api_key\": \"...\"} speichern.",
    loading: "Lade …", more: "Mehr laden", empty: "Keine Bilder gefunden.", applying: "Wird gesetzt …",
    done: "Gesetzt. Steam zeigt es eventuell erst nach einem SteamVR-Neustart (Sofort-Aktualisierung nicht verfügbar).", doneLive: "Gesetzt und sofort aktualisiert.", diagBtn: "Steam-Schnittstelle prüfen", diagHint: "Zeigt, ob die Sofort-Aktualisierung verfügbar ist. Nützlich für Fehlerberichte.", failed: "Fehlgeschlagen: ",
    reset: "Eigenes Artwork entfernen", resetDone: "Zurückgesetzt.", custom: "Eigenes Artwork aktiv",
    kinds: { grid_p: "Cover hoch", grid_w: "Cover breit", hero: "Hero", logo: "Logo", icon: "Icon" },
    err: {
      no_key: "Kein API-Key gespeichert.", bad_key: "API-Key ungültig.", bad_key_format: "Der Key sieht ungültig aus.",
      not_found: "Für dieses Spiel gibt es nichts bei SteamGridDB.", no_steam: "Steam-Ordner nicht gefunden.",
      no_user: "Kein Steam-Benutzerordner gefunden.", timeout: "Zeitüberschreitung.", network: "Netzwerkfehler.",
      io: "Dateifehler.", bad_appid: "Ungültige App-ID.", too_large: "Bild zu groß.",
      bad_image: "Bildformat nicht unterstützt.", bad_data: "Unerwartete Antwort.", generic: "Unbekannter Fehler.",
    },
  },
  fr: {
    installed: "Jeux installés", noGames: "Aucun jeu installé trouvé.", reload: "Recharger",
    appidPh: "ID d'application Steam", open: "Ouvrir", back: "‹ Retour", language: "Langue",
    keyTitle: "Clé API", keyText: "SteamGridDB nécessite une clé API gratuite (steamgriddb.com → profil → Preferences → API).",
    keyPh: "Coller la clé API", keySave: "Enregistrer", keyChange: "Changer la clé API",
    keyFile: "Si la saisie ne fonctionne pas ici : enregistrez la clé via SSH dans ~/.config/framey/steamgriddb.json sous la forme {\"api_key\": \"...\"}.",
    loading: "Chargement …", more: "Charger plus", empty: "Aucune image trouvée.", applying: "Application …",
    done: "Appliqué, mais Steam ne l'affichera peut-être qu'après un redémarrage de SteamVR (actualisation immédiate indisponible).", doneLive: "Appliqué et actualisé immédiatement.", diagBtn: "Vérifier l'interface Steam", diagHint: "Indique si l'actualisation immédiate est disponible. Utile pour les rapports de bug.", failed: "Échec : ",
    reset: "Supprimer l'illustration personnalisée", resetDone: "Réinitialisé.", custom: "Illustration personnalisée active",
    kinds: { grid_p: "Portrait", grid_w: "Large", hero: "Hero", logo: "Logo", icon: "Icône" },
    err: {
      no_key: "Aucune clé API enregistrée.", bad_key: "Clé API invalide.", bad_key_format: "Cette clé semble invalide.",
      not_found: "Rien sur SteamGridDB pour ce jeu.", no_steam: "Dossier Steam introuvable.",
      no_user: "Aucun dossier utilisateur Steam trouvé.", timeout: "Délai dépassé.", network: "Erreur réseau.",
      io: "Erreur de fichier.", bad_appid: "ID d'application invalide.", too_large: "Image trop grande.",
      bad_image: "Format d'image non pris en charge.", bad_data: "Réponse inattendue.", generic: "Erreur inconnue.",
    },
  },
  es: {
    installed: "Juegos instalados", noGames: "No se encontraron juegos instalados.", reload: "Recargar",
    appidPh: "ID de aplicación de Steam", open: "Abrir", back: "‹ Atrás", language: "Idioma",
    keyTitle: "Clave de API", keyText: "SteamGridDB necesita una clave de API gratuita (steamgriddb.com → perfil → Preferences → API).",
    keyPh: "Pegar clave de API", keySave: "Guardar", keyChange: "Cambiar clave de API",
    keyFile: "Si aquí no se puede escribir: guarda la clave por SSH en ~/.config/framey/steamgriddb.json como {\"api_key\": \"...\"}.",
    loading: "Cargando …", more: "Cargar más", empty: "No se encontraron imágenes.", applying: "Aplicando …",
    done: "Aplicado, pero Steam quizá solo lo muestre tras reiniciar SteamVR (actualización instantánea no disponible).", doneLive: "Aplicado y actualizado al instante.", diagBtn: "Comprobar la interfaz de Steam", diagHint: "Muestra si la actualización instantánea está disponible. Útil para informes de errores.", failed: "Error: ",
    reset: "Quitar arte personalizado", resetDone: "Restablecido.", custom: "Arte personalizado activo",
    kinds: { grid_p: "Vertical", grid_w: "Horizontal", hero: "Hero", logo: "Logo", icon: "Icono" },
    err: {
      no_key: "No hay ninguna clave de API guardada.", bad_key: "Clave de API no válida.", bad_key_format: "La clave parece no válida.",
      not_found: "No hay nada en SteamGridDB para este juego.", no_steam: "No se encontró la carpeta de Steam.",
      no_user: "No se encontró ninguna carpeta de usuario de Steam.", timeout: "Tiempo de espera agotado.", network: "Error de red.",
      io: "Error de archivo.", bad_appid: "ID de aplicación no válida.", too_large: "Imagen demasiado grande.",
      bad_image: "Formato de imagen no compatible.", bad_data: "Respuesta inesperada.", generic: "Error desconocido.",
    },
  },
  it: {
    installed: "Giochi installati", noGames: "Nessun gioco installato trovato.", reload: "Ricarica",
    appidPh: "ID app Steam", open: "Apri", back: "‹ Indietro", language: "Lingua",
    keyTitle: "Chiave API", keyText: "SteamGridDB richiede una chiave API gratuita (steamgriddb.com → profilo → Preferences → API).",
    keyPh: "Incolla la chiave API", keySave: "Salva", keyChange: "Cambia chiave API",
    keyFile: "Se qui non puoi digitare: salva la chiave via SSH in ~/.config/framey/steamgriddb.json come {\"api_key\": \"...\"}.",
    loading: "Caricamento …", more: "Carica altro", empty: "Nessuna immagine trovata.", applying: "Applicazione …",
    done: "Applicato, ma Steam potrebbe mostrarlo solo dopo il riavvio di SteamVR (aggiornamento immediato non disponibile).", doneLive: "Applicato e aggiornato subito.", diagBtn: "Controlla l'interfaccia di Steam", diagHint: "Mostra se l'aggiornamento immediato è disponibile. Utile per segnalare errori.", failed: "Errore: ",
    reset: "Rimuovi artwork personalizzato", resetDone: "Ripristinato.", custom: "Artwork personalizzato attivo",
    kinds: { grid_p: "Verticale", grid_w: "Orizzontale", hero: "Hero", logo: "Logo", icon: "Icona" },
    err: {
      no_key: "Nessuna chiave API salvata.", bad_key: "Chiave API non valida.", bad_key_format: "La chiave sembra non valida.",
      not_found: "Niente su SteamGridDB per questo gioco.", no_steam: "Cartella di Steam non trovata.",
      no_user: "Nessuna cartella utente di Steam trovata.", timeout: "Tempo scaduto.", network: "Errore di rete.",
      io: "Errore file.", bad_appid: "ID app non valido.", too_large: "Immagine troppo grande.",
      bad_image: "Formato immagine non supportato.", bad_data: "Risposta imprevista.", generic: "Errore sconosciuto.",
    },
  },
  pt: {
    installed: "Jogos instalados", noGames: "Nenhum jogo instalado encontrado.", reload: "Recarregar",
    appidPh: "ID do app Steam", open: "Abrir", back: "‹ Voltar", language: "Idioma",
    keyTitle: "Chave de API", keyText: "O SteamGridDB precisa de uma chave de API gratuita (steamgriddb.com → perfil → Preferences → API).",
    keyPh: "Colar chave de API", keySave: "Salvar", keyChange: "Alterar chave de API",
    keyFile: "Se não for possível digitar aqui: salve a chave via SSH em ~/.config/framey/steamgriddb.json como {\"api_key\": \"...\"}.",
    loading: "Carregando …", more: "Carregar mais", empty: "Nenhuma imagem encontrada.", applying: "Aplicando …",
    done: "Aplicado, mas o Steam talvez só mostre após reiniciar o SteamVR (atualização imediata indisponível).", doneLive: "Aplicado e atualizado na hora.", diagBtn: "Verificar a interface do Steam", diagHint: "Mostra se a atualização imediata está disponível. Útil para relatar erros.", failed: "Falha: ",
    reset: "Remover arte personalizada", resetDone: "Redefinido.", custom: "Arte personalizada ativa",
    kinds: { grid_p: "Vertical", grid_w: "Horizontal", hero: "Hero", logo: "Logo", icon: "Ícone" },
    err: {
      no_key: "Nenhuma chave de API salva.", bad_key: "Chave de API inválida.", bad_key_format: "A chave parece inválida.",
      not_found: "Não há nada no SteamGridDB para este jogo.", no_steam: "Pasta do Steam não encontrada.",
      no_user: "Nenhuma pasta de usuário do Steam encontrada.", timeout: "Tempo esgotado.", network: "Erro de rede.",
      io: "Erro de arquivo.", bad_appid: "ID de app inválido.", too_large: "Imagem grande demais.",
      bad_image: "Formato de imagem não suportado.", bad_data: "Resposta inesperada.", generic: "Erro desconhecido.",
    },
  },
};

function pick(code) {
  const c = String(code || "").toLowerCase().slice(0, 2);
  return CODES.indexOf(c) >= 0 ? c : "en";
}

function build(code) {
  const b = LANGS.en, l = LANGS[code] || {};
  const o = Object.assign({}, b, l);
  o.kinds = Object.assign({}, b.kinds, l.kinds);
  o.err = Object.assign({}, b.err, l.err);
  return o;
}

let lang = pick(navigator.language);
let S = build(lang);

const KINDS = ["grid_p", "grid_w", "hero", "logo", "icon"];
const SIZE = { grid_p: [150, 225], grid_w: [270, 128], hero: [340, 110], logo: [230, 110], icon: [96, 96] };

const st = {
  status: null, games: null, loading: false, homeErr: "", editKey: false,
  appid: null, name: "", kind: "grid_p", items: null, page: 0, more: false,
  has: {}, busy: false, req: 0, listErr: "", diag: null,
};
let root = null;

function errText(e) {
  const m = String((e && e.message) || e);
  return S.err[m] || (m.indexOf("http_") === 0 ? "HTTP " + m.slice(5) : S.err.generic);
}

function setLang(code, save) {
  lang = code;
  S = build(code);
  if (save) api("set_lang", { lang: code }).catch(function () {});
  draw();
}

function api(method, arg) {
  return Promise.race([
    Framey.call(ID, method, arg),
    new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, 60000); }),
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

const BTN = "padding:14px 22px;font-size:22px;border-radius:12px;background:#3d6fd6;color:#fff;margin:6px 0;";
const BTN_DIM = "padding:14px 22px;font-size:22px;border-radius:12px;background:#3a434b;color:#fff;margin:6px 0;";

function draw() {
  if (!root) return;
  root.textContent = "";
  root.appendChild(st.appid ? detailView() : homeView());
}

// ---- home -----------------------------------------------------------------

function loadHome() {
  if (st.loading) return;
  st.loading = true;
  Promise.all([api("status"), api("games")]).then(function (r) {
    st.status = r[0];
    st.games = r[1].games || [];
    st.homeErr = "";
    if (r[0].lang && r[0].lang !== lang) { lang = r[0].lang; S = build(lang); }
  }).catch(function (e) {
    st.status = {};
    st.games = [];
    st.homeErr = errText(e);
  }).then(function () {
    st.loading = false;
    draw();
  });
}

function homeView() {
  const w = Framey.el("padding:8px;color:#e6e9ec;");
  w.appendChild(Framey.el("font-size:32px;font-weight:600;margin-bottom:14px;", "SteamGridDB"));
  if (st.status === null) {
    loadHome();
    w.appendChild(Framey.el("font-size:22px;color:#9aa5af;", S.loading));
    return w;
  }
  if (st.homeErr) w.appendChild(Framey.el("font-size:22px;color:#ff8a80;margin-bottom:10px;", st.homeErr));

  if (!st.status.has_key || st.editKey) {
    w.appendChild(Framey.el("font-size:26px;font-weight:600;margin:6px 0;", S.keyTitle));
    w.appendChild(Framey.el("font-size:20px;color:#9aa5af;", S.keyText));
    const inp = field(S.keyPh);
    w.appendChild(inp);
    w.appendChild(Framey.button(S.keySave, BTN, function () {
      api("set_key", { key: inp.value }).then(function () {
        st.status.has_key = true;
        st.editKey = false;
        draw();
      }).catch(function (e) { Framey.toast(S.failed + errText(e), 4000); });
    }));
    w.appendChild(Framey.el("font-size:17px;color:#7d8791;margin-top:6px;", S.keyFile));
  } else {
    w.appendChild(Framey.button(S.keyChange, BTN_DIM, function () { st.editKey = true; draw(); }));
  }

  w.appendChild(Framey.el("font-size:26px;font-weight:600;margin:18px 0 6px;", S.appidPh));
  const idInp = field(S.appidPh);
  idInp.setAttribute("inputmode", "numeric");
  w.appendChild(idInp);
  w.appendChild(Framey.button(S.open, BTN, function () {
    const v = idInp.value.trim();
    if (/^[0-9]{1,10}$/.test(v)) select(v, "App " + v);
  }));

  w.appendChild(Framey.el("font-size:26px;font-weight:600;margin:18px 0 6px;", S.installed));
  if (!st.games.length) w.appendChild(Framey.el("font-size:20px;color:#9aa5af;", S.noGames));
  st.games.forEach(function (g) {
    const row = Framey.el("padding:16px 20px;margin:8px 0;border-radius:14px;background:#2a3138;font-size:24px;cursor:pointer;", g.name);
    row.appendChild(Framey.el("font-size:16px;color:#7d8791;", String(g.appid)));
    row.onclick = function () { select(g.appid, g.name); };
    w.appendChild(row);
  });
  w.appendChild(Framey.button(S.reload, BTN_DIM, function () { st.status = null; st.games = null; draw(); }));

  w.appendChild(Framey.el("font-size:26px;font-weight:600;margin:18px 0 6px;", S.language));
  const langs = Framey.el("display:flex;flex-wrap:wrap;gap:8px;", "");
  CODES.forEach(function (c) {
    langs.appendChild(Framey.button(NAMES[c], c === lang ? BTN : BTN_DIM, function () {
      if (c !== lang) setLang(c, true);
    }));
  });
  w.appendChild(langs);

  w.appendChild(Framey.el("font-size:26px;font-weight:600;margin:18px 0 6px;", S.diagBtn));
  w.appendChild(Framey.el("font-size:17px;color:#7d8791;", S.diagHint));
  w.appendChild(Framey.button(S.diagBtn, BTN_DIM, function () { st.diag = steamDiag(); draw(); }));
  if (st.diag) {
    w.appendChild(Framey.el("font-family:monospace;font-size:15px;white-space:pre-wrap;word-break:break-all;background:#14181c;padding:10px;border-radius:8px;color:#c4ccd3;",
      JSON.stringify(st.diag, null, 1)));
  }
  return w;
}

// ---- detail ---------------------------------------------------------------

function select(appid, name) {
  st.appid = appid;
  st.name = name;
  st.kind = "grid_p";
  st.has = {};
  api("has", { appid: appid }).then(function (r) { st.has = r.has || {}; draw(); }).catch(function () {});
  switchKind("grid_p");
}

function switchKind(kind) {
  st.kind = kind;
  st.items = null;
  st.page = 0;
  st.more = false;
  st.listErr = "";
  loadItems();
  draw();
}

function loadItems() {
  const token = ++st.req;
  const kind = st.kind;
  st.loading = true;
  api("list", { appid: st.appid, kind: kind, page: st.page }).then(function (r) {
    if (token !== st.req) return;
    st.items = (st.items || []).concat(r.items || []);
    st.more = !!r.more;
    st.listErr = "";
  }).catch(function (e) {
    if (token !== st.req) return;
    st.items = st.items || [];
    st.listErr = errText(e);
  }).then(function () {
    if (token !== st.req) return;
    st.loading = false;
    draw();
  });
}

// ---- applying artwork -----------------------------------------------------
// Steam's own call (the one Decky uses) sets artwork and refreshes the UI at once. Asset types
// follow Steam's grid file order: portrait 0, hero 1, logo 2, wide 3, icon 4.
// If the call is missing or fails, the image is written into the grid folder as a fallback
// (Steam then shows it after a restart).
const STEAM_TYPE = { grid_p: 0, hero: 1, logo: 2, grid_w: 3, icon: 4 };

function steamApps() {
  try { return (window.SteamClient && window.SteamClient.Apps) || null; } catch (e) { return null; }
}
function attempt(fn, ms) {
  return Promise.race([
    new Promise(function (res) { res(fn()); }),
    new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); }),
  ]);
}
function steamDiag() {
  const d = { steamClient: false, apps: false, setArtwork: false, clearArtwork: false, related: [] };
  try {
    const sc = window.SteamClient;
    const a = sc && sc.Apps;
    d.steamClient = !!sc;
    d.apps = !!a;
    if (a) {
      d.setArtwork = typeof a.SetCustomArtworkForApp === "function";
      d.clearArtwork = typeof a.ClearCustomArtworkForApp === "function";
      for (const k in a) { if (/artwork|custom|image|asset|icon/i.test(k) && d.related.length < 20) d.related.push(k); }
    }
  } catch (e) { d.error = String((e && e.message) || e); }
  return d;
}

function applyItem(it) {
  if (st.busy) return;
  st.busy = true;
  Framey.toast(S.applying, 1500);
  const kind = st.kind, appid = st.appid;
  const apps = steamApps();
  const viaFile = function () {
    return api("apply", { appid: appid, kind: kind, url: it.url }).then(function () { Framey.toast(S.done, 6000); });
  };
  let job;
  if (apps && typeof apps.SetCustomArtworkForApp === "function") {
    job = api("fetch", { url: it.url }).then(function (r) {
      return attempt(function () {
        return apps.SetCustomArtworkForApp(Number(appid), r.data, r.ext, STEAM_TYPE[kind]);
      }, 20000);
    }).then(function () {
      Framey.toast(S.doneLive, 4000);
    }).catch(viaFile);
  } else {
    job = viaFile();
  }
  job.then(function () {
    st.has[kind] = true;
  }).catch(function (e) {
    Framey.toast(S.failed + errText(e), 5000);
  }).then(function () {
    st.busy = false;
    draw();
  });
}

function resetItem(appid, kind) {
  const apps = steamApps();
  const live = apps && typeof apps.ClearCustomArtworkForApp === "function"
    ? attempt(function () { return apps.ClearCustomArtworkForApp(Number(appid), STEAM_TYPE[kind]); }, 10000).catch(function () {})
    : Promise.resolve();
  return live.then(function () { return api("reset", { appid: appid, kind: kind }); });
}

function tile(it) {
  const sz = SIZE[st.kind];
  const t = Framey.el("width:" + sz[0] + "px;cursor:pointer;", "");
  const img = document.createElement("img");
  img.setAttribute("data-fy", "1");
  img.setAttribute("loading", "lazy");
  img.style.cssText = "display:block;width:" + sz[0] + "px;height:" + sz[1] +
    "px;object-fit:contain;background:#14181c;border-radius:10px;border:2px solid #3a434b;box-sizing:border-box;";
  img.onerror = function () {
    img.onerror = null;
    api("thumb", { url: it.thumb }).then(function (r) { img.src = r.data; }).catch(function () {});
  };
  img.src = it.thumb;
  t.appendChild(img);
  if (it.author) {
    t.appendChild(Framey.el("font-size:15px;color:#7d8791;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;", it.author));
  }
  t.onclick = function () { applyItem(it); };
  return t;
}

function detailView() {
  const w = Framey.el("padding:8px;color:#e6e9ec;");
  w.appendChild(Framey.button(S.back, BTN_DIM, function () {
    st.appid = null;
    st.req++;
    st.loading = false;
    draw();
  }));
  w.appendChild(Framey.el("font-size:30px;font-weight:600;margin:10px 0;", st.name));

  const tabs = Framey.el("display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;", "");
  KINDS.forEach(function (k) {
    tabs.appendChild(Framey.button(S.kinds[k], k === st.kind ? BTN : BTN_DIM, function () {
      if (k !== st.kind) switchKind(k);
    }));
  });
  w.appendChild(tabs);

  if (st.has[st.kind]) {
    const bar = Framey.el("display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:8px 0;", "");
    bar.appendChild(Framey.el("font-size:20px;color:#7fd18b;", S.custom));
    bar.appendChild(Framey.button(S.reset, BTN_DIM, function () {
      resetItem(st.appid, st.kind).then(function () {
        st.has[st.kind] = false;
        Framey.toast(S.resetDone, 2500);
        draw();
      }).catch(function (e) { Framey.toast(S.failed + errText(e), 4000); });
    }));
    w.appendChild(bar);
  }

  if (st.listErr) w.appendChild(Framey.el("font-size:22px;color:#ff8a80;margin:10px 0;", st.listErr));
  if (st.items === null) {
    w.appendChild(Framey.el("font-size:22px;color:#9aa5af;margin:10px 0;", S.loading));
    return w;
  }
  if (!st.items.length && !st.listErr) w.appendChild(Framey.el("font-size:22px;color:#9aa5af;margin:10px 0;", S.empty));

  const grid = Framey.el("display:flex;flex-wrap:wrap;gap:14px;margin:12px 0;", "");
  st.items.forEach(function (it) { grid.appendChild(tile(it)); });
  w.appendChild(grid);

  if (st.more) {
    w.appendChild(Framey.button(st.loading ? S.loading : S.more, BTN_DIM, function () {
      if (st.loading) return;
      st.page++;
      loadItems();
      draw();
    }));
  }
  return w;
}

Framey.register({
  name: "SteamGridDB",
  short: "Artwork",
  render: function (box) {
    root = box;
    st.appid = null;
    st.req++;
    st.loading = false;
    draw();
  },
});
