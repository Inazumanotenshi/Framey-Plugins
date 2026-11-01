// Battery Detective for Framey: battery drain per game, live readout, ETA.
const ID = "battery-detective";
const CODES = ["de", "en", "fr", "es", "it", "pt", "nl", "pl", "sv", "ru", "uk", "tr", "ja", "ko", "zh"];
const NAMES = { de: "Deutsch", en: "English", fr: "Français", es: "Español", it: "Italiano", pt: "Português",
  nl: "Nederlands", pl: "Polski", sv: "Svenska", ru: "Русский", uk: "Українська", tr: "Türkçe", ja: "日本語", ko: "한국어", zh: "简体中文" };

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
    recOn: "Recording", recOff: "Recording paused", recOnHint: "Battery use is being logged per game.",
    recOffHint: "The live readout keeps running; nothing is added to the game stats.", recStop: "Pause", recStart: "Resume",
    health: "Battery health", cycles: "charge cycles", saveTitle: "Battery Save (charge limit)",
    saveHint: "Stopping at 80 % instead of 100 % keeps lithium batteries healthy for longer.", off: "Off", modeHw: "Supported: the charger itself stops at the limit, even while Framey is closed.",
    modeSoft: "Charging pauses at the limit while Framey is running. With Framey closed it charges to 100 %.", modeRo: "Your headset has a charge limit, but Framey has no permission to set it (needs root). You get a reminder instead.", modeNone: "Your headset doesn't offer a charge limit. You get a reminder instead once the limit is reached.",
    limitHit: "Battery has reached {n} %. Unplug now to spare the battery.", limitErr: "Couldn't set the charge limit (write error). The reminder is active instead.",
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
    recOn: "Aufzeichnung läuft", recOff: "Aufzeichnung pausiert", recOnHint: "Der Akkuverbrauch wird pro Spiel erfasst.",
    recOffHint: "Die Live-Anzeige läuft weiter, in die Spielstatistik kommt nichts dazu.", recStop: "Pausieren", recStart: "Fortsetzen",
    health: "Akku-Gesundheit", cycles: "Ladezyklen", saveTitle: "Battery Save (Ladelimit)",
    saveHint: "Nur bis 80 % statt 100 % zu laden hält Lithium-Akkus länger fit.", off: "Aus", modeHw: "Unterstützt: Der Ladechip stoppt selbst beim Limit, auch wenn Framey geschlossen ist.",
    modeSoft: "Das Laden pausiert beim Limit, solange Framey läuft. Ohne Framey lädt es bis 100 %.", modeRo: "Dein Headset hat ein Ladelimit, aber Framey darf es nicht setzen (Root nötig). Du bekommst stattdessen einen Hinweis.", modeNone: "Dein Headset bietet kein Ladelimit an. Du bekommst stattdessen einen Hinweis, sobald das Limit erreicht ist.",
    limitHit: "Akku hat {n} % erreicht. Jetzt abstecken schont den Akku.", limitErr: "Ladelimit konnte nicht gesetzt werden (Schreibfehler). Stattdessen ist der Hinweis aktiv.",
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
    recOn: "Enregistrement", recOff: "Enregistrement en pause", recOnHint: "La consommation est enregistrée pour chaque jeu.",
    recOffHint: "L'affichage en direct continue ; rien n'est ajouté aux statistiques.", recStop: "Pause", recStart: "Reprendre",
    health: "Santé de la batterie", cycles: "cycles de charge", saveTitle: "Battery Save (limite de charge)",
    saveHint: "S'arrêter à 80 % au lieu de 100 % préserve plus longtemps les batteries lithium.", off: "Désactivé", modeHw: "Pris en charge : le chargeur s'arrête lui-même à la limite, même Framey fermé.",
    modeSoft: "La charge s'interrompt à la limite tant que Framey tourne. Framey fermé, elle va jusqu'à 100 %.", modeRo: "Votre casque a une limite de charge, mais Framey n'a pas le droit de la régler (root requis). Vous recevrez un rappel à la place.", modeNone: "Votre casque ne propose pas de limite de charge. Vous recevrez un rappel une fois la limite atteinte.",
    limitHit: "La batterie a atteint {n} %. Débranchez maintenant pour la ménager.", limitErr: "Impossible de régler la limite (erreur d'écriture). Le rappel est actif à la place.",
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
    recOn: "Grabando", recOff: "Grabación en pausa", recOnHint: "El consumo se registra por juego.",
    recOffHint: "La lectura en vivo sigue; no se añade nada a las estadísticas.", recStop: "Pausar", recStart: "Reanudar",
    health: "Salud de la batería", cycles: "ciclos de carga", saveTitle: "Battery Save (límite de carga)",
    saveHint: "Cargar hasta el 80 % en vez del 100 % mantiene sanas las baterías de litio por más tiempo.", off: "Desactivado", modeHw: "Compatible: el cargador se detiene solo en el límite, incluso con Framey cerrado.",
    modeSoft: "La carga se pausa en el límite mientras Framey está abierto. Con Framey cerrado carga hasta el 100 %.", modeRo: "Tu visor tiene límite de carga, pero Framey no tiene permiso para fijarlo (requiere root). Recibirás un aviso en su lugar.", modeNone: "Tu visor no ofrece límite de carga. Recibirás un aviso al alcanzar el límite.",
    limitHit: "La batería ha llegado al {n} %. Desconéctala ahora para cuidarla.", limitErr: "No se pudo fijar el límite (error de escritura). El aviso está activo en su lugar.",
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
    recOn: "Registrazione attiva", recOff: "Registrazione in pausa", recOnHint: "Il consumo viene registrato per ogni gioco.",
    recOffHint: "La lettura live continua; nulla viene aggiunto alle statistiche.", recStop: "Pausa", recStart: "Riprendi",
    health: "Salute della batteria", cycles: "cicli di ricarica", saveTitle: "Battery Save (limite di carica)",
    saveHint: "Fermarsi all'80 % invece che al 100 % mantiene le batterie al litio in salute più a lungo.", off: "Off", modeHw: "Supportato: il caricatore si ferma da solo al limite, anche con Framey chiuso.",
    modeSoft: "La ricarica si mette in pausa al limite finché Framey è attivo. Con Framey chiuso carica fino al 100 %.", modeRo: "Il visore ha un limite di carica, ma Framey non ha i permessi per impostarlo (serve root). Riceverai invece un promemoria.", modeNone: "Il visore non offre un limite di carica. Riceverai un promemoria al raggiungimento del limite.",
    limitHit: "La batteria ha raggiunto il {n} %. Scollegala ora per preservarla.", limitErr: "Impossibile impostare il limite (errore di scrittura). È attivo il promemoria.",
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
    recOn: "Gravando", recOff: "Gravação pausada", recOnHint: "O consumo é registrado por jogo.",
    recOffHint: "A leitura ao vivo continua; nada é somado às estatísticas.", recStop: "Pausar", recStart: "Retomar",
    health: "Saúde da bateria", cycles: "ciclos de carga", saveTitle: "Battery Save (limite de carga)",
    saveHint: "Parar em 80 % em vez de 100 % mantém baterias de lítio saudáveis por mais tempo.", off: "Desligado", modeHw: "Suportado: o carregador para sozinho no limite, mesmo com o Framey fechado.",
    modeSoft: "A carga pausa no limite enquanto o Framey está aberto. Com o Framey fechado, carrega até 100 %.", modeRo: "Seu headset tem limite de carga, mas o Framey não tem permissão para defini-lo (requer root). Você receberá um lembrete.", modeNone: "Seu headset não oferece limite de carga. Você receberá um lembrete quando o limite for atingido.",
    limitHit: "A bateria chegou a {n} %. Desconecte agora para poupá-la.", limitErr: "Não foi possível definir o limite (erro de escrita). O lembrete está ativo.",
  },
  nl: {
    back: "‹ Terug", settings: "Instellingen", language: "Taal",
    source: "Accubron", auto: "Automatisch", diag: "Diagnose tonen",
    diagHint: "Ruwe waarden van de stroomvoorziening, handig voor foutmeldingen.", noDiag: "Geen accu's gevonden.", running: "Gedetecteerde actieve app-ID",
    none: "geen", reset: "Alle gegevens wissen", resetSure: "Tik nogmaals om te bevestigen",
    resetDone: "Gegevens gewist.", failed: "Mislukt: ", loading: "Laden …",
    noBattery: "Geen accu gevonden. Open Instellingen → diagnose.", charging: "Laadt", discharging: "Ontlaadt",
    full: "Vol", other: "Ontlaadt niet", etaLive: "Resterende tijd (live)",
    etaHist: "Resterende tijd (uit geschiedenis)", etaWait: "Resterende tijd: gegevens verzamelen …", nowPlaying: "Nu bezig",
    session: "sessie", noGame: "Geen game actief", chartW: "Stroomverbruik, afgelopen uur (W)",
    chartP: "Laadniveau, afgelopen uur (%)", rankTitle: "Accuverbruik per game", idle: "Menu / inactief",
    avg: "gem.", fullBat: "met een volle accu", sessions: "sessies",
    measured: "gemeten", tooLittle: "nog te weinig gegevens", noStats: "Nog geen gegevens. Speel iets terwijl de headset op de accu draait.",
    recOn: "Opname loopt", recOff: "Opname gepauzeerd", recOnHint: "Het accuverbruik wordt per game vastgelegd.",
    recOffHint: "De live-weergave loopt door; er wordt niets aan de statistieken toegevoegd.", recStop: "Pauzeren", recStart: "Hervatten",
    health: "Accuconditie", cycles: "laadcycli", saveTitle: "Battery Save (laadlimiet)",
    saveHint: "Tot 80 % in plaats van 100 % laden houdt lithiumaccu's langer gezond.", off: "Uit", modeHw: "Ondersteund: de lader stopt zelf bij de limiet, ook als Framey gesloten is.",
    modeSoft: "Het laden pauzeert bij de limiet zolang Framey draait. Zonder Framey laadt hij tot 100 %.", modeRo: "Je headset heeft een laadlimiet, maar Framey mag die niet instellen (root nodig). Je krijgt in plaats daarvan een melding.", modeNone: "Je headset biedt geen laadlimiet. Je krijgt een melding zodra de limiet is bereikt.",
    limitHit: "De accu is op {n} %. Koppel nu los om de accu te sparen.", limitErr: "Laadlimiet kon niet worden ingesteld (schrijffout). De melding is in plaats daarvan actief.",
  },
  pl: {
    back: "‹ Wstecz", settings: "Ustawienia", language: "Język",
    source: "Źródło baterii", auto: "Automatycznie", diag: "Pokaż diagnostykę",
    diagHint: "Surowe wartości zasilania, przydatne w zgłoszeniach błędów.", noDiag: "Nie znaleziono baterii.", running: "Wykryte ID uruchomionej aplikacji",
    none: "brak", reset: "Usuń wszystkie dane", resetSure: "Dotknij ponownie, aby potwierdzić",
    resetDone: "Dane usunięte.", failed: "Błąd: ", loading: "Ładowanie …",
    noBattery: "Nie znaleziono baterii. Otwórz Ustawienia → diagnostyka.", charging: "Ładowanie", discharging: "Rozładowywanie",
    full: "Pełna", other: "Nie rozładowuje się", etaLive: "Pozostały czas (na żywo)",
    etaHist: "Pozostały czas (z historii)", etaWait: "Pozostały czas: zbieranie danych …", nowPlaying: "Teraz gra",
    session: "sesja", noGame: "Żadna gra nie jest uruchomiona", chartW: "Pobór mocy, ostatnia godzina (W)",
    chartP: "Poziom naładowania, ostatnia godzina (%)", rankTitle: "Zużycie baterii na grę", idle: "Menu / bezczynność",
    avg: "śr.", fullBat: "na pełnej baterii", sessions: "sesji",
    measured: "zmierzono", tooLittle: "jeszcze za mało danych", noStats: "Brak danych. Zagraj w coś, gdy gogle działają na baterii.",
    recOn: "Nagrywanie trwa", recOff: "Nagrywanie wstrzymane", recOnHint: "Zużycie baterii jest zapisywane dla każdej gry.",
    recOffHint: "Podgląd na żywo działa dalej; nic nie trafia do statystyk.", recStop: "Wstrzymaj", recStart: "Wznów",
    health: "Kondycja baterii", cycles: "cykli ładowania", saveTitle: "Battery Save (limit ładowania)",
    saveHint: "Ładowanie do 80 % zamiast 100 % dłużej utrzymuje baterie litowe w dobrej kondycji.", off: "Wył.", modeHw: "Obsługiwane: ładowarka sama zatrzymuje się na limicie, nawet gdy Framey jest zamknięty.",
    modeSoft: "Ładowanie wstrzymuje się na limicie, dopóki działa Framey. Bez Framey ładuje do 100 %.", modeRo: "Gogle mają limit ładowania, ale Framey nie ma uprawnień, by go ustawić (wymagany root). Zamiast tego dostaniesz przypomnienie.", modeNone: "Gogle nie oferują limitu ładowania. Dostaniesz przypomnienie po osiągnięciu limitu.",
    limitHit: "Bateria osiągnęła {n} %. Odłącz teraz, aby ją oszczędzać.", limitErr: "Nie udało się ustawić limitu (błąd zapisu). Zamiast tego aktywne jest przypomnienie.",
  },
  sv: {
    back: "‹ Tillbaka", settings: "Inställningar", language: "Språk",
    source: "Batterikälla", auto: "Automatiskt", diag: "Visa diagnostik",
    diagHint: "Råvärden från strömförsörjningen, praktiska för felrapporter.", noDiag: "Inga batterier hittades.", running: "Upptäckt app-ID som körs",
    none: "inget", reset: "Radera all data", resetSure: "Tryck igen för att bekräfta",
    resetDone: "Data raderad.", failed: "Misslyckades: ", loading: "Laddar …",
    noBattery: "Inget batteri hittades. Öppna Inställningar → diagnostik.", charging: "Laddar", discharging: "Laddar ur",
    full: "Fullt", other: "Laddar inte ur", etaLive: "Tid kvar (live)",
    etaHist: "Tid kvar (från historik)", etaWait: "Tid kvar: samlar data …", nowPlaying: "Spelas nu",
    session: "session", noGame: "Inget spel körs", chartW: "Effektuttag, senaste timmen (W)",
    chartP: "Laddnivå, senaste timmen (%)", rankTitle: "Batteriförbrukning per spel", idle: "Meny / viloläge",
    avg: "snitt", fullBat: "på fullt batteri", sessions: "sessioner",
    measured: "uppmätt", tooLittle: "för lite data än", noStats: "Ingen data än. Spela något medan headsetet körs på batteri.",
    recOn: "Inspelning pågår", recOff: "Inspelning pausad", recOnHint: "Batteriförbrukningen loggas per spel.",
    recOffHint: "Livevisningen fortsätter; inget läggs till i spelstatistiken.", recStop: "Pausa", recStart: "Återuppta",
    health: "Batterihälsa", cycles: "laddcykler", saveTitle: "Battery Save (laddgräns)",
    saveHint: "Att stanna vid 80 % i stället för 100 % håller litiumbatterier friska längre.", off: "Av", modeHw: "Stöds: laddaren stannar själv vid gränsen, även när Framey är stängt.",
    modeSoft: "Laddningen pausas vid gränsen medan Framey körs. Med Framey stängt laddas det till 100 %.", modeRo: "Headsetet har en laddgräns, men Framey saknar behörighet att ställa in den (kräver root). Du får en påminnelse i stället.", modeNone: "Headsetet erbjuder ingen laddgräns. Du får en påminnelse när gränsen nås.",
    limitHit: "Batteriet har nått {n} %. Koppla ur nu för att skona batteriet.", limitErr: "Kunde inte ställa in laddgränsen (skrivfel). Påminnelsen är aktiv i stället.",
  },
  ru: {
    back: "‹ Назад", settings: "Настройки", language: "Язык",
    source: "Источник батареи", auto: "Авто", diag: "Показать диагностику",
    diagHint: "Сырые данные питания, полезны для отчётов об ошибках.", noDiag: "Батареи не найдены.", running: "Обнаруженный ID запущенного приложения",
    none: "нет", reset: "Удалить все данные", resetSure: "Нажмите ещё раз для подтверждения",
    resetDone: "Данные удалены.", failed: "Ошибка: ", loading: "Загрузка …",
    noBattery: "Батарея не найдена. Откройте Настройки → диагностика.", charging: "Заряжается", discharging: "Разряжается",
    full: "Заряжена", other: "Не разряжается", etaLive: "Осталось (сейчас)",
    etaHist: "Осталось (по истории)", etaWait: "Осталось: сбор данных …", nowPlaying: "Сейчас запущено",
    session: "сеанс", noGame: "Игра не запущена", chartW: "Потребление, последний час (Вт)",
    chartP: "Уровень заряда, последний час (%)", rankTitle: "Расход батареи по играм", idle: "Меню / простой",
    avg: "ср.", fullBat: "на полном заряде", sessions: "сеансов",
    measured: "измерено", tooLittle: "пока мало данных", noStats: "Данных пока нет. Поиграйте, пока шлем работает от батареи.",
    recOn: "Запись идёт", recOff: "Запись на паузе", recOnHint: "Расход батареи записывается для каждой игры.",
    recOffHint: "Живые показания продолжаются, в статистику ничего не добавляется.", recStop: "Пауза", recStart: "Продолжить",
    health: "Состояние батареи", cycles: "циклов зарядки", saveTitle: "Battery Save (лимит заряда)",
    saveHint: "Заряд до 80 % вместо 100 % дольше сохраняет литиевые батареи.", off: "Выкл.", modeHw: "Поддерживается: контроллер сам останавливает зарядку на лимите, даже когда Framey закрыт.",
    modeSoft: "Зарядка приостанавливается на лимите, пока работает Framey. Без Framey заряжается до 100 %.", modeRo: "У шлема есть лимит заряда, но у Framey нет прав его установить (нужен root). Вместо этого вы получите напоминание.", modeNone: "Шлем не поддерживает лимит заряда. Вы получите напоминание, когда лимит будет достигнут.",
    limitHit: "Батарея заряжена до {n} %. Отключите зарядку, чтобы поберечь батарею.", limitErr: "Не удалось установить лимит (ошибка записи). Вместо этого включено напоминание.",
  },
  uk: {
    back: "‹ Назад", settings: "Налаштування", language: "Мова",
    source: "Джерело батареї", auto: "Авто", diag: "Показати діагностику",
    diagHint: "Сирі дані живлення, корисні для звітів про помилки.", noDiag: "Батарей не знайдено.", running: "Виявлений ID запущеної програми",
    none: "немає", reset: "Видалити всі дані", resetSure: "Натисніть ще раз для підтвердження",
    resetDone: "Дані видалено.", failed: "Помилка: ", loading: "Завантаження …",
    noBattery: "Батарею не знайдено. Відкрийте Налаштування → діагностика.", charging: "Заряджається", discharging: "Розряджається",
    full: "Заряджена", other: "Не розряджається", etaLive: "Залишилось (наживо)",
    etaHist: "Залишилось (за історією)", etaWait: "Залишилось: збір даних …", nowPlaying: "Зараз запущено",
    session: "сеанс", noGame: "Гра не запущена", chartW: "Споживання, остання година (Вт)",
    chartP: "Рівень заряду, остання година (%)", rankTitle: "Витрата батареї за іграми", idle: "Меню / простій",
    avg: "сер.", fullBat: "на повному заряді", sessions: "сеансів",
    measured: "виміряно", tooLittle: "поки замало даних", noStats: "Даних ще немає. Пограйте, поки шолом працює від батареї.",
    recOn: "Запис триває", recOff: "Запис призупинено", recOnHint: "Витрата батареї записується для кожної гри.",
    recOffHint: "Живі показники працюють далі, до статистики нічого не додається.", recStop: "Пауза", recStart: "Продовжити",
    health: "Стан батареї", cycles: "циклів заряджання", saveTitle: "Battery Save (ліміт заряду)",
    saveHint: "Заряджання до 80 % замість 100 % довше зберігає літієві батареї.", off: "Вимк.", modeHw: "Підтримується: контролер сам зупиняє заряджання на ліміті, навіть коли Framey закрито.",
    modeSoft: "Заряджання призупиняється на ліміті, поки працює Framey. Без Framey заряджає до 100 %.", modeRo: "Шолом має ліміт заряду, але Framey не має прав його встановити (потрібен root). Натомість ви отримаєте нагадування.", modeNone: "Шолом не підтримує ліміт заряду. Ви отримаєте нагадування, коли ліміт буде досягнуто.",
    limitHit: "Батарею заряджено до {n} %. Від'єднайте зарядку, щоб берегти батарею.", limitErr: "Не вдалося встановити ліміт (помилка запису). Натомість увімкнено нагадування.",
  },
  tr: {
    back: "‹ Geri", settings: "Ayarlar", language: "Dil",
    source: "Pil kaynağı", auto: "Otomatik", diag: "Tanılamayı göster",
    diagHint: "Güç kaynağının ham değerleri, hata raporları için kullanışlı.", noDiag: "Pil bulunamadı.", running: "Algılanan çalışan uygulama kimliği",
    none: "yok", reset: "Tüm verileri sil", resetSure: "Onaylamak için tekrar dokun",
    resetDone: "Veriler silindi.", failed: "Başarısız: ", loading: "Yükleniyor …",
    noBattery: "Pil bulunamadı. Ayarlar → tanılama'yı aç.", charging: "Şarj oluyor", discharging: "Deşarj oluyor",
    full: "Dolu", other: "Deşarj olmuyor", etaLive: "Kalan süre (canlı)",
    etaHist: "Kalan süre (geçmişe göre)", etaWait: "Kalan süre: veri toplanıyor …", nowPlaying: "Şu an oynanan",
    session: "oturum", noGame: "Çalışan oyun yok", chartW: "Güç tüketimi, son saat (W)",
    chartP: "Şarj seviyesi, son saat (%)", rankTitle: "Oyun başına pil kullanımı", idle: "Menü / boşta",
    avg: "ort.", fullBat: "dolu pille", sessions: "oturum",
    measured: "ölçüldü", tooLittle: "henüz yeterli veri yok", noStats: "Henüz veri yok. Kulaklık pille çalışırken bir şey oyna.",
    recOn: "Kayıt sürüyor", recOff: "Kayıt duraklatıldı", recOnHint: "Pil kullanımı oyun başına kaydediliyor.",
    recOffHint: "Canlı gösterge çalışmaya devam eder; istatistiklere bir şey eklenmez.", recStop: "Duraklat", recStart: "Devam et",
    health: "Pil sağlığı", cycles: "şarj döngüsü", saveTitle: "Battery Save (şarj sınırı)",
    saveHint: "%100 yerine %80'de durmak lityum pilleri daha uzun süre sağlıklı tutar.", off: "Kapalı", modeHw: "Destekleniyor: şarj denetleyicisi sınırda kendisi durur, Framey kapalıyken bile.",
    modeSoft: "Framey çalıştığı sürece şarj sınırda duraklatılır. Framey kapalıyken %100'e kadar şarj olur.", modeRo: "Kulaklığın şarj sınırı var ama Framey'in bunu ayarlama izni yok (root gerekli). Bunun yerine bir hatırlatma alırsın.", modeNone: "Kulaklık şarj sınırı sunmuyor. Sınıra ulaşıldığında bir hatırlatma alırsın.",
    limitHit: "Pil %{n} seviyesine ulaştı. Pili korumak için şimdi şarjdan çıkar.", limitErr: "Şarj sınırı ayarlanamadı (yazma hatası). Bunun yerine hatırlatma etkin.",
  },
  ja: {
    back: "‹ 戻る", settings: "設定", language: "言語",
    source: "バッテリーの選択", auto: "自動", diag: "診断を表示",
    diagHint: "電源の生データ。不具合報告に役立ちます。", noDiag: "バッテリーが見つかりません。", running: "検出された実行中のアプリID",
    none: "なし", reset: "すべてのデータを削除", resetSure: "もう一度タップして確定",
    resetDone: "データを削除しました。", failed: "失敗: ", loading: "読み込み中 …",
    noBattery: "バッテリーが見つかりません。設定 → 診断を開いてください。", charging: "充電中", discharging: "放電中",
    full: "満充電", other: "放電していません", etaLive: "残り時間（ライブ）",
    etaHist: "残り時間（履歴から）", etaWait: "残り時間: データ収集中 …", nowPlaying: "プレイ中",
    session: "セッション", noGame: "ゲームは起動していません", chartW: "消費電力、直近1時間 (W)",
    chartP: "充電残量、直近1時間 (%)", rankTitle: "ゲームごとのバッテリー消費", idle: "メニュー / アイドル",
    avg: "平均", fullBat: "（満充電時）", sessions: "セッション",
    measured: "計測", tooLittle: "データがまだ不足しています", noStats: "まだデータがありません。ヘッドセットをバッテリー駆動でプレイしてください。",
    recOn: "記録中", recOff: "記録を一時停止中", recOnHint: "ゲームごとのバッテリー消費を記録しています。",
    recOffHint: "ライブ表示は続きますが、統計には追加されません。", recStop: "一時停止", recStart: "再開",
    health: "バッテリーの状態", cycles: "充電サイクル", saveTitle: "Battery Save（充電上限）",
    saveHint: "100 % ではなく 80 % で止めると、リチウム電池が長持ちします。", off: "オフ", modeHw: "対応しています: Framey を閉じていても、充電器が上限で自動的に停止します。",
    modeSoft: "Framey の実行中は上限で充電を一時停止します。Framey を閉じると 100 % まで充電されます。", modeRo: "ヘッドセットには充電上限がありますが、Framey に設定する権限がありません（root が必要）。代わりに通知を表示します。", modeNone: "このヘッドセットは充電上限に対応していません。上限に達したら通知を表示します。",
    limitHit: "バッテリーが {n} % に達しました。バッテリー保護のため今すぐ充電を外してください。", limitErr: "充電上限を設定できませんでした（書き込みエラー）。代わりに通知が有効です。",
  },
  ko: {
    back: "‹ 뒤로", settings: "설정", language: "언어",
    source: "배터리 소스", auto: "자동", diag: "진단 보기",
    diagHint: "전원 장치의 원시 값으로, 버그 보고에 유용합니다.", noDiag: "배터리를 찾을 수 없습니다.", running: "감지된 실행 중인 앱 ID",
    none: "없음", reset: "모든 데이터 삭제", resetSure: "확인하려면 다시 탭하세요",
    resetDone: "데이터가 삭제되었습니다.", failed: "실패: ", loading: "불러오는 중 …",
    noBattery: "배터리를 찾을 수 없습니다. 설정 → 진단을 열어 보세요.", charging: "충전 중", discharging: "방전 중",
    full: "완충", other: "방전 중 아님", etaLive: "남은 시간 (실시간)",
    etaHist: "남은 시간 (기록 기반)", etaWait: "남은 시간: 데이터 수집 중 …", nowPlaying: "지금 플레이 중",
    session: "세션", noGame: "실행 중인 게임 없음", chartW: "소비 전력, 최근 1시간 (W)",
    chartP: "충전량, 최근 1시간 (%)", rankTitle: "게임별 배터리 사용량", idle: "메뉴 / 대기",
    avg: "평균", fullBat: "완충 시", sessions: "세션",
    measured: "측정됨", tooLittle: "아직 데이터가 부족합니다", noStats: "아직 데이터가 없습니다. 헤드셋을 배터리로 사용하면서 게임을 해 보세요.",
    recOn: "기록 중", recOff: "기록 일시 정지됨", recOnHint: "게임별 배터리 사용량을 기록하고 있습니다.",
    recOffHint: "실시간 표시는 계속되지만 통계에는 추가되지 않습니다.", recStop: "일시 정지", recStart: "다시 시작",
    health: "배터리 상태", cycles: "충전 사이클", saveTitle: "Battery Save (충전 제한)",
    saveHint: "100 % 대신 80 %에서 멈추면 리튬 배터리를 더 오래 건강하게 유지할 수 있습니다.", off: "끄기", modeHw: "지원됨: Framey가 닫혀 있어도 충전기가 제한에서 스스로 멈춥니다.",
    modeSoft: "Framey가 실행 중일 때 제한에서 충전을 일시 정지합니다. Framey가 닫혀 있으면 100 %까지 충전됩니다.", modeRo: "헤드셋에 충전 제한 기능이 있지만 Framey에 설정 권한이 없습니다(root 필요). 대신 알림을 받게 됩니다.", modeNone: "헤드셋이 충전 제한을 지원하지 않습니다. 제한에 도달하면 알림을 받게 됩니다.",
    limitHit: "배터리가 {n} %에 도달했습니다. 배터리 보호를 위해 지금 충전기를 분리하세요.", limitErr: "충전 제한을 설정하지 못했습니다(쓰기 오류). 대신 알림이 활성화되어 있습니다.",
  },
  zh: {
    back: "‹ 返回", settings: "设置", language: "语言",
    source: "电池来源", auto: "自动", diag: "显示诊断信息",
    diagHint: "电源的原始数值，便于提交错误报告。", noDiag: "未找到电池。", running: "检测到的运行中应用 ID",
    none: "无", reset: "删除所有数据", resetSure: "再次点击以确认",
    resetDone: "数据已删除。", failed: "失败：", loading: "加载中 …",
    noBattery: "未找到电池。请打开 设置 → 诊断。", charging: "充电中", discharging: "放电中",
    full: "已充满", other: "未在放电", etaLive: "剩余时间（实时）",
    etaHist: "剩余时间（根据历史）", etaWait: "剩余时间：正在收集数据 …", nowPlaying: "正在游玩",
    session: "本次", noGame: "没有正在运行的游戏", chartW: "功耗，最近一小时 (W)",
    chartP: "电量，最近一小时 (%)", rankTitle: "各游戏耗电情况", idle: "菜单 / 空闲",
    avg: "平均", fullBat: "（满电时）", sessions: "次",
    measured: "已测量", tooLittle: "数据尚不足", noStats: "暂无数据。请在头显使用电池供电时玩游戏。",
    recOn: "正在记录", recOff: "记录已暂停", recOnHint: "正在按游戏记录耗电情况。",
    recOffHint: "实时显示继续运行，但不会计入统计。", recStop: "暂停", recStart: "继续",
    health: "电池健康度", cycles: "次充电循环", saveTitle: "Battery Save（充电上限）",
    saveHint: "充到 80 % 而不是 100 % 可以让锂电池更长寿。", off: "关闭", modeHw: "支持：即使 Framey 已关闭，充电器也会在上限处自动停止。",
    modeSoft: "Framey 运行时会在上限处暂停充电。Framey 关闭后会充到 100 %。", modeRo: "头显支持充电上限，但 Framey 没有设置权限（需要 root）。将改为显示提醒。", modeNone: "头显不支持充电上限。达到上限时会显示提醒。",
    limitHit: "电池已达到 {n} %。现在拔掉充电器可以保护电池。", limitErr: "无法设置充电上限（写入错误）。已改为启用提醒。",
  },
};

