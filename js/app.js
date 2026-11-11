/* LE DERNIER DÎNER — moteur du jeu (aucune dépendance sauf jsQR) */
(() => {
"use strict";
const C = JEU.config;
const CLE = "ldd_partie_v1";
const MODE_MJ = /[?&](test|mj)\b/.test(location.search);
const $ = s => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "onclick") e.addEventListener("click", v);
    else if (k === "html") e.innerHTML = v;
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
};
const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/* ---------------- état ---------------- */
let S = charger();
function nouvelEtat() {
  return { equipe: null, base: null, objets: [], fouilles: [], enigmesOk: [], essais: {}, questions: [],
    passages: {}, visites: {}, dernierScan: null, penalites: 0, flags: [], erreurs: 0, blocage: 0,
    vu: {}, accusation: null, toutAccepter: false, ici: null };
}
function charger() { try { return Object.assign(nouvelEtat(), JSON.parse(localStorage.getItem(CLE)) || {}); } catch (e) { return nouvelEtat(); } }
function sauver() { try { localStorage.setItem(CLE, JSON.stringify(S)); } catch (e) {} }

/* ---------------- temps ---------------- */
/* Mode réel : toutes les équipes partagent la même heure de départ (depart.json), corrigée par l'heure du serveur. */
const REEL = false; // départ commun désactivé : chaque équipe démarre à l'ouverture de l'app
let DEPART = Date.parse(C.departReel || ""), DECAL = 0;
const maintenant = () => Date.now() + DECAL;
async function chargerDepart() {
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch("depart.json?" + Date.now(), { cache: "no-store", signal: ctrl.signal }); clearTimeout(to);
    if (!r.ok) throw 0;
    const j = await r.json(), d = r.headers.get("Date");
    if (j.depart && !isNaN(Date.parse(j.depart))) DEPART = Date.parse(j.depart);
    if (d && !isNaN(Date.parse(d))) DECAL = Date.parse(d) - Date.now();
    S.depart = DEPART; S.decal = DECAL; sauver();
  } catch (e) { if (S.depart) { DEPART = S.depart; DECAL = S.decal || 0; } }
}
/* Les conditions des données (fenêtres 15–35, « apres: 50 ») sont écrites pour un meurtre à la minute 50 ; les ouvertures de portes sont en minutes réelles.
   scen() convertit la minute réelle en minute du scénario : on étire l'avant-meurtre jusqu'à C.meurtreMin. */
