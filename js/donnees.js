/* =====================================================================
   LE DERNIER DÎNER — données du jeu
   Tout le scénario est ici : on peut le modifier sans toucher au code.

   Conditions ("si") possibles, combinables :
     { apres: 50 }          minute de jeu >= 50
     { avant: 50 }          minute de jeu < 50
     { a: "objet" }         l'équipe possède cet objet
     { a: ["x","y"] }       l'équipe possède tous ces objets
     { ou: [cond, cond] }   l'une des conditions
   ===================================================================== */

const JEU = {
  titre: "Le Dernier Dîner",
  sousTitre: "Unité EGGER — Experts et Géostratèges en Gestion d'Énigmes et de leurs Résolutions",

  config: {
    codeDepart: "DINER",        // code donné par le MJ au départ de la vague
    dureeMin: 165,              // durée totale (2 h 45) : à la fin, l'accusation se verrouille
    meurtreMin: 60,             // minute du meurtre, 15 min après les dernières portes (les conditions des données sont écrites pour 50)
    accusationMin: 135,         // l'onglet Accuser s'ouvre
    rappelMin: 140,             // l'app rappelle l'équipe au QG (25 min pour revenir et accuser)
    heureDebut: 20 * 60,        // la minute 0 = 20 h 00 dans l'histoire
    heureMeurtre: 20 * 60 + 50, // minute du meurtre = 20 h 50 (l'heure de l'histoire = l'heure réelle de l'équipe)
    antiTricheSecondes: 45,     // deux QR différents scannés en moins de 45 s = triche
    penaliteTriche: 5,          // points retirés
    penalitePiege: 5,          // points retirés par mort stupide (pièges)
    penaliteErreurEnigme: 1,    // points retirés à chaque mauvaise réponse à une énigme
    erreursEnigmeAvantBlocage: 3, // erreurs d'affilée avant que le cadenas se bloque
    blocageEnigmeSecondes: 30,
    penaliteAccusationFausse: 10, // coupable désigné à tort
    penalitePreuveFausse: 3,      // par « preuve » qui ne prouve rien
    erreursAvantBlocage: 3,     // mauvaises réponses au relevé avant blocage
    blocageSecondes: 60,
    motDePasseSolution: "HELENE", // à donner aux équipes quand tout le monde est revenu (majuscules et accents ignorés)
    bareme: { coupable: 40, preuvePresentee: 5, indice: 1, preuveTrouvee: 2, enigme: 3, mauvaisCoupable: 20, consolation: 10 },
    graine: 2027                // change le tirage des pièces pour toutes les équipes
  },

  /* Ouverture des pièces (minute de jeu) */
  ouvertures: { R1: 0, R5: 0, R4: 10, R2: 10, R8: 20, R9: 20, R6: 30, R7: 30, R3: 45, R10: 45 }, // minutes réelles ; buvette et chambre d'amis en dernier (rien à y voir avant le meurtre)

  /* ------------------------------------------------------------------
     LES 10 EMPLACEMENTS PHYSIQUES (QR codes)
     x, y : position sur la carte en %.
     releves : 3 questions visuelles, une différente à chaque passage.
     repere : mot et nombre lus sur place (énigmes à clé physique).
     >>> À REMPLIR LORS DU REPÉRAGE <<<
     ------------------------------------------------------------------ */
  emplacements: [
    { n: 1, nom: "Ruines du château – sommet", x: 18.2, y: 78.6 },
    { n: 2, nom: "Pointe ouest – allée basse", x: 5.7, y: 85.7 },
    { n: 3, nom: "Allée sud – sortie des ruines", x: 28.4, y: 76.2 },
    { n: 4, nom: "Carrefour de l'allée Auguste-Ferry", x: 26.1, y: 57.1 },
    { n: 5, nom: "Entrée de la grande pelouse", x: 39.2, y: 58.3 },
    { n: 6, nom: "La mare", x: 52.8, y: 36.9 },
    { n: 7, nom: "Allée du parc animalier", x: 63.6, y: 38.1 },
    { n: 8, nom: "Carrefour nord – chemin de Bruyères", x: 69.9, y: 9.5 },
    { n: 9, nom: "Maison « Le Château » (parc animalier)", x: 73.9, y: 29.0 },
    { n: 10, nom: "Entrée est – parking du Parc", x: 85.8, y: 25.0 }
  ].map(e => Object.assign({
    releves: [
      { q: `[QR ${e.n} – relevé 1 à définir] Ex. : de quelle couleur est le panneau le plus proche ?`, r: ["1"] },
      { q: `[QR ${e.n} – relevé 2 à définir] Ex. : combien de marches compte l'escalier voisin ?`, r: ["2"] },
      { q: `[QR ${e.n} – relevé 3 à définir] Ex. : quel animal est dessiné sur la plaque ?`, r: ["3"] }
    ],
    repere: {
      motConsigne: "le mot écrit en gros sur le panneau le plus proche",   // à adapter
      mot: "CHATEAU",                                                       // à relever
      nombreConsigne: "le nombre de poteaux autour de vous",               // à adapter
      nombre: 7                                                             // à relever
    }
  }, e)),

  cartes: [ { nom: "Vue aérienne", src: "img/carte-aerienne.jpg" }, { nom: "Plan", src: "img/carte-plan.jpg" } ],
  creditCarte: "Fonds de carte © IGN – Géoplateforme (licence ouverte)",

  qg: { nom: "QG – le Grand Salon (grande pelouse)", x: 50.0, y: 47.6 },

  /* ------------------------------------------------------------------
     OBJETS ET INDICES
     preuve: true  -> désigne vraiment le coupable (Vidal)
     contre: [...] -> semble accuser ces personnes (fausses pistes)
     ------------------------------------------------------------------ */
  objets: {
    lettre:        { image: "img/docs/doc_lettre.jpg", nom: "Lettre anonyme", texte: "« Cε soir, avant que sonnε la clochε de 21 h, un hommε paiεra cε qu'il a achεté. Il y a quatrε ans, vous n'avεz riεn pu εmpêchεr. Essayεz donc, détectivε. » Particularité : l'auteur trace ses « e » comme des ε.", preuve: true },
    cle_114:       { image: "img/objets/casier.jpg", nom: "Clé n° 114", texte: "Trouvée dans une valise abandonnée devant le château. Elle ouvre un casier numéroté." },
    bague:         { nom: "Alliance gravée", texte: "Dans la même valise. Gravure intérieure : « H. & V. — 1898 »." },

    menu:          { image: "img/docs/doc_menu.jpg", nom: "Menu du soir", texte: "Une ligne ajoutée à la main : « Soupε spécialε – M. Hallier »." , preuve: true },
    cuillere:      { nom: "Cuillère de Hallier", texte: "Elle sent l'amande amère." },
    cyanure:       { nom: "Diagnostic : cyanure", texte: "Le docteur Keller est formel : Hallier a été empoisonné au cyanure, versé dans sa soupe." },

    commande_19h:  { image: "img/docs/doc_commande.jpg", nom: "Feuille de commande", texte: "« Soupε spécialε pour M. Hallier, à préparεr dès 19 h. » Même écriture que la lettre. Or le détective est arrivé à 19 h 52…", preuve: true },
    lena_cuisine:  { nom: "Témoignage : Léna près des cuisines", texte: "Fernand a vu la couturière rôder autour des marmites.", contre: ["lena"] },
    temoin_fernand: { image: "img/cine/flash_cuisine.jpg", nom: "Témoignage : homme ganté à 20 h 30", texte: "Fernand, de dos dans la réserve, a vu passer un homme ganté près des marmites vers 20 h 30." },
    heure_arrivee: { nom: "Heure d'arrivée du détective", texte: "Le détective est arrivé à 19 h 52. La commande a été écrite pour 19 h.", preuve: true },

    cendrier:      { nom: "Cigarillos au rouge à lèvres", texte: "Dans le cendrier de la buvette. La marque préférée d'Irène.", contre: ["irene"] },
    buvette_vide:  { nom: "Registre de la buvette", texte: "Dernière consommation à 20 h 05. Personne n'a été servi à 20 h 30.", contre: ["irene"] },
    bouteille:     { image: "img/objets/bouteille.jpg", nom: "Bouteille manquante", texte: "Il manque une bouteille de cognac sur l'étagère de la buvette.", contre: ["marcus"] },

    dossier:       { image: "img/docs/doc_dossier.jpg", nom: "Dossier d'arrestation", texte: "Il y a quatre ans, le commissaire Vidal a arrêté Hallier. Le juge Maurel l'a acquitté. Vidal a été chassé de la police : il est devenu détective privé.", preuve: true },
    alibi_marcus:  { nom: "Alibi de Marcus", texte: "Seul à la bibliothèque à 20 h 30. Personne ne le confirme.", contre: ["marcus"] },
    dettes_marcus: { nom: "Dettes de Marcus", texte: "Des dettes de jeu énormes, que son père a promis de payer une fois le testament signé.", contre: ["marcus"] },

    registre_remise: { image: "img/docs/doc_registre.jpg", nom: "Registre de la remise", texte: "« Casier 114 — mallε déposéε à 19 h 00. » Signature illisible, écriture en ε.", preuve: true },
    malle:         { nom: "Malle du casier 114", texte: "Un costume de rechange et une paire de gants. Aucun nom." },
    fiole:         { nom: "Fiole vide", texte: "Retrouvée dans le casier 114 après 20 h 40. Odeur d'amande amère.", preuve: true },
    papiers_casier: { image: "img/cine/flash_pharmacie.jpg", nom: "Papiers du casier 114", texte: "Une ordonnance signée « K. » et un reçu de la pharmacie de la rue de Lyon, nom gratté.", contre: ["keller"] },
    lettre_amour:  { image: "img/docs/doc_lettre_amour.jpg", nom: "Lettre d'amour", texte: "Trouvée dans le sac du courrier. Écriture de médecin : « Odile, partons. »", contre: ["keller", "odile"] },
    feuilles_lena: { nom: "Feuilles de Léna", texte: "La liste des ouvriers morts dans l'incendie de l'usine Hallier.", contre: ["lena"] },
    temoin_lena:   { nom: "Témoignage : homme au casier 114", texte: "Léna a vu, vers 20 h 40, un homme ganté ouvrir le casier 114. Un homme en long manteau.", preuve: true },

    billet:        { image: "img/docs/doc_billet.jpg", nom: "Billet pour Constantinople", texte: "Un aller simple, déchiré en deux.", contre: ["odile"] },
    robes:         { nom: "Robes de deuil neuves", texte: "Trois robes noires, jamais portées.", contre: ["odile"] },
    photo_mariage: { nom: "Portrait de mariage", texte: "Au dos du cadre : « Auguste & Odile — 14 mars »." },
    photo_paul:    { nom: "Photo de Paul", texte: "Le fils d'Odile et d'Auguste, mort pendant un voyage d'affaires de son père." },
    buvard:        { image: "img/docs/doc_buvard.jpg", nom: "Buvard d'Odile", texte: "« Virez 20 000 F au juge Maurel. — O. »", contre: ["odile"] },
    alibi_keller_odile: { nom: "Alibi : Keller et Odile", texte: "À 20 h 30, ils dînaient dans la salle à manger, sous les yeux de tous." },
    chloral:       { image: "img/docs/doc_ordonnance.jpg", nom: "Ordonnance de chloral", texte: "Keller l'a prescrite il y a quatre ans à « M. V. ». À forte dose, le chloral fait oublier des heures entières.", preuve: true },

    gants_irene:   { nom: "Gants d'Irène", texte: "Ils sentent la suie, comme si on avait remué des cendres." },
    lettre_brulee: { image: "img/docs/doc_cendres.jpg", nom: "Lettre brûlée", texte: "Irène a brûlé son contrat avec Hallier." },
    alibi_irene:   { nom: "Alibi d'Irène", texte: "« À la buvette de la vigne, seule, à 20 h 30. »", contre: ["irene"] },
    aveu_irene:    { nom: "Aveu d'Irène", texte: "Elle était en fait dans le bureau de Hallier : elle y a pris son contrat, rangé dans le sous-main, pour le brûler.", contre: ["irene"] },

    traces:        { nom: "Traces dans la tour", texte: "Dans la poussière de la tour : les pas d'un seul homme, qui va et vient entre l'escalier et le parapet." },
    lanterne_signaux: { nom: "Lanterne de signal", texte: "Une lanterne à volets colorés, tournée vers l'autre rive de la vallée. Quelqu'un a transmis un message à des gens qui attendent là-bas." },
    longue_vue:    { nom: "Longue-vue de la tour", texte: "Elle est braquée sur la vigne et le potager : de là-haut, on voit tout le chemin jusqu'à la remise." },
    temoin_lacombe: { nom: "Témoignage : un homme pressé à 20 h 35", texte: "Lacombe a vu, de la tour, un homme en long manteau remonter de la vigne vers le potager à grands pas. « Pas un invité en habit. Une allure de policier. »", preuve: true },
    place_vidal:   { nom: "Plan de table", texte: "La place du détective, tout au bout de la salle, est restée intacte : il n'a pas dîné. Où était-il pendant le repas ?" },
    evier:         { nom: "Évier des cuisines", texte: "Le fond est trempé : quelqu'un s'est lavé les mains après avoir touché quelque chose de très toxique." },
    savon_vidal:   { nom: "Savon taché", texte: "Chambre du détective : un savon encore humide, jauni, avec une odeur d'amande. Quelqu'un s'est longuement lavé les mains.", preuve: true },
    armoire_fermee: { nom: "Armoire fermée", texte: "Dans la chambre d'amis, l'armoire du détective est fermée à clé. Pichon a peut-être un double." },
    cle_armoire:   { nom: "Clé de l'armoire", texte: "Le double de Pichon, pour l'armoire de la chambre d'amis." },
    visiteurs_chambre: { nom: "Visites dans la chambre", texte: "Selon Pichon, Odile et le docteur Keller sont entrés dans la chambre du détective pendant la soirée." },
    gants_vidal:   { nom: "Gants noirs du détective", texte: "Dans la poche intérieure du manteau du détective. Ils sentent l'amande amère.", preuve: true },
    marmite:       { nom: "Casserole de Hallier", texte: "Dans la petite casserole marquée « M. H. », un reste de soupe à l'odeur d'amande amère. Le poison a été versé en cuisine, avant le service." },
    verre_irene:   { nom: "Verre de cognac au rouge à lèvres", texte: "Un verre abandonné à la buvette, avec un cigarillo à moitié fumé. Irène a bu ici… puis elle est partie sans finir.", contre: ["irene"] },
    lettre_usurier: { nom: "Lettre d'un usurier", texte: "Adressée à Marcus : « Payez avant dimanche, ou nous viendrons chercher notre argent. »", contre: ["marcus"] },
    trousse_keller: { nom: "Trousse du docteur Keller", texte: "Casier 111 : une trousse de médecin ouverte. Éther, iode, seringues. Pas la moindre trace de cyanure." },
    mot_hallier:   { nom: "Mot de Hallier à Odile", texte: "« Reste dans ta chambre ce soir. J'ai une affaire à régler avec V. avant minuit. » V. comme Vidal ? Valcourt ?", contre: ["irene"] },
    bouquet:       { nom: "Roses noires", texte: "Un bouquet dans la loge d'Irène, et une carte : « Pour votre dernière représentation. — A. H. »", contre: ["irene"] },
    lettres_menaces: { nom: "Lettres de menaces", texte: "Une pile de lettres anonymes jetées au sol, des mois de menaces. Les « e » sont tous tracés comme des ε." },
    registre_lacombe: { image: "img/docs/doc_registre_lacombe.jpg", nom: "Registre de Lacombe", texte: "Des enveloppes portées au juge Maurel pour le procès « d'un commissaire trop honnête ». Verdict : 9 mars.", contre: ["lacombe"], preuve: true },
    alibi_lacombe: { nom: "Alibi de Lacombe", texte: "« Seul dans la tour de guet à 20 h 30, pour mes signaux. » Personne ne peut le confirmer.", contre: ["lacombe"] },

    reservation:   { image: "img/docs/doc_reservation.jpg", nom: "Réservation au nom de Vidal", texte: "Dans la mallette de Hallier : une chambre réservée pour « M. Vidal ». Hallier savait qu'il viendrait.", preuve: true },
    recus_maurel:  { nom: "Reçus du juge Maurel", texte: "Les paiements de Hallier au juge, il y a quatre ans.", contre: ["lacombe", "odile"] },
    testament:     { image: "img/docs/doc_testament.jpg", nom: "Testament non signé", texte: "Marcus devait hériter… dans deux jours. Il avait besoin que son père vive." },
    enveloppe:     { nom: "Enveloppe pour Pichon", texte: "Une liasse de billets, et un mot : « Pour vos services de ce soir. »", contre: ["pichon"] },

    telegramme:    { nom: "Brouillon de télégramme", texte: "Dans la corbeille de Hallier : « Vidal sera là ce soir. Tenez-le loin de moi. — A. H. »", contre: ["pichon"] },
    traces_boue:   { nom: "Empreintes boueuses", texte: "Des pas d'homme, de la buvette vers le potager et la remise. La terre est encore fraîche." },
    chaussures:    { nom: "Chaussures trempées", texte: "Celles du détective. De la terre du potager colle aux semelles.", preuve: true },
    mot_veste:     { image: "img/docs/doc_mot_veste.jpg", nom: "Mot dans la veste", texte: "« 20 h 30 – cuisinε. 20 h 40 – casiεr. Nε pas oubliεr. » Écriture en ε.", preuve: true },
    cachets:       { image: "img/objets/cachets.jpg", nom: "Boîte de chloral", texte: "Sur la table de nuit du détective. Presque vide." , preuve: true },
    photo_helene:  { image: "img/cine/flash_helene.jpg", nom: "Photo d'Hélène", texte: "Au dos : « Hélène — 9 mars 1902 ». Le jour du verdict, Hélène est morte.", preuve: true },
    temoin_pichon: { nom: "Témoignage : le détective à 20 h 45", texte: "Pichon a trouvé le détective couché à 20 h 45… avec des chaussures trempées.", preuve: true },
    neveu_pichon:  { nom: "Le neveu de Pichon", texte: "Disparu sur un bateau de Hallier. Pichon en veut à son maître.", contre: ["pichon"] }
  },

  objetsDepart: ["lettre", "cle_114", "bague"],

  /* ------------------------------------------------------------------
     PERSONNAGES ET QUESTIONS
     r : texte de réponse, ou liste [{si, texte}] (la 1re qui convient)
     ------------------------------------------------------------------ */
  personnages: {
    hallier: { image: "img/persos/hallier.jpg", nom: "Auguste Hallier", role: "Maître des lieux", questions: [
      { q: "Qui êtes-vous ?", r: "Auguste Hallier. Ce château, les usines de la vallée, la moitié des bateaux du port : tout est à moi. Ce soir, on fête les trente ans de ma compagnie." },
      { q: "Avez-vous reçu des menaces ?", r: "Des lettres anonymes ? J'en reçois chaque semaine. Les jaloux écrivent. Les hommes d'action signent." },
      { q: "Qui a commandé votre soupe spéciale ?", si: { a: "menu" }, r: "Pas moi. Une attention de Fernand, j'imagine. On me la sert à 20 h 45, avant le bal." },
      { q: "Connaissez-vous le détective Vidal ?", si: { a: "dossier" }, r: "(Il sourit.) Vidal ? À l'époque, il était commissaire. Un homme honnête. Ça ne lui a pas réussi." },
      { q: "Que faites-vous ce soir ?", r: "Je dîne, je reçois, et je regarde mes ennemis boire mon vin. Le meilleur moment de l'année." }
    ]},
    pichon: { image: "img/persos/pichon.jpg", nom: "Pichon", role: "Majordome", questions: [
      { q: "Qui êtes-vous ?", r: "Pichon, majordome de Monsieur depuis vingt ans." },
      { q: "Où étiez-vous vers 20 h 30 ?", si: { apres: 50 }, r: "À mon service, dans le couloir des chambres." },
      { q: "Avez-vous vu le détective pendant la soirée ?", si: { apres: 50 }, donne: ["temoin_pichon"], r: "À 20 h 45, j'ai ouvert la porte de sa chambre. Il dormait… avec des chaussures trempées, comme s'il revenait du potager." },
      { q: "Pourquoi Hallier vous a-t-il payé ?", si: { a: "enveloppe" }, r: "Pour tenir le détective loin de sa table. Monsieur savait qu'il viendrait ce soir." },
      { q: "Aimiez-vous votre maître ?", si: { a: "enveloppe" }, donne: ["neveu_pichon"], r: "Mon neveu est parti sur un bateau de Monsieur. Il n'est jamais revenu. Je l'ai servi vingt ans. Je ne l'ai pas aimé." },
      { q: "Vous avez la clé de l'armoire ?", si: { a: "armoire_fermee" }, donne: ["cle_armoire"], r: "Le double, oui. Monsieur le détective n'aime pas qu'on touche à ses affaires… Tenez. Je n'ai rien vu." },
      { q: "Quelqu'un d'autre est-il entré dans cette chambre ?", si: { apres: 50 }, donne: ["visiteurs_chambre"], r: "Madame Odile, vers 20 h 15, pour les serviettes. Le docteur Keller, juste avant le dîner, pour la migraine. Et la porte n'était pas fermée à clé : n'importe qui a pu entrer." },
      { q: "Pourquoi le détective dormait-il si profondément ?", si: { apres: 50 }, r: "Il a refusé le dîner : migraine. Il m'a demandé de l'eau et a pris deux gouttes d'un flacon. Puis plus rien. Je n'ai pas osé le réveiller." }
    ]},
    marcus: { image: "img/persos/marcus.jpg", nom: "Marcus", role: "Fils reconnu d'hier", questions: [
      { q: "Qui êtes-vous ?", r: "Marcus. Hier encore, j'étais le bâtard de Hallier. Depuis ce matin, je suis son fils et héritier. Charmant, non ?" },
      { q: "Où étiez-vous vers 20 h 30 ?", si: { apres: 50 }, donne: ["alibi_marcus"], r: "Ici, à la bibliothèque. Seul : Irène et Lacombe étaient sortis. Personne pour le confirmer, je sais." },
      { q: "Cette bouteille vient de la buvette ?", si: { a: "bouteille" }, r: "Empruntée. On ne va pas me pendre pour un cognac." },
      { q: "Cette lettre vous menace ?", si: { a: "lettre_usurier" }, r: "Mes créanciers sont impatients. Mon père payait : ce soir, c'était presque fait." },
      { q: "Hallier vous avait-il parlé d'un invité ?", si: { a: "telegramme", apres: 50 }, r: "À table, il a dit qu'un vieil ami viendrait. Il riait. Il avait peur, et il riait." },
      { q: "Votre visage sent le vice. Vous n'auriez rien à cacher ?", si: { pose: "marcus.0", apres: 16 }, donne: ["dettes_marcus"], r: "Vous êtes physionomiste… Des dettes de jeu, énormes. Mon père a promis de les régler dès que le testament sera signé, ce soir." },
      { q: "Le testament n'était pas signé.", si: { a: "testament" }, r: "Alors j'avais besoin qu'il vive deux jours de plus. Me voilà blanchi… et ruiné." }
    ]},
    fernand: { image: "img/persos/fernand.jpg", nom: "Fernand", role: "Cuisinier", questions: [
      { q: "Qui êtes-vous ?", r: "Fernand. Trente ans de casseroles chez Monsieur." },
      { q: "Qui a commandé la soupe spéciale ?", si: { a: "menu" }, r: "Une feuille glissée sous la porte. Je l'ai rangée dans le tiroir, fouillez donc." },
      { q: "Que contenait la casserole de Monsieur ?", si: { a: "marmite" }, r: "La soupe spéciale ? Je la préparais dès 19 h sur ordre écrit, mais on ne la sert qu'à 20 h 45. Entre-temps, n'importe qui est passé près du fourneau." },
      { q: "Avez-vous vu quelqu'un rôder ?", donne: ["lena_cuisine"], r: "La petite couturière de la remise. Elle tournait autour des marmites tout à l'heure." },
      { q: "Où étiez-vous vers 20 h 30 ?", si: { apres: 50 }, donne: ["temoin_fernand"], r: "Dans la réserve, de dos. Un homme ganté est passé près des marmites. Je n'ai pas vu son visage. Sur le moment, je n'y ai pas pensé…" },
      { q: "La commande dit 19 h. Qui était déjà là ?", si: { a: "commande_19h", apres: 50 }, donne: ["heure_arrivee"], r: "Les invités sont arrivés à 19 h 45. Le détective, lui, à 19 h 52 : je l'ai vu par la fenêtre. Alors qui a écrit ça pour 19 h ?" }
    ]},
    keller: { image: "img/persos/keller.jpg", nom: "Docteur Keller", role: "Médecin de la famille", questions: [
      { q: "Qui êtes-vous ?", r: "Docteur Keller, médecin des Hallier depuis quinze ans." },
      { q: "Où étiez-vous vers 20 h 30 ?", si: { apres: 50 }, donne: ["alibi_keller_odile"], r: "À table, comme tout le monde. Madame Hallier aussi : nous n'avons pas quitté la salle." },
      { q: "Avez-vous des poisons ?", si: { apres: 50 }, r: "Un médecin a des remèdes, pas des poisons. Et pas de cyanure, je vous le garantis." },
      { q: "Cette trousse est la vôtre ?", si: { a: "trousse_keller" }, r: "Oui. Fouillez-la : de l'éther, de l'iode, pas un gramme de cyanure." },
      { q: "Cette lettre d'amour est de vous ?", si: { a: "lettre_amour" }, r: "Oui. J'aime Odile depuis dix ans. Ce n'est pas un crime." },
      { q: "Cette ordonnance signée K. ?", si: { a: "papiers_casier", apres: 50 }, donne: ["chloral"], r: "Du chloral. Je l'ai prescrit il y a quatre ans à un certain M. V., brisé par la mort de sa femme. À forte dose, on oublie des heures entières." },
      { q: "Que pensez-vous de cette cuillère ?", si: { a: "cuillere" }, donne: ["cyanure"], r: "Amande amère. Cyanure, sans le moindre doute. Versé dans la soupe." }
    ], accusation: "Je soigne les gens, je ne les tue pas. Et je n'ai jamais eu de cyanure." },
    lena: { image: "img/persos/lena.jpg", nom: "Léna Morel", role: "Couturière de la soirée", questions: [
      { q: "Qui êtes-vous ?", r: "Léna Morel. Je couds les robes du bal : si une couture lâche, je dois être là. Madame m'a fait asseoir au fond de la salle. Mon père est mort dans l'usine de Hallier." },
      { q: "Où étiez-vous vers 20 h 30 ?", si: { apres: 50 }, r: "À ma table, au fond de la salle. Tout le monde m'a vue. Vers 20 h 40, je suis seulement allée chercher mon nécessaire de couture à la remise." },
      { q: "On vous a vue près des cuisines.", si: { a: "lena_cuisine" }, r: "J'allais chercher du pain. On me surveille parce que je suis pauvre." },
      { q: "Pourquoi ranger vos feuilles dans la remise ?", si: { a: "feuilles_lena", apres: 50 }, r: "Parce que personne ne fouille le panier d'une couturière." },
      { q: "Ces feuilles chiffrées ?", si: { a: "feuilles_lena" }, r: "La liste des morts de l'incendie. Je veux un procès, je ne suis pas une meurtrière." },
      { q: "Avez-vous vu quelqu'un près des casiers ?", si: { apres: 50 }, donne: ["temoin_lena"], r: "Quand je suis allée chercher mon nécessaire à la remise, vers 20 h 40, un homme ganté refermait le casier 114. De dos. Un homme en long manteau. Je n'osais pas le dire." }
    ], accusation: "Je voulais le voir au tribunal, pas sous terre." },
    odile: { image: "img/persos/odile.jpg", nom: "Odile Hallier", role: "Épouse", questions: [
      { q: "Qui êtes-vous ?", r: "Odile Hallier. Trente ans de mariage, inspecteurs. Trente." },
      { q: "Où étiez-vous vers 20 h 30 ?", si: { apres: 50 }, donne: ["alibi_keller_odile"], r: "À table, à côté de mon mari, devant tout le monde. Le docteur Keller dînait au fond." },
      { q: "Qui est sur cette photo ?", si: { a: "photo_paul" }, r: "Paul, notre fils. Il est mort pendant qu'Auguste était en voyage d'affaires." },
      { q: "Que s'est-il passé quand les lumières se sont éteintes ?", si: { apres: 50 }, r: "Un cri, puis le bruit d'une chaise. Je tenais la main d'Auguste. Quand la lumière est revenue, elle était déjà froide." },
      { q: "Ce mot de votre mari ?", si: { a: "mot_hallier" }, r: "« V. » … Auguste avait toujours un V. à régler. Vidal, Valcourt, la vigne. Je n'ai jamais cherché à savoir." },
      { q: "Vous portez déjà le deuil ?", si: { a: "robes" }, r: "Le deuil de Paul. Il ne m'a jamais quittée." },
      { q: "Un billet pour Constantinople ?", si: { a: "billet" }, r: "Je voulais partir. Je l'ai déchiré moi-même. Je n'ai jamais eu le courage." },
      { q: "Pourquoi payer le juge Maurel ?", si: { a: "buvard" }, r: "Auguste me l'a fait signer, il y a quatre ans. Maurel l'a acquitté. Un commissaire a perdu son poste pour ça." }
    ], accusation: "J'ai rêvé de le quitter. Pas de le tuer." },
    irene: { image: "img/persos/irene.jpg", nom: "Irène Valcourt", role: "Chanteuse", questions: [
      { q: "Qui êtes-vous ?", r: "Irène Valcourt. On m'applaudit à Paris, mais c'est Hallier qui encaisse." },
      { q: "Où étiez-vous vers 20 h 30 ?", si: { apres: 50 }, donne: ["alibi_irene"], r: "À la buvette de la vigne. Seule." },
      { q: "La buvette était vide à 20 h 30.", si: { a: ["buvette_vide", "alibi_irene"] }, donne: ["aveu_irene"], r: "… Bon. J'étais dans le bureau de Hallier. Mon contrat n'était pas dans le coffre : il traînait dans son sous-main, il ne s'en méfiait même pas. Je l'ai pris, et je l'ai brûlé dans ma loge." },
      { q: "Pourquoi ces roses noires ?", si: { a: "bouquet" }, r: "Il me les a fait envoyer à 19 h : mon dernier soir. Il me croyait brisée. Je n'ai pas pleuré : j'ai brûlé mon contrat." },
      { q: "Vous dites que Hallier encaisse. Vous n'êtes pas sous contrat ?", si: { pose: "irene.0" }, r: "Un contrat d'esclave. Il m'a tout donné, et il me reprend tout." },
      { q: "Et ces gants ?", si: { a: "gants_irene", apres: 50 }, r: "Sentez-les. De la suie, pas de l'amande. J'ai brûlé du papier, pas empoisonné un homme." }
    ], accusation: "J'ai menti sur la buvette, oui. Mais mes gants sentent la suie, pas l'amande." },
    lacombe: { image: "img/persos/lacombe.jpg", nom: "Lacombe", role: "Associé", questions: [
      { q: "Qui êtes-vous ?", r: "Lacombe, associé de la Compagnie Hallier. Et de ses dettes." },
      { q: "Où étiez-vous vers 20 h 30 ?", si: { apres: 50 }, donne: ["alibi_lacombe"], r: "Dans la tour de guet, seul, avec ma lanterne. Allez voir les traces dans la poussière." },
      { q: "Cette lanterne tournée vers l'autre rive, à quoi sert-elle ?", si: { a: "lanterne_signaux" }, r: "Des gens de loi m'attendent de l'autre côté de la vallée. Je leur fais signe d'où nous sommes, pour qu'ils viennent chercher le registre de Victor. Je n'ai jamais osé le leur remettre." },
      { q: "Que raconte ce registre ?", si: { a: "registre_lacombe" }, r: "J'ai porté des enveloppes au juge Maurel, pour le procès d'un commissaire trop honnête. Verdict le 9 mars. Hallier appelle ça « sa plus belle victoire »." },
      { q: "Sa mort vous arrange-t-elle ?", si: { a: "lanterne_signaux", apres: 50 }, r: "Sa mort me ruine. Je le voulais vivant, devant un tribunal : mort, il échappe aux gens de loi qui l'attendent." },
      { q: "Avez-vous vu quelqu'un depuis la tour ?", si: { a: "longue_vue", apres: 50 }, donne: ["temoin_lacombe"], r: "Vers 20 h 35, à la longue-vue : un homme en long manteau remontait de la vigne vers le potager, à grands pas. Pas un invité en habit. Une allure de policier." }
    ], accusation: "Sa mort me ruine. Je le voulais vivant." }
  },

  /* Suspects proposés à l'accusation (Vidal n'apparaît qu'avec au moins une preuve) */
  suspects: [
    { id: "odile", nom: "Odile Hallier" }, { id: "keller", nom: "Docteur Keller" },
    { id: "lena", nom: "Léna Morel" }, { id: "irene", nom: "Irène Valcourt" },
    { id: "lacombe", nom: "Lacombe" }, { id: "marcus", nom: "Marcus" },
    { id: "pichon", nom: "Pichon" }, { id: "fernand", nom: "Fernand" },
    { id: "vidal", nom: "Le détective Vidal", cache: true }
  ],
  coupable: "vidal",
  defenses: {
    marcus: "Le testament n'était pas signé. J'avais besoin qu'il vive.",
    pichon: "Je le détestais, c'est vrai. Mais j'ai passé la soirée dans le couloir, sous les yeux de tous.",
    fernand: "Si j'avais voulu l'empoisonner, j'avais trente ans pour le faire."
  },

  /* ------------------------------------------------------------------
     LES 10 PIÈCES DU CHÂTEAU
     ------------------------------------------------------------------ */
  pieces: {
    R1: { image: [ { si: { apres: 50 }, src: "img/decors/restaurant_apres.jpg" }, { src: "img/decors/restaurant_avant.jpg" } ], nom: "La Salle à manger",
      description: [
        { si: { apres: 50 }, texte: "Hallier s'est effondré sur sa table, la tête dans son assiette de soupe. Odile, livide, n'ose pas le toucher. Au fond, le docteur Keller s'est levé ; Léna n'a pas bougé de sa table. Derrière le comptoir, le barman est figé." },
        { texte: "Des petites tables nappées de blanc sous les lampes. Hallier dîne en tête-à-tête avec Odile, un cigare aux lèvres. Au fond, le docteur Keller dîne seul et Léna, la couturière, mange à l'écart. Derrière le comptoir, le barman prépare un cocktail." } ],
      presents: [ { id: "hallier", si: { avant: 50 } }, { id: "odile" }, { id: "keller" }, { id: "lena" } ],
      fouilles: [
        { id: "f_menu", label: "Le menu posé sur la table", donne: ["menu"], texte: "Une ligne ajoutée à la main : « Soupε spécialε – M. Hallier ». Ces « e » tracés comme des ε… vous les avez déjà vus." },
        { id: "f_plan_table", label: "Le plan de table", si: { apres: 50 }, donne: ["place_vidal"], texte: "La place du détective, tout au bout de la salle, est restée intacte : il n'a pas dîné." },
        { id: "f_cuillere", label: "L'assiette de Hallier", si: { apres: 50 }, donne: ["cuillere"], texte: "La cuillère sent l'amande amère. Un médecin pourrait confirmer." },
        { id: "p_soupe", label: "Goûter la soupe de Hallier (« un vrai inspecteur goûterait »)", si: { apres: 50 }, piege: [
          { img: "img/morts/f1_1.jpg", texte: "Vous vous penchez sur l'assiette de Hallier. Ça sent bon… l'amande." },
          { img: "img/morts/f1_2.jpg", texte: "Une cuillère. Juste une, pour vérifier." },
          { img: "img/morts/f1_3.jpg", texte: "Le cyanure, lui, n'avait pas besoin de vérifier." },
          "Heureusement, ce n'était qu'une vision. Le détective Vidal vous secoue : « Concentrez-vous ! »" ] } ],
      enigmes: ["e_ecriture"] },

    R2: { image: "img/decors/cuisine.jpg", nom: "Les Cuisines",
      description: [ { texte: "Fernand goûte une sauce au-dessus des fourneaux. Des casseroles de cuivre pendent partout ; au fond, la porte de la chambre froide est restée entrouverte." } ],
      presents: [ { id: "fernand" } ],
      fouilles: [
        { id: "f_tiroir", label: "Le tiroir du passe-plat", donne: ["commande_19h"], texte: "Une feuille de commande : « Soupε spécialε pour M. Hallier, à préparεr dès 19 h. »" },
        { id: "f_marmite", label: "La petite casserole marquée « M. H. »", si: { apres: 50 }, donne: ["marmite"], texte: "Un reste de soupe à l'odeur d'amande amère. Le poison a été versé ici, avant le service." },
        { id: "f_evier", label: "L'évier", si: { apres: 50 }, donne: ["evier"], texte: "Le fond est trempé. Quelqu'un s'est lavé les mains après avoir touché quelque chose de très toxique." },
        { id: "p_froide", label: "Entrer dans la chambre froide (personne n'y vient jamais)", piege: [
          { img: "img/morts/f7_1.jpg", texte: "La porte de la chambre froide est entrouverte. Juste un coup d'œil…" },
          { img: "img/morts/f7_2.jpg", texte: "Clac. La porte s'est refermée derrière vous. Pas de poignée de ce côté." },
          { img: "img/morts/f7_3.jpg", texte: "On vous retrouvera au dessert, servi en sorbet." },
          "Heureusement, ce n'était qu'une vision. Le détective Vidal vous secoue : « Concentrez-vous ! »" ] } ],
      enigmes: [] },

    R3: { image: "img/decors/buvette.jpg", nom: "La Buvette de la vigne",
      description: [ { texte: "Personne. Un piano fermé, des tabourets vides, un journal abandonné sur le comptoir et un verre de cognac à moitié bu. Drôle de buvette pour une soirée de fête." } ],
      presents: [],
      fouilles: [
        { id: "f_cendrier", label: "Le cendrier", donne: ["cendrier"], texte: "Des cigarillos marqués de rouge à lèvres." },
        { id: "f_etagere", label: "L'étagère des alcools", donne: ["bouteille"], texte: "Un emplacement vide : il manque une bouteille de cognac." },
        { id: "f_registre_buvette", label: "Le registre des consommations", si: { apres: 16 }, donne: ["buvette_vide"], texte: "Dernière commande notée à 20 h 05. Ensuite, plus personne." },
        { id: "f_verre", label: "Le verre de cognac à moitié bu", si: { apres: 50 }, donne: ["verre_irene"], texte: "Marqué de rouge à lèvres, avec un cigarillo à moitié fumé. Irène a bu ici, puis elle est partie sans finir." },
        { id: "p_cognac", label: "Finir le cognac abandonné (un verre, juste un)", piege: [
          { img: "img/morts/m_cognac_1.jpg", texte: "Un verre de cognac à moitié bu. Quelqu'un l'a abandonné là. Quel gâchis." },
          { img: "img/morts/m_cognac_2.jpg", texte: "Une gorgée. Puis une autre. Pour la science." },
          { img: "img/morts/m_cognac_3.jpg", texte: "Le dernier verre de votre carrière : le cognac était excellent, et mélangé à autre chose." },
          "Heureusement, ce n'était qu'une vision. Le détective Vidal vous secoue : « Concentrez-vous ! »" ] },
        { id: "f_sol_buvette", label: "Le sol devant la porte de service", si: { apres: 50 }, donne: ["traces_boue"], texte: "Des empreintes d'homme, encore pleines de terre humide, qui sortent par la porte de service vers le potager et la remise." } ],
      enigmes: [] },

    R4: { image: [ { si: { ou: [ { avant: 15 }, { apres: 35 } ] }, src: "img/decors/bibliotheque.jpg" } ], nom: "La Bibliothèque",
      description: [
        { si: { apres: 15, avant: 35 }, texte: "Marcus est resté seul devant la cheminée, une bouteille à portée de main. Le canapé d'Irène et le fauteuil de Lacombe sont vides. Au mur, le portrait de Hallier vous toise." },
        { texte: "Devant la cheminée, trois invités se tiennent à l'écart de la fête : Irène sur le canapé, Marcus dans un fauteuil, Lacombe face au feu. Une bouteille trône sur la table basse. Au mur, le portrait de Hallier vous toise." } ],
      presents: [ { id: "irene", si: { ou: [ { avant: 15 }, { apres: 35 } ] } }, { id: "marcus" }, { id: "lacombe", si: { ou: [ { avant: 15 }, { apres: 35 } ] } } ],
      fouilles: [
        { id: "f_table_basse", label: "Sous la bouteille, sur la table basse", si: { apres: 50 }, donne: ["lettre_usurier"], texte: "Une lettre froissée adressée à Marcus : « Payez avant dimanche, ou nous viendrons chercher notre argent. »" },
        { id: "p_livre", label: "Tirer sur le gros livre rouge qui dépasse (un passage secret ?)", piege: [
          { img: "img/morts/m_livre_1.jpg", texte: "Un gros livre rouge dépasse de l'étagère. Un passage secret, forcément. Vous tirez." },
          { img: "img/morts/m_livre_2.jpg", texte: "Un grondement. La bibliothèque entière se met à pencher." },
          { img: "img/morts/m_livre_3.jpg", texte: "Vous voilà enseveli sous trois siècles de littérature. Au moins, vous aurez été lu." },
          "Heureusement, ce n'était qu'une vision. Le détective Vidal vous secoue : « Concentrez-vous ! »" ] },
        { id: "f_portrait", label: "Le portrait de Hallier", texte: "Derrière le cadre, un petit coffre à 4 chiffres. Sur la plaque : « Le plus beau jour de ma vie »." } ],
      enigmes: ["e_portrait"] },

    R5: { image: "img/decors/remise.jpg", nom: "La Remise du potager",
      description: [ { texte: "Personne. C'est ici que les invités déposent leurs malles et que le personnel de la soirée range ses affaires. Des casiers numérotés, dont le 111 et le 114. Un registre est ouvert près de la porte, des sacs de courrier s'entassent au fond, une corde pend d'une poulie." } ],
      presents: [],
      fouilles: [
        { id: "f_registre_remise", label: "Le registre de la remise", donne: ["registre_remise"], texte: "« Casier 114 — mallε déposéε à 19 h 00. » La signature est illisible." },
        { id: "f_casier_avant", label: "Le casier 114", si: { a: "cle_114", avant: 40 }, donne: ["malle"], texte: "La clé tourne. Une malle sans nom : un costume de rechange, une paire de gants. Rien d'autre… pour l'instant." },
        { id: "f_casier_apres", label: "Le casier 114", si: { a: "cle_114", apres: 40 }, donne: ["fiole", "papiers_casier"], texte: "Quelqu'un est passé depuis 20 h 40. Une fiole vide qui sent l'amande amère, et des papiers pliés." },
        { id: "f_feuilles", label: "Le panier à ouvrage posé sur une malle", texte: "Le personnel de la soirée range ses affaires ici. Dans le panier de la couturière, sous les bobines : des feuilles couvertes de lettres sans suite, signées « L. M. ». Un code ?" },
        { id: "p_corde", label: "Tirer sur la corde de la poulie (elle a l'air de tenir)", piege: [
          { img: "img/morts/f6_1.jpg", texte: "Une corde pend d'une poulie. Où mène-t-elle ? Vous tirez un bon coup." },
          { img: "img/morts/f6_2.jpg", texte: "Un craquement, juste au-dessus de votre tête." },
          { img: "img/morts/f6_3.jpg", texte: "Écrasé sous la caisse « Suspendue – Article de valeur ». Elle, elle va bien." },
          "Heureusement, ce n'était qu'une vision. Le détective Vidal vous secoue : « Concentrez-vous ! »" ] },
        { id: "f_casier111", label: "Le casier 111, resté entrouvert", si: { apres: 50 }, donne: ["trousse_keller"], texte: "Une trousse de médecin ouverte : éther, iode, seringues. Pas la moindre trace de cyanure." },
        { id: "f_courrier", label: "Le sac du courrier", donne: ["lettre_amour"], texte: "Une lettre cachetée, écriture de médecin : « Odile, partons. »" } ],
      enigmes: ["e_vigenere"] },

    R6: { image: "img/decors/chambre_odile.jpg", nom: "La Chambre d'Odile",
      description: [ { texte: "Personne. Sur la commode, une bouteille de sherry et deux verres vides, restes d'un apéritif en tête-à-tête. Une robe noire pend à l'armoire, des bijoux attendent sur la coiffeuse. Au mur, le portrait d'Auguste et d'Odile, jeunes mariés." } ],
      presents: [],
      fouilles: [
        { id: "f_secretaire", label: "Le secrétaire", donne: ["billet"], texte: "Un billet pour Constantinople, aller simple, déchiré en deux." },
        { id: "f_armoire", label: "La robe noire et l'armoire", donne: ["robes"], texte: "Des robes de deuil neuves, jamais portées." },
        { id: "f_cadre", label: "Le tiroir de la coiffeuse", donne: ["photo_paul"], texte: "Un jeune garçon en costume marin. « Paul, 1894 »." },
        { id: "f_mariage", label: "Le portrait de mariage au mur", donne: ["photo_mariage"], texte: "Au dos du cadre, une date : « Auguste & Odile — 14 mars »." },
        { id: "f_chevet_odile", label: "La table de chevet", si: { apres: 50 }, donne: ["mot_hallier"], texte: "Sous l'oreiller, un mot de la main de Hallier : « Reste dans ta chambre ce soir. J'ai une affaire à régler avec V. avant minuit. »" },
        { id: "p_cordon", label: "Tirer le cordon de sonnette (pour appeler la femme de chambre)", piege: [
          { img: "img/morts/m_cordon_1.jpg", texte: "Un cordon de velours pend près du lit. Sans doute pour appeler la femme de chambre. Vous tirez." },
          { img: "img/morts/m_cordon_2.jpg", texte: "Au-dessus de vous, un craquement. Vous levez la tête, bien trop tard." },
          { img: "img/morts/m_cordon_3.jpg", texte: "Le lustre de cristal s'est décroché. Il n'a jamais sonné aussi fort." },
          "Heureusement, ce n'était qu'une vision. Le détective Vidal vous secoue : « Concentrez-vous ! »" ] } ],
      enigmes: ["e_buvard"] },

    R7: { image: "img/decors/loge_irene.jpg", nom: "La Loge d'Irène",
      description: [ { texte: "La loge est vide. Plumes, miroirs et parfum lourd. Dans la cheminée, des papiers ont brûlé il y a peu." } ],
      presents: [],
      fouilles: [
        { id: "f_gants", label: "La paire de gants longs", donne: ["gants_irene"], texte: "Des gants de soirée, longs. Ils sentent la suie, comme si on avait remué des cendres." },
        { id: "f_bouquet", label: "Le bouquet sur la coiffeuse", si: { apres: 50 }, donne: ["bouquet"], texte: "Des roses noires, et une carte : « Pour votre dernière représentation. — A. H. »" },
        { id: "p_buche", label: "Jeter une bûche dans la cheminée (un bon feu aide à réfléchir)", piege: [
          { img: "img/morts/m_buche_1.jpg", texte: "Les papiers ont brûlé ici. Un bon feu, ça aide à réfléchir. Vous lancez une bûche." },
          { img: "img/morts/m_buche_2.jpg", texte: "Le conduit était plein de la poudre des feux d'artifice de la fête. Un sifflement." },
          { img: "img/morts/m_buche_3.jpg", texte: "Le feu d'artifice commence avec une heure d'avance. Vous en êtes le bouquet final." },
          "Heureusement, ce n'était qu'une vision. Le détective Vidal vous secoue : « Concentrez-vous ! »" ] } ],
      enigmes: ["e_brulee"] },

    R8: { image: "img/decors/tour_guet.jpg", nom: "La Tour de guet",
      description: [
        { si: { apres: 15, avant: 35 }, texte: "Tout en haut, dans le vent, Lacombe agite une lanterne vers l'autre rive de la vallée. Il sursaute en vous voyant." },
        { texte: "Personne, tout en haut. Le vent. Une lanterne de signal est posée sur le parapet, tournée vers l'autre rive de la vallée." } ],
      presents: [ { id: "lacombe", si: { apres: 15, avant: 35 } } ],
      fouilles: [
        { id: "f_traces", label: "Le sol poussiéreux", donne: ["traces"], texte: "Dans la poussière, les pas d'un seul homme : ils montent l'escalier, vont jusqu'au parapet, puis redescendent. Personne d'autre n'est monté." },
        { id: "p_parapet", label: "Se pencher au parapet (une inscription à la craie y semble tracée)", piege: [
          { img: "img/morts/m_parapet_1.jpg", texte: "Une inscription à la craie, de l'autre côté du parapet. Un élément important, sans doute. Vous vous penchez pour la lire…" },
          "Un peu plus loin.",
          { img: "img/morts/m_parapet_2.jpg", texte: "Encore un tout petit peu plus loin." },
          { img: "img/morts/m_parapet_3.jpg", texte: "La tour de guet mesure vingt mètres. Vous les découvrez tous, un par un." },
          "Heureusement, ce n'était qu'une vision. Le détective Vidal vous secoue : « Concentrez-vous ! »" ] },
        { id: "f_longue_vue", label: "La longue-vue braquée vers le bas", si: { apres: 50 }, donne: ["longue_vue"], texte: "Elle est dirigée sur la vigne et le potager : de là-haut, on voit tout le chemin jusqu'à la remise." },
        { id: "f_lanterne", label: "La lanterne de signal et le registre", donne: ["lanterne_signaux"], texte: "Une lanterne à volets colorés, tournée vers l'autre rive. Accroché à son pied, un registre fermé par un cadenas à chiffres." } ],
      enigmes: ["e_comptage"] },

    R9: { image: [ { si: { apres: 50 }, src: "img/decors/bureau.jpg" }, { src: "img/decors/bureau_hallier_avant.jpg" } ], nom: "Le Bureau de Hallier",
      description: [
        { si: { apres: 50 }, texte: "Le bureau a été fouillé à la hâte : papiers et livres au sol, mallette ouverte, tiroirs béants. Au mur, le portrait d'une mère et de son enfant. Le coffre-fort, lui, a résisté." },
        { si: { apres: 15, avant: 35 }, texte: "Quelqu'un est là : Irène, à genoux devant un tiroir ouvert, se relève d'un bond. « Je… je cherchais les toilettes. »" },
        { texte: "Le bureau sent le cuir et le tabac froid. Hallier est à table : personne ne devrait être ici. Dans un coin, un coffre-fort à 4 chiffres." } ],
      presents: [ { id: "irene", si: { apres: 15, avant: 35 } } ],
      fouilles: [
        { id: "f_corbeille", label: "La corbeille à papier", donne: ["telegramme"], texte: "Un brouillon de télégramme froissé : « Vidal sera là ce soir. Tenez-le loin de moi. — A. H. »" },
        { id: "f_papiers_sol", label: "Les papiers jetés au sol", si: { apres: 50 }, donne: ["lettres_menaces"], texte: "Des lettres anonymes, des mois de menaces. Les « e » sont tous tracés comme des ε." },
        { id: "p_tiroir", label: "Forcer le tiroir verrouillé (Hallier y cache forcément quelque chose)", piege: [
          { img: "img/morts/m_tiroir_1.jpg", texte: "Un tiroir verrouillé. Hallier cache forcément quelque chose dedans. Vous forcez." },
          { img: "img/morts/m_tiroir_2.jpg", texte: "Clic. Un vieux piège à pistolet, installé par un homme qui se méfie de tout le monde." },
          { img: "img/morts/m_tiroir_3.jpg", texte: "Hallier se méfiait de tout le monde. Vous l'apprenez trop tard." },
          "Heureusement, ce n'était qu'une vision. Le détective Vidal vous secoue : « Concentrez-vous ! »" ] },
        { id: "f_mallette", label: "La mallette de Hallier", si: { apres: 50 }, donne: ["reservation"], texte: "Une réservation de chambre au nom de « M. Vidal ». Hallier savait qu'il viendrait." } ],
      enigmes: ["e_coffre"] },

    R10: { image: [ { si: { apres: 50 }, src: "img/decors/chambre_amis.jpg" }, { src: "img/decors/chambre_amis_couloir.jpg" } ], nom: "La Chambre d'amis",
      description: [
        { si: { apres: 50 }, texte: "La chambre du détective, vide : il vous a envoyés chercher son carnet. Lit défait, armoire fermée, valise au pied. Pichon vous a ouvert et attend dans le couloir, mal à l'aise. Bizarrement, la porte n'était pas fermée à clé tout à l'heure…" },
        { texte: "La porte est fermée à clé. Derrière, on entend ronfler : le détective se repose. Pichon monte la garde dans le couloir." } ],
      presents: [ { id: "pichon" } ],
      fouilles: [
        { id: "f_regard", label: "Regarder par le trou de la serrure", si: { avant: 50 }, texte: "Un manteau dans l'armoire, une valise au pied du lit. Le détective dort, tourné vers le mur." },
        { id: "f_chaussures", label: "Les chaussures au pied du lit", si: { apres: 50 }, donne: ["chaussures"], texte: "Trempées. De la terre du potager colle aux semelles." },
        { id: "f_armoire", label: "L'armoire", si: { apres: 50, pas: "cle_armoire" }, donne: ["armoire_fermee"], texte: "Fermée à clé. Le détective range-t-il toujours ses affaires sous clé ?" },
        { id: "f_veste", label: "Le manteau dans l'armoire", si: { a: "cle_armoire" }, donne: ["mot_veste"], texte: "Un mot plié : « 20 h 30 – cuisinε. 20 h 40 – casiεr. Nε pas oubliεr. »" },
        { id: "f_lavabo", label: "Le lavabo", si: { apres: 50 }, donne: ["savon_vidal"], texte: "Le savon est encore humide, jauni. Quelqu'un s'est longuement lavé les mains ici ce soir. Le détective… ou quelqu'un d'autre ?" },
        { id: "f_gants_vidal", label: "La poche intérieure du manteau", si: { a: "cle_armoire" }, donne: ["gants_vidal"], texte: "Une paire de gants noirs, qui sentent l'amande amère." },
        { id: "p_lit", label: "Vous allonger sur le lit défait (il a l'air si accueillant)", si: { apres: 50 }, piege: [
          { img: "img/morts/m_lit_1.jpg", texte: "Le lit du détective est défait, et tellement accueillant. Vous fermez les yeux une minute." },
          { img: "img/morts/m_lit_2.jpg", texte: "Les draps sentent le chloral. Vos paupières pèsent des tonnes." },
          { img: "img/morts/m_lit_3.jpg", texte: "Vous dormirez jusqu'à la fin de la soirée. Et la nuit suivante." },
          "Heureusement, ce n'était qu'une vision. Le détective Vidal vous secoue : « Concentrez-vous ! »" ] },
        { id: "f_chevet", label: "La table de nuit", si: { apres: 50 }, donne: ["cachets", "photo_helene"], texte: "Une boîte de chloral presque vide. Et une photo de femme ; au dos : « Hélène — 9 mars 1902 »." } ],
      enigmes: [] }
  },

  /* ------------------------------------------------------------------
     ÉNIGMES
     type : "choix" | "code" | "vigenere" | "comptage"
     ------------------------------------------------------------------ */
  enigmes: {
    e_ecriture: { titre: "Comparer les écritures", si: { a: "menu" }, type: "choix",
      enonce: "Laquelle de ces écritures est de la même main que la lettre anonyme ?",
      image: "img/docs/doc_lettre.jpg",
      choix: [ "Écriture A", "Écriture B", "Écriture C", "Écriture D" ],
      choixImages: [ "img/docs/ecr_a.jpg", "img/docs/ecr_b.jpg", "img/docs/ecr_c.jpg", "img/docs/ecr_d.jpg" ],
      reponse: 2, donne: [],
      bravo: "Même main. La personne qui a commandé la soupe a écrit la lettre." },

    e_portrait: { titre: "Le coffre du portrait", type: "code", image: "img/objets/coffre.jpg",
      enonce: "Un coffre à 4 chiffres. Sur la plaque, sous le portrait : « Le plus beau jour de ma vie ». Jour et mois (JJMM).",
      reponse: "1403", indice: "Il existe un autre portrait d'Hallier, ailleurs dans le château. La date est écrite au dos.", donne: ["dossier"],
      bravo: "Le coffre s'ouvre : un dossier d'arrestation, vieux de quatre ans." },

    e_vigenere: { titre: "Les feuilles chiffrées de Léna", type: "vigenere",
      clair: "INCENDIE",
      enonce: "Léna note tout en code. Le mot ci-dessous est chiffré par la méthode de Vigenère. La clé est {MOTCONSIGNE}.",
      indice: "Pour chaque lettre, reculez dans l'alphabet du rang de la lettre de la clé (A = 0, B = 1…).",
      donne: ["feuilles_lena"], bravo: "« INCENDIE » : la liste des morts de l'usine Hallier." },

    e_buvard: { titre: "Le buvard", type: "code", image: "img/docs/doc_buvard.jpg",
      enonce: "Le buvard du secrétaire a gardé l'empreinte d'une lettre, à l'envers. À qui l'argent était-il destiné ? (un nom)",
      reponse: "MAUREL", indice: "Retournez l'image : un miroir, ou l'écran d'un téléphone éteint.", donne: ["buvard"],
      bravo: "Un virement au juge Maurel, signé « O. »." },

    e_brulee: { titre: "Les cendres", type: "code", image: "img/docs/doc_cendres.jpg",
      enonce: "Dans la cheminée, trois morceaux de papier à demi brûlés. Quel mot Irène voulait-elle faire disparaître ?",
      reponse: "CONTRAT", indice: "Recollez le 1er et le 3e morceau.", donne: ["lettre_brulee"],
      bravo: "Son contrat avec Hallier. Elle voulait le détruire." },

    e_comptage: { titre: "Le cadenas de la lanterne", type: "comptage",
      enonce: "Le cadenas attend un nombre. Gravé dessus : « Comptez {NOMBRECONSIGNE} ».",
      donne: ["registre_lacombe"], bravo: "Le registre s'ouvre : les enveloppes du juge Maurel." },

    e_coffre: { titre: "Le coffre-fort de Hallier", si: { apres: 50 }, type: "code", image: "img/objets/coffre.jpg",
      enonce: "4 chiffres. Sur la porte, une inscription : « Ma plus belle victoire » (jour et mois, JJMM).",
      reponse: "0903", indice: "Lacombe connaît la date du verdict.", donne: ["recus_maurel", "testament", "enveloppe"],
      bravo: "Le coffre s'ouvre : reçus du juge Maurel, un testament, une enveloppe pour Pichon." }
  },

  /* ------------------------------------------------------------------
     TEXTES DE MISE EN SCÈNE
     ------------------------------------------------------------------ */
  /* Images facultatives : ajoutez  image: "img/xxx.jpg"  à une pièce, un personnage ou un objet. */

  textes: {
    meurtre: [
      "20 h 50.",
      { img: "img/cine/meurtre_1.jpg", texte: "On sert enfin à Hallier sa soupe spéciale. Il lève sa cuillère en riant." },
      "Un courant d'air glacé. Toutes les lumières du château s'éteignent.",
      { img: "img/cine/meurtre_2.jpg", texte: "Un cri, dans la salle à manger." },
      { img: "img/cine/meurtre_3.jpg", texte: "Quand les bougies se rallument, Auguste Hallier est effondré sur sa soupe." },
      "Pichon court réveiller le détective.",
      "Le détective arrive, livide, la voix pâteuse :",
      "« Je n'ai pas pu l'empêcher… J'ai dû manquer quelque chose. »",
      "« Inspecteurs, il faut tout reprendre : revisitez toutes les pièces. Rien ne sera plus comme tout à l'heure. Et passez prendre mon carnet dans ma chambre. »",
      "Sur votre plan, les portes à revisiter sont en orange. Trouvez le coupable."
    ],
    imageBrief: "img/decors/restaurant_avant.jpg",
    imageSalon: "img/decors/salon.jpg",
    fermeture: "La soirée est terminée : les portes du château sont closes. Faites votre accusation et montrez l'écran à l'organisateur.",
    rappel: "La soirée touche à sa fin. Rejoignez le Grand Salon (le QG) et faites votre rapport : l'onglet « Accuser » est ouvert.",
    fin: "Le temps est écoulé : l'accusation est fermée. Montrez votre code à l'organisateur.",
    debrief: [
      { titre: "Le coupable : le détective Vidal", texte: "Celui qui vous a confié l'enquête est l'assassin. Vidal ne vous mentait pas : il ne se souvenait de rien." },
      { titre: "Pourquoi", texte: "Il y a quatre ans, le commissaire Vidal arrête Auguste Hallier pour l'incendie de l'usine de la Vologne : 31 morts. Hallier achète le juge Maurel, par les enveloppes que porte Lacombe et l'argent qu'Odile fait virer. Il est acquitté le 9 mars 1902. Le même jour meurt Hélène, la femme de Vidal. Vidal est chassé de la police et devient détective privé. Depuis, Keller lui prescrit du chloral : à forte dose, il fait oublier des heures entières." },
      { titre: "La soirée, heure par heure", liste: [
        "19 h 00 : Vidal, déjà sur place, écrit la commande de la « soupe spéciale » et dépose une malle au casier 114. Il signe de son écriture en ε, la même que la lettre anonyme.",
        "19 h 52 : il arrive « officiellement » par le dernier train. Hallier l'attendait : il a payé Pichon pour le tenir loin de sa table.",
        "Le dîner : Vidal le refuse, prétextant une migraine, et prend ses gouttes de chloral. Personne ne le voit à sa place.",
        "20 h 30 : il verse le poison dans la casserole de Hallier, aux cuisines. Fernand aperçoit un homme ganté.",
        "20 h 40 : il range la fiole et les gants au casier 114. Léna voit un homme en long manteau.",
        "Il remonte par le potager, les chaussures pleines de terre, se lave les mains et se couche. À 20 h 45, Pichon le trouve endormi, chaussures trempées.",
        "20 h 45 : on sert la soupe à Hallier. À 20 h 50, il meurt. Vidal se réveille sans aucun souvenir." ] },
      { titre: "Ce qui le trahit", texte: "L'écriture en ε, de la lettre au mot dans la veste. La commande écrite à 19 h, avant son arrivée officielle de 19 h 52. Le casier 114 : la clé était dans sa propre valise, avec son alliance « H. & V. ». La fiole et les gants à l'amande, la terre du potager sur ses chaussures, le chloral et la photo d'Hélène sur sa table de nuit." },
      { titre: "Les fausses pistes", liste: [
        "Odile a payé le juge et voulait partir avec Keller, mais elle dînait sous les yeux de tous.",
        "Keller est l'amant d'Odile. Son ordonnance était celle de Vidal.",
        "Léna voulait un procès pour les victimes de l'incendie, pas une vengeance.",
        "Irène a menti sur la buvette : elle était dans le bureau pour prendre son contrat et le brûler.",
        "Lacombe portait les enveloppes au juge, mais il voulait Hallier vivant, devant un tribunal.",
        "Marcus avait besoin que son père vive : le testament n'était pas signé.",
        "Pichon haïssait son maître pour son neveu disparu, mais il a passé la soirée dans le couloir.",
        "Fernand cuisinait pour Hallier depuis trente ans." ] }
    ]
  }
};