function pick(code) {
  const c = String(code || "").toLowerCase().slice(0, 2);
  return CODES.indexOf(c) >= 0 ? c : "en";
}
function build(code) { return Object.assign({}, LANGS.en, LANGS[code] || {}); }

let lang = pick(navigator.language);
let S = build(lang);

const st = { snap: null, stats: null, view: "main", diag: null, sure: false, ticks: 0, recT: 0, hitShown: false };
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

const DOT = ["en", "ja", "ko", "zh"];   // languages that write 1.5 instead of 1,5
function num(n, d) { return n.toFixed(d).replace(".", DOT.indexOf(lang) >= 0 ? "." : ","); }
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

  if (s.limit_hit) {
    liveEl.appendChild(Framey.el("font-size:20px;padding:10px 14px;margin:8px 0;border-radius:10px;background:#3b3320;color:#e6c34a;",
      "🔌 " + S.limitHit.replace("{n}", s.limit)));
  }
  const hb = [];
  if (b.health != null) hb.push(S.health + " " + Math.round(b.health) + " %");
  if (b.cycles != null) hb.push(b.cycles + " " + S.cycles);
  if (s.limit && !s.limit_hit) hb.push("Battery Save " + s.limit + " %");
  if (hb.length) liveEl.appendChild(Framey.el("font-size:17px;color:#7d8791;margin:2px 0 6px;", hb.join(" · ")));

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