const SCEN_MEURTRE = 50;
const scen = (m = minute()) => m < C.meurtreMin ? m * SCEN_MEURTRE / C.meurtreMin : SCEN_MEURTRE + (m - C.meurtreMin);
function minute() {
  if (REEL) return (maintenant() - DEPART) / 60000;
  if (!S.base) return 0;
  return S.base.min + (Date.now() - S.base.ts) / 60000 * S.base.vitesse;
}
function rebaser(vitesse, min) { S.base = { ts: Date.now(), min: min ?? minute(), vitesse: vitesse ?? S.base.vitesse }; sauver(); }
const t0 = () => S.t0 || (S.base && S.base.ts) || Date.now();
const arrondi5 = ms => Math.round(ms / 300000) * 300000;
const fmtH = ms => { const d = new Date(ms); return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, "0")}`; };
/* heure de l'histoire (hh:mm, base 20 h 00 = départ de l'équipe) -> heure réelle affichée, arrondie à 5 min */
function heureDyn(hh, mm) { const x = (hh * 60 + mm) - C.heureDebut, r = x < SCEN_MEURTRE ? x * C.meurtreMin / SCEN_MEURTRE : C.meurtreMin + (x - SCEN_MEURTRE); return fmtH(arrondi5(t0() + r * 60000)); }
function heureHistoire(m) { return fmtH(t0() + m * 60000); }
function heuresDansTextes() {
  const re = /\b([01]?\d|2[0-3]) h(?: ?([0-5]\d))?(?![\w])/g;
  const marche = o => { for (const k in o) { const v = o[k]; if (typeof v === "string") { if (!/^(img|image|id|src)/.test(k) && !/\.(jpg|png|mp3)$/.test(v)) o[k] = v.replace(re, (_, h, m) => heureDyn(+h, +(m || 0))); } else if (v && typeof v === "object") marche(v); } };
  for (const k in JEU) if (k !== "config" && JEU[k] && typeof JEU[k] === "object") marche(JEU[k]);
}
function mmss(min) { const s = Math.max(0, Math.round(min * 60)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

/* ---------------- conditions ---------------- */
function ok(c) {
  if (!c) return true;
  const m = scen();
  if (c.apres != null && m < c.apres) return false;
  if (c.avant != null && m >= c.avant) return false;
  if (c.a != null && ![].concat(c.a).every(o => S.objets.includes(o))) return false;
  if (c.pas != null && [].concat(c.pas).some(o => S.objets.includes(o))) return false;
  if (c.pose != null && ![].concat(c.pose).every(k => S.questions.includes(k))) return false;
  if (c.ou && !c.ou.some(ok)) return false;
  return true;
}
const premier = (liste) => typeof liste === "string" ? { texte: liste } : liste.find(x => ok(x.si)) || {};

/* ---------------- tirage des pièces par équipe ---------------- */
function aleatoire(graine) { let a = graine >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function tirage(num) {
  const pieces = Object.keys(JEU.pieces), r = aleatoire(C.graine * 1000 + num);
  for (let i = pieces.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pieces[i], pieces[j]] = [pieces[j], pieces[i]]; }
  return pieces; // pieces[n-1] = pièce derrière le QR n
}
const pieceDe = n => tirage(S.equipe.num)[n - 1];
const emplacement = n => JEU.emplacements.find(e => e.n === n);

/* ---------------- objets ---------------- */
function donner(ids) {
  const nouveaux = (ids || []).filter(id => !S.objets.includes(id));
  nouveaux.forEach(id => S.objets.push(id));
  if (nouveaux.length) { sauver(); son("indice"); toast("Ajouté au carnet : " + nouveaux.map(id => JEU.objets[id].nom).join(", ")); majBadge(); }
}

/* ---------------- sons (synthétisés, aucun fichier) ---------------- */
let audio = null;
function ctx() { if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (audio.state === "suspended") audio.resume(); return audio; }
function ton(f, debut, duree, vol = .2, type = "sine") {
  const a = ctx(); if (!a) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + debut;
  o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + duree);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + duree + .05);
}
function bruit(debut, duree, vol, filtre, freq) {
  const a = ctx(); if (!a) return; const n = Math.floor(a.sampleRate * duree), b = a.createBuffer(1, n, a.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + debut;
  s.buffer = b; f.type = filtre; f.frequency.value = freq; g.gain.value = vol; s.connect(f).connect(g).connect(a.destination); s.start(t);
}
const SONS = {
  porte: () => { bruit(0, .5, .5, "lowpass", 300); ton(110, .05, .4, .08, "sawtooth"); },
  papier: () => { bruit(0, .18, .35, "highpass", 2500); bruit(.2, .12, .25, "highpass", 3000); },
  verrou: () => { ton(900, 0, .05, .25, "square"); ton(600, .08, .06, .2, "square"); },
  reussite: () => { [523, 659, 784, 1046].forEach((f, i) => ton(f, i * .12, .5, .15, "triangle")); },
  echec: () => { ton(196, 0, .35, .15, "triangle"); ton(185, .2, .45, .15, "triangle"); },
  indice: () => { ton(880, 0, .25, .1); ton(1320, .1, .35, .08); },
  chute: () => { bruit(0, .9, .8, "lowpass", 180); ton(80, 0, .8, .3, "sine"); ton(55, .1, 1, .25, "sine"); },
  cloche: () => { for (let k = 0; k < 3; k++) [220, 440, 553, 660, 880].forEach((f, i) => ton(f, k * 2.2, 2.6, [.25, .18, .1, .08, .05][i])); bruit(6.8, 1.6, .4, "lowpass", 900); }
};
function son(nom) { if (S.son !== false && SONS[nom]) try { SONS[nom](); } catch (e) {} }
const srcDe = v => !v ? null : typeof v === "string" ? v : ((v.find(i => ok(i.si)) || {}).src || null);
const image = (v, cls = "illus") => {
  const s = srcDe(v); if (!s) return null;
  const im = el("img", { class: cls, src: s, alt: "" }); im.onerror = () => im.remove();
  const k = (s.match(/docs\/([\w]+)\.jpg/) || [])[1], hs = k && typeof HEURES !== "undefined" && HEURES[k];
  if (!hs) return im;
  const w = el("div", { class: "docH " + cls }, im);
  hs.forEach(h => { const [hh, mm] = h.s.split(":").map(Number); w.append(el("span", { class: "hh", style: `left:${h.x * 100}%;top:${h.y * 100}%;height:${h.h * 100}%;display:flex;align-items:center;font-size:${h.fs * 100}cqw;color:${h.c};font-family:${h.f}` }, heureDyn(hh, mm))); });
  return w;
};
if (MODE_MJ) window.__dbg = { image };

/* ---------------- interface : écrans ---------------- */
function demarrer() {
  if (!S.equipe || !S.base) return ecranAccueil();
  heuresDansTextes();
  if (REEL && minute() < 0) return ecranAttente();
  lancerJeu();
}
const heureReelle = ms => new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");
function ecranAttente() {
  $("#accueil").hidden = true; $("#jeu").hidden = true;
  const a = $("#attente"); a.hidden = false; a.innerHTML = "";
  const compte = el("p", { class: "code" }), cam = el("p", { class: "aide" }, "");
  a.append(el("h2", {}, "Préparez-vous"), el("p", {}, "L'enquête commence à " + heureReelle(DEPART) + ". Elle démarrera toute seule sur votre téléphone."), compte,
    el("ul", {}, el("li", {}, "Mettez le son (le jeu a des ambiances)."), el("li", {}, "Réglez l'écran pour qu'il reste allumé."), el("li", {}, "Gardez cette page ouverte, avec le même téléphone."), el("li", {}, "Autorisez la caméra maintenant : elle sert à scanner les portes.")),
    el("button", { class: "btn", onclick: async () => { try { const f = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); f.getTracks().forEach(t => t.stop()); cam.textContent = "Caméra autorisée."; } catch (e) { cam.textContent = "Caméra indisponible : vous pourrez taper le numéro des portes."; } } }, "Tester la caméra"), cam);
  try { navigator.wakeLock && navigator.wakeLock.request("screen").catch(() => {}); } catch (e) {}
  const t = setInterval(() => { const r = -minute(); if (r <= 0) { clearInterval(t); a.hidden = true; if (navigator.vibrate) navigator.vibrate(200); lancerJeu(); } else compte.textContent = mmss(r); }, 500);
}
function lancerJeu() {
  $("#accueil").hidden = true; $("#jeu").hidden = false;
  $("#nomEquipe").textContent = `Équipe ${S.equipe.num} · ${S.equipe.nom}`;
  const bs = $("#btnSon"); const majSon = () => bs.textContent = S.son === false ? "🔇" : "🔊";
  bs.onclick = () => { S.son = S.son === false; sauver(); majSon(); son("indice"); }; majSon();
  document.addEventListener("click", () => ctx(), { once: true });
  if (MODE_MJ) panneauMJ();
  onglet(S.accusation ? "accuser" : "carte");
  setInterval(tic, 1000); tic(); majBadge();
}

function ecranAccueil() {
  $("#accueil").hidden = false; $("#jeu").hidden = true;
  $("#btnCommencer").onclick = () => {
    const num = parseInt($("#inNum").value, 10), nom = $("#inNom").value.trim() || `Équipe ${num}`;
    if (!(num >= 1 && num <= 99)) return alerte("Numéro d'équipe", "Entrez le numéro inscrit sur votre carte d'équipe.");
    if (norm($("#inCode").value) !== norm(C.codeDepart) && !MODE_MJ) return alerte("Code de départ", "Ce n'est pas le bon code. Il vous sera donné par l'organisateur au moment du départ.");
    S = nouvelEtat(); S.equipe = { num, nom }; S.base = { ts: Date.now(), min: 0, vitesse: 1 }; S.t0 = S.base.ts;
    S.pid = Array.from({ length: 3 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
    S.objets = [...JEU.objetsDepart]; sauver();
    briefing(() => location.reload());
  };
}

function briefing(suite) {
  modale(el("div", {},
    el("h2", {}, "Votre mission"), image(JEU.textes.imageBrief),
    el("p", {}, "Vous êtes les futurs apprentis inspecteurs de l'unité EGGER (EGGER : Experts et Géostratèges en Gestion d'Énigmes et de leurs Résolutions)."),
    el("p", {}, "Ce soir, Auguste Hallier fête les trente ans de sa compagnie dans son château. Votre mentor, le détective Vidal, y est invité : il a reçu une lettre anonyme annonçant que quelqu'un va mourir avant que sonne la cloche de " + heureDyn(21, 0) + "."),
    el("p", {}, "Vous avez dans votre carnet la lettre, et ce que le détective a trouvé dans une valise abandonnée : une clé n° 114 et une alliance."),
    el("ol", {},
      el("li", {}, "Chaque QR du parc est une porte du château. Scannez-le avec l'onglet « Scanner »."),
      el("li", {}, "Votre château n'est pas celui des autres équipes : une porte ne mène pas à la même pièce pour tout le monde."),
      el("li", {}, "Une porte verrouillée s'ouvrira plus tard. Une pièce peut changer avec le temps : revenez."),
      el("li", {}, "À chaque passage, l'app vous pose une question sur le lieu réel : observez autour de vous."),
      el("li", {}, "Ne fermez pas cette page et gardez le même téléphone.")),
    el("div", { class: "code-depart" }, el("p", {}, "Votre code d'équipe, à donner à l'organisateur avant de partir :"), el("p", { class: "code" }, S.pid || "—"),
      el("p", { class: "aide" }, "Sans ce code enregistré au départ, votre résultat ne pourra pas être pris en compte.")),
    el("button", { class: "btn principal", onclick: () => { fermerModale(); suite && suite(); } }, "Je suis prêt")));
}

/* ---------------- boucle ---------------- */
function tic() {
  const m = minute(), reste = C.dureeMin - m;
  $("#chrono").textContent = mmss(reste);
  $("#chrono").classList.toggle("urgent", reste < 15);
  $("#heure").textContent = "Il est " + heureHistoire(Math.min(m, C.dureeMin));
  if (REEL && !tic.dep) { tic.dep = 1; setInterval(chargerDepart, 60000); }
  if (m >= C.meurtreMin && !S.vu.meurtre && $("#cine").hidden) { S.vu.meurtre = true; sauver(); cinematique(); }
  else if (m >= C.rappelMin && !S.vu.rappel && !S.accusation) { S.vu.rappel = true; sauver(); alerte("Retour au salon", JEU.textes.rappel); majOngletAccuser(); }
  else if (m >= C.dureeMin && !S.accusation) { S.vu.fin = true; fermerModale(); accuser(null, []); onglet("accuser"); alerte("Temps écoulé", JEU.textes.fin, () => onglet("accuser")); }
  const nbOuvertes = JEU.emplacements.filter(e => m >= JEU.ouvertures[pieceDe(e.n)]).length;
  if (S.vu.nbOuvertes != null && nbOuvertes > S.vu.nbOuvertes && m < C.meurtreMin) {
    son("reussite"); toast(`${nbOuvertes - S.vu.nbOuvertes} nouvelle(s) porte(s) ouverte(s) : regardez le plan.`, 6000);
    if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
    if (ongletActif === "carte") vueCarte();
  }
  if (S.vu.nbOuvertes !== nbOuvertes) { S.vu.nbOuvertes = nbOuvertes; sauver(); }
  if (Math.floor(m) !== tic.der) { tic.der = Math.floor(m); majOngletAccuser(); if (ongletActif === "carte") vueCarte(); if (MODE_MJ) majMJ(); }
}

/* ---------------- onglets ---------------- */
let ongletActif = null;
function onglet(nom) {
  if (nom === "accuser" && !accuserOuvert()) return toast(`L'accusation s'ouvre à la minute ${C.accusationMin}.`);
  ongletActif = nom;
  document.querySelectorAll(".onglets button").forEach(b => b.classList.toggle("actif", b.dataset.o === nom));
  arreterCamera();
  const v = $("#vue"); v.innerHTML = "";
  ({ scanner: vueScanner, carte: vueCarte, carnet: vueCarnet, accuser: vueAccuser, regles: vueRegles })[nom]();
}
document.querySelectorAll(".onglets button").forEach(b => b.addEventListener("click", () => onglet(b.dataset.o)));
const accuserOuvert = () => minute() >= C.accusationMin || !!S.accusation;
function majOngletAccuser() { const b = $('.onglets button[data-o="accuser"]'); if (!b) return; b.classList.toggle("ferme", !accuserOuvert()); if (S.accusation) b.innerHTML = S.debrief ? "<span>🔓</span>Vérité" : "<span>📜</span>Rapport"; }
function majBadge() { const b = $("#badgeCarnet"); if (b) b.textContent = S.objets.length; }

/* ---------------- scanner ---------------- */
let flux = null, boucleScan = null;
function vueScanner() {
  const v = $("#vue");
  v.append(
    el("h2", {}, "Scanner une porte"),
    el("p", { class: "aide" }, "Visez le QR code avec l'appareil photo. Si la caméra ne marche pas, tapez le numéro écrit sous le QR."),
    el("div", { class: "camera" }, el("video", { id: "video", playsinline: "", muted: "" }), el("div", { class: "viseur" })),
    el("p", { id: "etatCam", class: "aide" }, "Démarrage de la caméra…"),
    el("div", { class: "saisie" },
      el("input", { id: "inPorte", type: "text", inputmode: "numeric", placeholder: "N° de la porte (ex. 3)" }),
      el("button", { class: "btn", onclick: () => { const m = $("#inPorte").value.match(/\d+/); if (m) scan(parseInt(m[0], 10)); else toast("Tapez le numéro écrit sous le QR."); } }, "Entrer")));
  demarrerCamera();
}
async function demarrerCamera() {
  const etat = $("#etatCam");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { etat.textContent = "Caméra indisponible ici : utilisez le numéro."; return; }
  try {
    flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    const video = $("#video"); if (!video) return arreterCamera();
    video.srcObject = flux; await video.play();
    etat.textContent = "Caméra prête.";
    const cv = document.createElement("canvas"), ctx = cv.getContext("2d", { willReadFrequently: true });
    boucleScan = setInterval(() => {
      if (!video.videoWidth) return;
      const w = 480, h = Math.round(video.videoHeight * w / video.videoWidth);
      cv.width = w; cv.height = h; ctx.drawImage(video, 0, 0, w, h);
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
      if (code && code.data) { const m = code.data.match(/LDD-(\d+)/i); if (m) { if (navigator.vibrate) navigator.vibrate(80); scan(parseInt(m[1], 10)); } }
    }, 300);
  } catch (e) { etat.textContent = "Caméra refusée ou indisponible : utilisez le numéro sous le QR."; }
}
function arreterCamera() { clearInterval(boucleScan); boucleScan = null; if (flux) flux.getTracks().forEach(t => t.stop()); flux = null; }

function scan(n) {
  if (!emplacement(n)) return toast("Ce numéro de porte n'existe pas.");
  if (minute() >= C.dureeMin) return alerte("Le château est fermé", JEU.textes.fermeture, () => onglet("accuser"));
  if (Date.now() < S.blocage) return alerte("Patientez", `Trop d'erreurs. Réessayez dans ${Math.ceil((S.blocage - Date.now()) / 1000)} s.`);
  arreterCamera();
  const maintenant = Date.now(), d = S.dernierScan;
  if (d && d.n !== n && maintenant - d.ts < C.antiTricheSecondes * 1000) {
    S.penalites += C.penaliteTriche;
    S.flags.push({ de: d.n, a: n, sec: Math.round((maintenant - d.ts) / 1000), min: Math.round(minute()) });
    toast(`Deux portes en ${Math.round((maintenant - d.ts) / 1000)} s ? Impossible à pied : pénalité de ${C.penaliteTriche} points.`, 5000);
  }
  S.dernierScan = { n, ts: maintenant }; sauver();
  const piece = pieceDe(n), ouvre = JEU.ouvertures[piece];
  if (minute() < ouvre) { son("verrou"); return alerte("Porte verrouillée", "Cette porte est fermée pour l'instant. Revenez plus tard.", () => onglet(ongletActif || "scanner")); }
  releve(n, () => entrer(n));
}

