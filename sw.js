/* Garde le jeu en mémoire sur le téléphone : il se rouvre même sans réseau. */
const CACHE = "ldd-v16";
const FICHIERS = ["./", "index.html", "css/style.css", "js/donnees.js", "js/heures.js", "fonts/vidal.woff2", "fonts/typo.woff2", "js/app.js", "lib/jsQR.js", "manifest.json",
  "img/morts/f1_1.jpg", "img/morts/f1_2.jpg", "img/morts/f1_3.jpg", "img/morts/f6_1.jpg", "img/morts/f6_2.jpg", "img/morts/f6_3.jpg", "img/morts/f7_1.jpg", "img/morts/f7_2.jpg", "img/morts/f7_3.jpg",
  "img/carte-aerienne.jpg", "img/carte-plan.jpg", "img/cine/flash_cuisine.jpg", "img/cine/flash_helene.jpg", "img/cine/flash_pharmacie.jpg", "img/cine/meurtre_1.jpg", "img/cine/meurtre_2.jpg", "img/cine/meurtre_3.jpg", "img/decors/bibliotheque.jpg", "img/decors/bureau.jpg", "img/decors/buvette.jpg", "img/decors/chambre_amis.jpg", "img/decors/chambre_odile.jpg", "img/decors/cuisine.jpg", "img/decors/remise.jpg", "img/decors/restaurant_apres.jpg", "img/decors/restaurant_avant.jpg", "img/decors/salon.jpg", "img/docs/doc_billet.jpg", "img/docs/doc_buvard.jpg", "img/docs/doc_cendres.jpg", "img/docs/doc_commande.jpg", "img/docs/doc_dossier.jpg", "img/docs/doc_lettre.jpg", "img/docs/doc_lettre_amour.jpg", "img/docs/doc_menu.jpg", "img/docs/doc_mot_veste.jpg", "img/docs/doc_ordonnance.jpg", "img/docs/doc_registre.jpg", "img/docs/doc_registre_lacombe.jpg", "img/docs/doc_reservation.jpg", "img/docs/doc_testament.jpg", "img/docs/ecr_a.jpg", "img/docs/ecr_b.jpg", "img/docs/ecr_c.jpg", "img/docs/ecr_d.jpg", "img/objets/bouteille.jpg", "img/objets/cachets.jpg", "img/objets/casier.jpg", "img/objets/coffre.jpg", "img/persos/fernand.jpg", "img/persos/hallier.jpg", "img/persos/irene.jpg", "img/persos/keller.jpg", "img/persos/lacombe.jpg", "img/persos/lena.jpg", "img/persos/marcus.jpg", "img/persos/odile.jpg", "img/persos/pichon.jpg", "img/persos/vidal.jpg"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim())));
/* réseau d'abord (pour recevoir les corrections), cache si pas de réseau */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => { const copie = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