// ---- recording toggle + animation -------------------------------------------
// A little detective scene: while recording, a magnifier sweeps over the battery.
// Pausing drops the magnifier, the battery greys out and falls asleep (pause bars + "z z z").
// Resuming sends a ripple out, colours the battery back in and pops the magnifier back up.

const NS = "http://www.w3.org/2000/svg";
const GREY = "#4a535b";
const CALM = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
let recArt = null, recBusy = false;

function sv(tag, attrs, css) {
  const e = document.createElementNS(NS, tag);
  e.setAttribute("data-fy", "1");
  Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  if (css) e.style.cssText = css;
  return e;
}
const ORIGIN = "transform-box:fill-box;transform-origin:center;";

function recOn() { return !st.snap || st.snap.rec !== false; }
function liveColor() {
  const b = st.snap && st.snap.battery;
  return b && b.pct != null ? pctColor(b.pct) : "#7fd18b";
}
function fillWidth() {
  const b = st.snap && st.snap.battery;
  const p = b && b.pct != null ? Math.max(6, Math.min(100, b.pct)) : 100;
  return (72 * p / 100).toFixed(1);
}

function recCard() {
  const card = Framey.el("display:flex;align-items:center;gap:18px;padding:12px 18px;margin:12px 0;border-radius:14px;background:#2a3138;overflow:hidden;", "");
  const svg = sv("svg", { viewBox: "0 0 140 90" }, "width:140px;height:90px;flex:none;overflow:visible;");
  const ring = sv("circle", { cx: 57, cy: 50, r: 34, fill: "none", "stroke-width": 4 }, ORIGIN + "opacity:0;");
  const body = sv("rect", { x: 14, y: 28, width: 86, height: 44, rx: 9, fill: "none", stroke: "#c4ccd3", "stroke-width": 4 });
  const cap = sv("rect", { x: 102, y: 40, width: 7, height: 20, rx: 2, fill: "#c4ccd3" });
  const fill = sv("rect", { x: 21, y: 35, width: fillWidth(), height: 30, rx: 5 });
  const pause = sv("g", {}, ORIGIN + "opacity:0;");
  pause.appendChild(sv("rect", { x: 48, y: 38, width: 7, height: 24, rx: 2, fill: "#e6e9ec" }));
  pause.appendChild(sv("rect", { x: 61, y: 38, width: 7, height: 24, rx: 2, fill: "#e6e9ec" }));
  const mag = sv("g", {}, ORIGIN);
  mag.appendChild(sv("circle", { cx: 57, cy: 38, r: 16, fill: "rgba(230,233,236,0.18)", stroke: "#e6e9ec", "stroke-width": 5 }));
  mag.appendChild(sv("line", { x1: 68, y1: 50, x2: 82, y2: 64, stroke: "#e6e9ec", "stroke-width": 7, "stroke-linecap": "round" }));
  const zs = [0, 1, 2].map(function (i) {
    const t = sv("text", { x: 106 + i * 13, y: 28 - i * 12, fill: "#b8c1c9", "font-size": 15 + i * 5, "font-weight": "700", "font-family": "sans-serif" }, "opacity:0;");
    t.textContent = "z";
    return t;
  });
  [ring, body, cap, fill, pause, mag].concat(zs).forEach(function (e) { svg.appendChild(e); });
  card.appendChild(svg);

  const col = Framey.el("flex:1;min-width:0;", "");
  const titleRow = Framey.el("display:flex;align-items:center;gap:10px;", "");
  const dot = Framey.el("width:14px;height:14px;border-radius:50%;flex:none;", "");
  const title = Framey.el("font-size:24px;font-weight:600;", "");
  titleRow.appendChild(dot);
  titleRow.appendChild(title);
  const hint = Framey.el("font-size:16px;color:#9aa5af;margin:4px 0;", "");
  col.appendChild(titleRow);
  col.appendChild(hint);
  const btnBox = Framey.el("", "");
  col.appendChild(btnBox);
  card.appendChild(col);

  recArt = { svg: svg, ring: ring, fill: fill, pause: pause, mag: mag, zs: zs, dot: dot, title: title, hint: hint, btnBox: btnBox, on: null, t: null };
  setRecVisual(recOn(), false);
  return card;
}