function releve(n, suite) {
  const e = emplacement(n), p = (S.passages[n] || 0) % e.releves.length, q = e.releves[p];
  const input = el("input", { type: "text", placeholder: "Votre réponse", autocomplete: "off" });
  const valider = () => {
    const juste = S.toutAccepter || q.r.some(r => norm(r) === norm(input.value));
    if (juste) { S.erreurs = 0; S.passages[n] = (S.passages[n] || 0) + 1; sauver(); fermerModale(); suite(); return; }
    S.erreurs++;
    if (S.erreurs >= C.erreursAvantBlocage) { S.erreurs = 0; S.blocage = Date.now() + C.blocageSecondes * 1000; sauver(); fermerModale(); return alerte("Mauvaise réponse", `Porte bloquée ${C.blocageSecondes} s. Observez bien le lieu.`); }
    sauver(); input.value = ""; input.placeholder = "Non… regardez bien autour de vous"; input.focus();
  };
  input.addEventListener("keydown", ev => { if (ev.key === "Enter") valider(); });
  modale(el("div", {}, el("h2", {}, "Avant d'entrer…"), el("p", {}, "Prouvez que vous êtes bien sur place :"),
    el("p", { class: "question" }, q.q), input,
    el("div", { class: "rang" }, el("button", { class: "btn", onclick: () => { fermerModale(); onglet("carte"); } }, "Annuler"),
      el("button", { class: "btn principal", onclick: valider }, "Valider"))));
  setTimeout(() => input.focus(), 50);
}

/* ---------------- pièce ---------------- */
function entrer(n) {
  S.ici = n; S.visites[n] = pieceDe(n); if (minute() >= C.meurtreMin) { S.apres = S.apres || {}; S.apres[n] = true; } sauver(); son("porte");
  vuePiece();
}
function vuePiece() {
  if (minute() >= C.dureeMin) { fermerModale(); S.ici = null; sauver(); return alerte("Le château est fermé", JEU.textes.fermeture, () => onglet("accuser")); }
  const n = S.ici, id = pieceDe(n), P = JEU.pieces[id];
  const presents = (P.presents || []).filter(p => ok(p.si)).map(p => p.id);
  const fouilles = (P.fouilles || []).filter(f => ok(f.si));
  const enigmes = (P.enigmes || []).filter(e => ok(JEU.enigmes[e].si));
  const corps = el("div", { class: "piece" },
    el("p", { class: "lieu" }, `Porte ${n}`),
    el("h2", {}, P.nom), image(P.image),
    el("p", { class: "decor" }, premier(P.description).texte),
    presents.length ? el("h3", {}, "Interroger") : null,
    presents.map(pid => el("button", { class: "btn ligne", onclick: () => vuePerso(pid) },
      el("b", {}, JEU.personnages[pid].nom), el("span", {}, JEU.personnages[pid].role))),
    fouilles.length ? el("h3", {}, "Fouiller") : null,
    fouilles.map(f => el("button", { class: "btn ligne" + (S.fouilles.includes(f.id) ? " fait" : ""), onclick: () => fouiller(f) }, f.label)),
    enigmes.length ? el("h3", {}, "Énigmes") : null,
    enigmes.map(eid => el("button", { class: "btn ligne" + (S.enigmesOk.includes(eid) ? " fait" : " cadenas"), onclick: () => vueEnigme(eid) }, JEU.enigmes[eid].titre)),
    !presents.length && !fouilles.length && !enigmes.length ? el("p", { class: "aide" }, "Il n'y a rien d'autre à faire ici pour le moment.") : null,
    el("button", { class: "btn principal", onclick: () => { fermerModale(); S.ici = null; sauver(); onglet("carte"); } }, "Quitter la pièce"));
  modale(corps, true);
}
function fouiller(f) {
  if (f.piege) {
    if (S.fouilles.includes(f.id)) return toast("Vous avez déjà essayé. Une fois suffit.");
    S.fouilles.push(f.id); S.penalites += C.penalitePiege; S.morts = (S.morts || 0) + 1; sauver();
    fermerModale(); son("chute");
    return jouerCine([...f.piege, `Mort stupide : −${C.penalitePiege} points.`], "Revenir dans la pièce", () => vuePiece());
  }
  if (!S.fouilles.includes(f.id)) { S.fouilles.push(f.id); sauver(); } son("papier");
  donner(f.donne);
  modale(el("div", {}, el("h2", {}, f.label), el("p", { class: "decor" }, f.texte),
    el("button", { class: "btn principal", onclick: vuePiece }, "Retour")), true);
}
/* d'où vient chaque objet (pour dire « vous montrez… ») */
const ORIGINE = (() => {
  const o = {}, met = (ids, d) => [].concat(ids || []).forEach(id => { if (!o[id]) o[id] = d; });
  for (const r of Object.values(JEU.pieces)) {
    (r.fouilles || []).forEach(f => met(f.donne, "trouvé dans " + r.nom.replace(/^(La|Le|Les) /, m => m.toLowerCase())));
    (r.enigmes || []).forEach(e => { const E = JEU.enigmes[e]; if (E) met(E.donne, "trouvé dans " + r.nom.replace(/^(La|Le|Les) /, m => m.toLowerCase())); });
  }
  for (const P of Object.values(JEU.personnages)) P.questions.forEach(q => met(q.donne, "d'après " + P.nom));
  return o;
})();
function montre(q) {
  const ids = q.si && q.si.a ? [].concat(q.si.a) : [];
  if (!ids.length) return null;
  return el("p", { class: "montre" }, "Vous montrez : " + ids.map(id => JEU.objets[id].nom + (ORIGINE[id] ? ` (${ORIGINE[id]})` : "")).join(" et "));
}
function vuePerso(pid) {
  const P = JEU.personnages[pid];
  const qs = P.questions.map((q, i) => ({ q, cle: `${pid}.${i}` })).filter(x => ok(x.q.si));
  modale(el("div", {}, el("div", { class: "entete-perso" }, image(P.image, "portrait"), el("div", {}, el("h2", {}, P.nom), el("p", { class: "aide" }, P.role))),
    qs.map(({ q, cle }) => el("button", { class: "btn ligne" + (S.questions.includes(cle) ? " fait" : ""), onclick: () => repondre(pid, q, cle) }, q.q, q.si && q.si.a ? el("small", { class: "montre-mini" }, " 📎 " + [].concat(q.si.a).map(id => JEU.objets[id].nom).join(", ")) : null)),
    el("button", { class: "btn principal", onclick: vuePiece }, "Retour à la pièce")), true);
}
function repondre(pid, q, cle) {
  const rep = Array.isArray(q.r) ? premier(q.r) : { texte: q.r, donne: q.donne };
  if (!S.questions.includes(cle)) { S.questions.push(cle); sauver(); }
  donner(rep.donne || q.donne);
  modale(el("div", {}, el("div", { class: "entete-perso" }, image(JEU.personnages[pid].image, "portrait petit"), el("p", { class: "question" }, q.q)), montre(q), el("blockquote", {}, rep.texte), el("p", { class: "aide" }, "— " + JEU.personnages[pid].nom),
    el("button", { class: "btn principal", onclick: () => vuePerso(pid) }, "Autre question")), true);
}