function stopAnims(a) {
  clearTimeout(a.t);
  [a.svg, a.ring, a.fill, a.pause, a.mag, a.dot].concat(a.zs).forEach(function (e) {
    if (e.getAnimations) e.getAnimations().forEach(function (x) { x.cancel(); });
  });
}

function idleLoop(a) {
  if (CALM || !a.mag.animate) return;
  if (a.on) {
    a.mag.animate([{ transform: "translate(-20px,0) rotate(-6deg)" }, { transform: "translate(20px,2px) rotate(6deg)" }],
      { duration: 2400, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
    a.dot.animate([{ opacity: 1 }, { opacity: 0.25 }], { duration: 1100, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
  } else {
    a.zs.forEach(function (z, i) {
      z.animate([{ opacity: 0, transform: "translate(0,6px)" }, { opacity: 1, offset: 0.3 }, { opacity: 0, transform: "translate(8px,-14px)" }],
        { duration: 2700, delay: i * 900, iterations: Infinity, easing: "ease-out" });
    });
  }
}

function setRecVisual(on, animate) {
  const a = recArt;
  if (!a) return;
  const was = a.on;
  a.on = on;
  stopAnims(a);
  const c = liveColor();
  a.fill.style.fill = on ? c : GREY;
  a.ring.style.stroke = c;
  a.mag.style.opacity = on ? "1" : "0";
  a.mag.style.transform = "";
  a.pause.style.opacity = on ? "0" : "1";
  a.pause.style.transform = "";
  a.dot.style.background = on ? "#ff5d52" : GREY;
  a.title.textContent = on ? S.recOn : S.recOff;
  a.hint.textContent = on ? S.recOnHint : S.recOffHint;
  a.btnBox.textContent = "";
  a.btnBox.appendChild(Framey.button(on ? S.recStop : S.recStart, on ? BTN_DIM : BTN, toggleRec));

  if (!animate || CALM || was === on || !a.mag.animate) { idleLoop(a); return; }
  if (!on) {
    // magnifier hops, tips over and falls out of frame; battery fades to grey; pause bars bounce in
    a.mag.animate([
      { opacity: 1, transform: "translate(0,0) rotate(0deg)" },
      { opacity: 1, transform: "translate(0,-10px) rotate(-14deg)", offset: 0.3 },
      { opacity: 0, transform: "translate(10px,40px) rotate(40deg)" },
    ], { duration: 800, easing: "cubic-bezier(.45,0,.75,.3)" });
    a.fill.animate([{ fill: c }, { fill: GREY }], { duration: 900, easing: "ease-in-out" });
    a.pause.animate([
      { opacity: 0, transform: "scale(0.2)" },
      { opacity: 1, transform: "scale(1.25)", offset: 0.65 },
      { opacity: 1, transform: "scale(1)" },
    ], { duration: 520, delay: 600, easing: "ease-out", fill: "backwards" });
    a.svg.animate([{ transform: "translateY(0)" }, { transform: "translateY(3px)", offset: 0.8 }, { transform: "translateY(0)" }],
      { duration: 400, delay: 700 });
  } else {
    // pause bars shrink away, a ripple pings out, colour floods back, magnifier pops up
    a.pause.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.2)" }], { duration: 280, easing: "ease-in" });
    a.ring.animate([{ opacity: 0.9, transform: "scale(0.3)" }, { opacity: 0, transform: "scale(1.8)" }], { duration: 900, delay: 220, easing: "ease-out" });
    a.fill.animate([{ fill: GREY }, { fill: c }], { duration: 700, delay: 150, easing: "ease-out", fill: "backwards" });
    a.mag.animate([
      { opacity: 0, transform: "translate(0,18px) scale(0)" },
      { opacity: 1, transform: "translate(0,-4px) scale(1.18)", offset: 0.6 },
      { opacity: 1, transform: "translate(0,0) scale(1)" },
    ], { duration: 600, delay: 380, easing: "ease-out", fill: "backwards" });
  }
  a.t = setTimeout(function () { if (recArt === a && a.on === on) idleLoop(a); }, 1150);
}

function toggleRec() {
  if (recBusy) return;
  const next = !recOn();
  recBusy = true;
  st.recT = Date.now();
  if (st.snap) st.snap.rec = next;
  setRecVisual(next, true);
  api("set_rec", { on: next }).catch(function (e) {
    if (st.snap) st.snap.rec = !next;
    setRecVisual(!next, false);
    Framey.toast(S.failed + e.message, 4000);
  }).then(function () { recBusy = false; });
}

function updateRec() {
  const a = recArt;
  if (!a || !a.svg.isConnected) return;
  a.fill.setAttribute("width", fillWidth());
  if (recBusy) return;
  if (a.on !== recOn()) { setRecVisual(recOn(), false); return; }
  if (a.on) { a.fill.style.fill = liveColor(); a.ring.style.stroke = liveColor(); }
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

  if (s) {
    w.appendChild(Framey.el("font-size:26px;font-weight:600;margin:18px 0 6px;", S.saveTitle));
    w.appendChild(Framey.el("font-size:17px;color:#7d8791;", S.saveHint));
    const lim = Framey.el("display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;", "");
    [0, 70, 80, 90].forEach(function (v) {
      const active = (s.limit || 0) === v;
      lim.appendChild(Framey.button(v ? v + " %" : S.off, active ? BTN : BTN_DIM, function () { if (!active) setLimit(v); }));
    });
    w.appendChild(lim);
    const mode = { hw: S.modeHw, soft: S.modeSoft, ro: S.modeRo }[s.lim_mode] || S.modeNone;
    const ok = (s.lim_mode === "hw" || s.lim_mode === "soft") && !s.lim_err;
    w.appendChild(Framey.el("font-size:17px;margin-top:6px;color:" + (ok ? "#7fd18b" : "#e6c34a") + ";",
      s.lim_err ? S.limitErr : mode));
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

function setLimit(v) {
  api("set_limit", { limit: v }).then(function () { return refresh(false); }).then(function () { if (st.view === "settings") draw(); })
    .catch(function (e) { Framey.toast(S.failed + e.message, 4000); });
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
  w.appendChild(recCard());
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
  const asked = Date.now();
  return Promise.all(jobs).then(function (r) {
    if (recBusy || asked < st.recT) r[0].rec = recOn();   // answer predates a toggle: keep the new state
    st.snap = r[0];
    if (r[1]) st.stats = r[1].stats;
    const relang = r[0].lang && r[0].lang !== lang;
    if (relang) { lang = r[0].lang; S = build(lang); }
    if (r[0].limit_hit && !st.hitShown) Framey.toast(S.limitHit.replace("{n}", r[0].limit), 6000);
    st.hitShown = !!r[0].limit_hit;
    if (relang) { draw(); return; }
    if (st.view === "main") { drawLive(); updateRec(); if (withStats) drawRank(); }
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