/* ---------------- énigmes ---------------- */
function vigenere(clair, cle) {
  const k = norm(cle).replace(/[0-9]/g, "") || "A"; let j = 0;
  return norm(clair).split("").map(c => String.fromCharCode((c.charCodeAt(0) - 65 + k.charCodeAt(j++ % k.length) - 65) % 26 + 65)).join("");
}
function vueEnigme(eid) {
  const E = JEU.enigmes[eid], rep = S.enigmesOk.includes(eid), ici = emplacement(S.ici).repere;
  const enonce = E.enonce.replace("{MOTCONSIGNE}", ici.motConsigne).replace("{NOMBRECONSIGNE}", ici.nombreConsigne);
  const bloc = el("div", {}, el("h2", {}, E.titre), el("p", {}, enonce), image(E.image));
  if (E.type === "vigenere") bloc.append(el("p", { class: "chiffre" }, vigenere(E.clair, ici.mot)));
  if (E.miroir) bloc.append(el("p", { class: "miroir" }, E.miroir));
  if (rep) { bloc.append(el("p", { class: "succes" }, "✓ " + E.bravo)); }
  else {
    const verifier = (val) => {
      const attendu = E.type === "vigenere" ? E.clair : E.type === "comptage" ? String(ici.nombre) : E.type === "choix" ? E.reponse : E.reponse;
      const juste = E.type === "choix" ? val === attendu : norm(val) === norm(attendu);
      if (Date.now() < (S.blocEnigme || 0)) return toast(`Trop d'essais. Patientez ${Math.ceil((S.blocEnigme - Date.now()) / 1000)} s.`);
      if (juste) { S.suiteErr = 0; S.enigmesOk.push(eid); sauver(); son("reussite"); donner(E.donne); toast("Bravo !"); vueEnigme(eid); return; }
      S.essais[eid] = (S.essais[eid] || 0) + 1; S.penalites += C.penaliteErreurEnigme; S.suiteErr = (S.suiteErr || 0) + 1;
      let msg = `Rien ne se passe… −${C.penaliteErreurEnigme} point`;
      if (S.suiteErr >= C.erreursEnigmeAvantBlocage) { S.suiteErr = 0; S.blocEnigme = Date.now() + C.blocageEnigmeSecondes * 1000; msg += ` · cadenas bloqué ${C.blocageEnigmeSecondes} s`; }
      sauver(); son("echec"); toast(msg); if (S.essais[eid] >= 2 && E.indice) vueEnigme(eid);
    };
    if (E.type === "choix") E.choix.forEach((c, i) => bloc.append(el("button", { class: "btn ligne", onclick: () => verifier(i) }, c, E.choixImages ? el("img", { class: "illus", src: E.choixImages[i], alt: "" }) : null)));
    else {
      const input = el("input", { type: "text", placeholder: "Votre réponse", autocomplete: "off" });
      input.addEventListener("keydown", ev => { if (ev.key === "Enter") verifier(input.value); });
      bloc.append(input, el("button", { class: "btn", onclick: () => verifier(input.value) }, "Essayer"));
    }
    if ((S.essais[eid] || 0) >= 2 && E.indice) bloc.append(el("p", { class: "aide" }, "Indice : " + E.indice));
  }
  bloc.append(el("button", { class: "btn principal", onclick: vuePiece }, "Retour à la pièce"));
  modale(bloc, true);
}

/* ---------------- carte ---------------- */
function vueCarte() {
  const v = $("#vue"); v.innerHTML = "";
  const fond = JEU.cartes[S.fondCarte || 0] || JEU.cartes[0];
  const interieur = el("div", { class: "carte-int" }, el("img", { src: fond.src, alt: fond.nom }));
  const carte = el("div", { class: "carte" }, interieur);
  const marque = (x, y, txt, cls, etiquette) => interieur.append(el("div", { class: "marque " + cls, style: `left:${x}%;top:${y}%` }, txt, etiquette ? el("span", {}, etiquette) : null));
  marque(JEU.qg.x, JEU.qg.y, "QG", "qg", "Salon");
  JEU.emplacements.forEach(e => {
    const p = S.visites[e.n], ouverte = minute() >= JEU.ouvertures[pieceDe(e.n)];
    const apres = minute() >= C.meurtreMin, revue = apres && S.apres && S.apres[e.n];
    marque(e.x, e.y, e.n, apres ? (revue ? "ouverte" : "arevisiter") : (ouverte ? "ouverte" : "fermee"), p ? JEU.pieces[p].nom.replace(/^L[ae]s? |^L'/, "") : null);
  });
  const bascule = el("div", { class: "bascule" }, JEU.cartes.map((c, i) => el("button", { class: (S.fondCarte || 0) === i ? "actif" : "", onclick: () => { S.fondCarte = i; sauver(); vueCarte(); } }, c.nom)));
  v.append(el("h2", {}, "Plan du parc"), bascule,
    minute() >= C.meurtreMin
      ? el("p", { class: "legende" }, el("i", { class: "pastille arevisiter" }), "à revisiter ", el("i", { class: "pastille ouverte" }), "revisitée")
      : el("p", { class: "legende" }, el("i", { class: "pastille ouverte" }), "ouverte ", el("i", { class: "pastille fermee" }), "fermée pour l'instant"),
    carte,
    el("p", { class: "aide" }, "Faites glisser le plan pour vous déplacer. Une fois visitée, la porte affiche la pièce qu'elle cache… pour votre équipe seulement."),
    el("p", { class: "credit" }, JEU.creditCarte));
}

/* ---------------- carnet ---------------- */
function vueCarnet() {
  const v = $("#vue"); v.innerHTML = "";
  v.append(el("h2", {}, `Carnet (${S.objets.length})`));
  [...S.objets].reverse().forEach(id => {
    const o = JEU.objets[id];
    const d = el("details", { class: "objet" }, el("summary", {}, o.nom), image(o.image), el("p", {}, o.texte));
    v.append(d);
  });
}

/* ---------------- règles ---------------- */
function vueRegles() {
  const v = $("#vue"); v.innerHTML = "";
  const l = (...t) => el("li", {}, ...t), pts = n => `${n} point${n > 1 ? "s" : ""}`;
  v.append(el("h2", {}, "Règles du jeu"),
    el("p", {}, "Une lettre anonyme annonce un meurtre au château ce soir. Vous êtes de futurs inspecteurs de l'unité EGGER : explorez, interrogez, fouillez, puis désignez le coupable avant que le château ne ferme."),
    el("h3", {}, "Déroulement"),
    el("ul", {},
      l("Chaque QR code du parc est une porte du château. Scannez-le, répondez à la question de relevé (observez bien le lieu), puis entrez."),
      l("Les portes s'ouvrent peu à peu : le plan indique en vert celles qui sont ouvertes et en rouge celles qui sont fermées."),
      l("Le château vit pendant la soirée. Quand les portes changent de couleur sur le plan, quelque chose s'est passé : revisitez tout."),
      l(`L'accusation s'ouvre à la minute ${C.accusationMin}. Retour au Grand Salon conseillé à la minute ${C.rappelMin}. À la minute ${C.dureeMin}, le château et l'accusation ferment.`),
      l("Le Carnet garde tout ce que vous trouvez. Les questions posées aux personnages dépendent de ce que vous avez déjà découvert.")),
    el("h3", {}, "Les points"),
    el("ul", {},
      l(`Coupable trouvé : +${pts(C.bareme.coupable)}, et +${pts(C.bareme.preuvePresentee)} par preuve valable présentée (3 au maximum)`),
      l(`Chaque indice découvert (fouille, témoignage, énigme) : +${pts(C.bareme.indice)}`),
      l(`Chaque preuve découverte contre le coupable : +${pts(C.bareme.preuveTrouvee)} de plus`),
      l(`Chaque énigme résolue : +${pts(C.bareme.enigme)}`),
      l(`Mauvaise réponse à une énigme : −${pts(C.penaliteErreurEnigme)}`),
      l(`Mort stupide (un piège !) : −${pts(C.penalitePiege)}`),
      l(`Mauvais coupable : −${pts(C.bareme.mauvaisCoupable)} ; preuve qui ne prouve rien : −${pts(C.penalitePreuveFausse)}`),
      l(`Scanner les portes à la chaîne sans vraiment les visiter : −${pts(C.penaliteTriche)}, et l'organisateur est prévenu`),
      l(`À la minute ${C.dureeMin}, l'accusation se ferme : une équipe qui n'a pas accusé ne marque que ses découvertes.`),
      l("Égalité : l'équipe qui a découvert le plus d'indices passe devant, puis la plus rapide.")),
    el("h3", {}, "Fair-play"),
    el("ul", {},
      l("Un seul téléphone par équipe, du début à la fin. Gardez la page ouverte."),
      l("Les pièces sont différentes pour chaque équipe : inutile de comparer les numéros avec une autre équipe."),
      l("Fouiller, c'est risqué : certains objets sont des pièges. Réfléchissez avant de cliquer.")),
    el("p", { class: "aide" }, `Code d'équipe donné au départ : ${S.pid || "—"}.`),
    el("p", { class: "aide" }, `Pénalités de votre équipe pour l'instant : ${S.penalites} point${S.penalites > 1 ? "s" : ""}.`));
}

/* ---------------- accusation ---------------- */
function vueAccuser() {
  const v = $("#vue"); v.innerHTML = "";
  if (S.accusation) return vueResultat();
  const avecPreuve = S.objets.some(id => JEU.objets[id].preuve && !JEU.objetsDepart.includes(id));
  const suspects = JEU.suspects.filter(s => !s.cache || avecPreuve);
  let choix = null; const preuves = new Set();
  const liste = el("div", {}), lp = el("div", {});
  suspects.forEach(s => liste.append(el("label", { class: "choix" }, el("input", { type: "radio", name: "suspect", onclick: () => { choix = s.id; } }), s.nom)));
  S.objets.forEach(id => {
    const cb = el("input", { type: "checkbox" });
    cb.addEventListener("change", () => { if (cb.checked) { if (preuves.size >= 3) { cb.checked = false; return toast("Trois preuves maximum."); } preuves.add(id); } else preuves.delete(id); });
    lp.append(el("label", { class: "choix" }, cb, JEU.objets[id].nom));
  });
  v.append(el("h2", {}, "Accusation"), image(JEU.textes.imageSalon), el("p", { class: "aide" }, "Tous les suspects sont réunis au Grand Salon. Une seule accusation possible : choisissez un coupable et trois preuves."),
    el("h3", {}, "Le coupable"), liste, el("h3", {}, "Trois preuves"), lp,
    el("button", { class: "btn principal", onclick: () => {
      if (!choix) return toast("Choisissez un coupable.");
      if (preuves.size !== 3) return toast("Choisissez exactement trois preuves.");
      const nom = JEU.suspects.find(s => s.id === choix).nom;
      confirmer(`Accuser ${nom} ? C'est définitif.`, () => accuser(choix, [...preuves]));
    } }, "Accuser"));
}
function accuser(suspect, preuves) {
  /* Barème : trouver le coupable ET explorer. Rapport non remis à temps (suspect null) = 0 pour l'accusation. */
  const B = C.bareme, juste = suspect === JEU.coupable;
  const trouves = S.objets.filter(id => !JEU.objetsDepart.includes(id));
  const preuvesTrouvees = trouves.filter(id => JEU.objets[id].preuve).length;
  const vraies = preuves.filter(id => JEU.objets[id].preuve && !JEU.objetsDepart.includes(id)).length, fausses = preuves.length - vraies;
  let score = 0;
  if (juste) score += B.coupable + B.preuvePresentee * vraies;
  else if (suspect) { score -= B.mauvaisCoupable; if (preuves.filter(id => (JEU.objets[id].contre || []).includes(suspect)).length >= 2) score += B.consolation; }
  score -= C.penalitePreuveFausse * fausses;
  score += B.indice * trouves.length + B.preuveTrouvee * preuvesTrouvees + B.enigme * S.enigmesOk.length - S.penalites;
  const min = Math.round(Math.min(minute(), C.dureeMin));
  const brut = `${S.equipe.num}-${score < 0 ? "m" + (-score) : score}-${S.flags.length}-${min}-${trouves.length}-${S.pid || "000"}`;
  let h = 0; for (const c of brut + "EGGER") h = (h * 31 + c.charCodeAt(0)) % 1679616;
  S.accusation = { suspect, preuves, score, min, code: `T${brut}-${h.toString(36).toUpperCase().padStart(4, "0")}` };
  sauver(); majOngletAccuser(); vueResultat();
}
function vueResultat() {
  const v = $("#vue"); v.innerHTML = "";
  const A = S.accusation, sus = JEU.suspects.find(s => s.id === A.suspect);
  v.append(el("h2", {}, "Rapport remis"), el("p", {}, sus ? `Vous avez accusé : ${sus.nom}.` : "Le temps est écoulé : vous n'avez accusé personne. Vos découvertes comptent quand même."));
  if (sus && A.suspect !== JEU.coupable) {
    const contre = A.preuves.filter(id => (JEU.objets[id].contre || []).includes(A.suspect)).map(id => JEU.objets[id].nom);
    const def = (JEU.personnages[A.suspect] && JEU.personnages[A.suspect].accusation) || JEU.defenses[A.suspect] || "Vous vous trompez.";
    v.append(el("blockquote", {}, (contre.length ? `« Vous m'accusez avec : ${contre.join(", ")}. ` : "« Vous n'avez rien contre moi. ") + def + " »"));
  }
  v.append(el("p", {}, "La vérité sera révélée au Grand Salon, à la fin de la soirée."),
    el("p", { class: "aide" }, "Montrez ce code à l'organisateur :"), el("p", { class: "code" }, A.code));
  if (S.debrief) return v.append(vueDebrief());
  const champ = el("input", { type: "text", placeholder: "Mot de passe donné par l'organisateur", autocomplete: "off" });
  v.append(el("div", { class: "debrief-verrou" }, el("h3", {}, "Le fin mot de l'histoire"),
    el("p", { class: "aide" }, "Quand toutes les équipes seront revenues, l'organisateur donnera un mot de passe pour découvrir la vérité."),
    champ, el("button", { class: "btn principal", onclick: () => {
      if (norm(champ.value) !== norm(C.motDePasseSolution)) return toast("Ce n'est pas le bon mot de passe.");
      S.debrief = true; sauver(); majOngletAccuser(); vueResultat(); } }, "Découvrir la vérité")));
}
function vueDebrief() {
  const A = S.accusation, trouves = S.objets.filter(id => !JEU.objetsDepart.includes(id));
  const preuves = Object.keys(JEU.objets).filter(id => JEU.objets[id].preuve && !JEU.objetsDepart.includes(id));
  const B = C.bareme, juste = A.suspect === JEU.coupable;
  const bloc = el("div", { class: "debrief" }, el("h2", {}, juste ? "Vous aviez raison." : "La vérité"));
  JEU.textes.debrief.forEach(s => bloc.append(...[el("h3", {}, s.titre), s.texte && el("p", {}, s.texte), s.liste && el("ul", {}, s.liste.map(t => el("li", {}, t)))].filter(Boolean)));
  bloc.append(el("h3", {}, "Vos preuves contre Vidal"),
    el("p", {}, `Vous en avez découvert ${preuves.filter(id => trouves.includes(id)).length} sur ${preuves.length}.`),
    el("ul", { class: "preuves-bilan" }, preuves.map(id => el("li", { class: trouves.includes(id) ? "ok" : "rate" }, (trouves.includes(id) ? "✔ " : "✘ ") + JEU.objets[id].nom))),
    el("h3", {}, "Votre score"),
    el("ul", {},
      el("li", {}, juste ? `Coupable trouvé : +${B.coupable}, preuves présentées : +${B.preuvePresentee * A.preuves.filter(id => JEU.objets[id].preuve && !JEU.objetsDepart.includes(id)).length}` : A.suspect ? "Mauvais coupable" : "Pas d'accusation"),
      el("li", {}, `Indices découverts : ${trouves.length} sur ${Object.keys(JEU.objets).length - JEU.objetsDepart.length}`),
      el("li", {}, `Énigmes résolues : ${S.enigmesOk.length} sur ${Object.keys(JEU.enigmes).length}`),
      el("li", {}, `Pénalités (pièges, erreurs, triche) : −${S.penalites}`),
      el("li", {}, el("b", {}, `Total : ${A.score} points`))));
  return bloc;
}

/* ---------------- cinématique ---------------- */
function cinematique() {
  fermerModale(); arreterCamera(); S.ici = null;
  if (navigator.vibrate) navigator.vibrate([300, 150, 300]); son("cloche");
  jouerCine(JEU.textes.meurtre, "Reprendre l'enquête", () => onglet("carte"));
}
function jouerCine(lignes, libelle, apres) {
  /* une scène à la fois : on touche l'écran pour passer à la suivante (pas avant 0,8 s, pour éviter les doubles touches) */
  const o = $("#cine"); o.hidden = false; o.innerHTML = ""; let i = 0, pret = 0;
  const indice = el("p", { class: "cine-suite" }, "Touchez l'écran pour continuer ▸");
  const suivant = () => {
    if (Date.now() < pret) return;
    indice.remove();
    if (i < lignes.length) {
      const l = lignes[i++], txt = typeof l === "string" ? l : l.texte;
      if (l.img) { o.innerHTML = ""; const im = el("img", { class: "cine-img", src: l.img, alt: "" }); im.onerror = () => im.remove(); o.append(im); }
      o.append(el("p", { class: "cine-ligne" }, txt));
      pret = Date.now() + 800;
      const resteImages = lignes.slice(i).some(x => x && x.img);
      if (i < lignes.length && !resteImages) { pret = Infinity; setTimeout(() => { pret = 0; suivant(); }, 2400); }
      else if (i < lignes.length) o.append(indice);
      else { o.onclick = null; o.append(el("button", { class: "btn principal", onclick: e => { e.stopPropagation(); o.hidden = true; o.onclick = null; apres(); } }, libelle)); }
      o.scrollTop = o.scrollHeight;
    }
  };
  o.onclick = suivant;
  suivant();
}

/* ---------------- fenêtres ---------------- */
function modale(contenu, large) { const m = $("#modale"); m.hidden = false; const b = $("#modaleCorps"); b.innerHTML = ""; b.className = large ? "large" : ""; b.append(contenu); b.scrollTop = 0; }
function fermerModale() { $("#modale").hidden = true; }
function alerte(titre, texte, suite) { modale(el("div", {}, el("h2", {}, titre), el("p", {}, texte), el("button", { class: "btn principal", onclick: () => { fermerModale(); suite && suite(); } }, "OK"))); }
function confirmer(texte, oui) { modale(el("div", {}, el("p", {}, texte), el("div", { class: "rang" }, el("button", { class: "btn", onclick: fermerModale }, "Non"), el("button", { class: "btn principal", onclick: () => { fermerModale(); oui(); } }, "Oui")))); }
function toast(t, ms = 3000) { const z = $("#toasts"); while (z.children.length >= 2) z.firstChild.remove(); const d = el("div", { class: "toast" }, t); z.append(d); setTimeout(() => d.remove(), ms); }

/* ---------------- panneau MJ / test (?test dans l'adresse) ---------------- */
function panneauMJ() {
  const p = el("div", { id: "mj", class: "replie" },
    el("b", { onclick: () => p.classList.toggle("replie") }, "MODE TEST ▾"), el("span", { id: "mjInfo" }),
    el("div", {}, ...[1, 10, 60].map(x => el("button", { onclick: () => { rebaser(x); majMJ(); } }, `×${x}`)),
      el("button", { onclick: () => { rebaser(undefined, minute() + 5); tic(); } }, "+5 min"),
      el("button", { onclick: () => { const m = prompt("Aller à la minute :", Math.round(minute())); if (m !== null) { rebaser(undefined, +m); tic(); } } }, "Minute…"),
      el("button", { id: "mjTout", onclick: () => { S.toutAccepter = !S.toutAccepter; sauver(); majMJ(); } }, "")),
    el("div", {}, ...JEU.emplacements.map(e => el("button", { onclick: () => scan(e.n) }, `QR${e.n}`))),
    el("div", {}, el("button", { onclick: () => confirmer("Effacer la partie ?", () => { localStorage.removeItem(CLE); location.reload(); }) }, "Réinitialiser"),
      el("button", { onclick: () => alerte("Solutions (test)", "Relevés : 1, puis 2, puis 3 selon le passage · Écritures : « Soupε spécialε – M. Hallier » · Portrait : 1403 · Vigenère : INCENDIE · Buvard : MAUREL · Cendres : CONTRAT · Lanterne : " + JEU.emplacements[0].repere.nombre + " · Coffre de Hallier : 0903") }, "Solutions"),
      el("button", { onclick: () => alerte("Pièces de cette équipe", tirage(S.equipe.num).map((p, i) => `QR${i + 1}=${JEU.pieces[p].nom}`).join(" · ")) }, "Voir le tirage")));
  document.body.append(p); majMJ();
}
function majMJ() {
  const i = $("#mjInfo"); if (!i) return;
  i.textContent = ` min ${minute().toFixed(1)} · ×${S.base.vitesse} · pénalités ${S.penalites} · triches ${S.flags.length} · morts ${S.morts || 0}`;
  $("#mjTout").textContent = S.toutAccepter ? "Relevés : tout accepté" : "Relevés : vrais";
}

/* ---------------- hors ligne ---------------- */
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
$("#titre").textContent = JEU.titre; $("#sousTitre").textContent = JEU.sousTitre;
demarrer();
})();
