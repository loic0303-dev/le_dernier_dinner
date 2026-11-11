# Le Dernier Dîner — prototype

Jeu d'enquête de l'épreuve EGGER, Challenge Performances 2027 (parc du château d'Épinal).
C'est une simple page web : rien à installer pour les joueurs, juste un lien à ouvrir.

## Les fichiers

| Fichier | À quoi il sert |
| --- | --- |
| `index.html` | Le jeu |
| `test.html` | Le jeu en **mode test** (panneau vert : accélérer le temps, simuler les QR) |
| `qr.html` | Les 10 QR codes à imprimer (2 par page A4) |
| `js/donnees.js` | **Tout le scénario** : pièces, personnages, questions, énigmes, horaires, relevés. On modifie ici, pas dans le code. |
| `js/app.js` | Le moteur du jeu |
| `img/carte.jpg` | Le plan du parc (à remplacer par une vue satellite si tu veux, même nom de fichier) |

## Tester sur le PC (2 minutes)

1. Double-clique sur `test.html`.
2. Numéro d'équipe : n'importe lequel ; en mode test, le code de départ n'est pas vérifié.
3. Dans le panneau vert (clique sur « MODE TEST ▾ » pour l'ouvrir) :
   - `×10` / `×60` accélère le temps, `+5 min` ou `Minute…` saute dans le temps ;
   - `QR1` à `QR10` simulent un scan ;
   - « Relevés : tout accepté » évite de répondre aux questions de lieu ;
   - « Voir le tirage » montre quelle pièce se cache derrière chaque QR pour cette équipe ;
   - « Réinitialiser » efface la partie.

La caméra ne marche pas en ouvrant le fichier directement : il faut que le jeu soit en ligne (étape suivante). En attendant, on tape le numéro de porte.

## Mettre en ligne sur GitHub Pages (gratuit, une seule fois, ~10 min)

1. Crée un compte sur github.com.
2. En haut à droite : **+** → **New repository**. Nom : `dernier-diner`. Coche **Public**. **Create repository**.
3. Sur la page du dépôt : lien **uploading an existing file**. Glisse **tout le contenu** du dossier (les fichiers et les dossiers `js`, `css`, `lib`, `img`). **Commit changes**.
4. **Settings** → **Pages** → Source : **Deploy from a branch**, branche **main**, dossier **/ (root)** → **Save**.
5. Une ou deux minutes après, le jeu est à l'adresse `https://TON-PSEUDO.github.io/dernier-diner/`.
   Mode test : `https://TON-PSEUDO.github.io/dernier-diner/test.html`.

Pour une correction : refais l'étape 3 avec le fichier modifié (il remplace l'ancien).

Pour les joueurs : imprime un QR vers cette adresse sur la carte d'équipe. Ils le scannent avec l'appareil photo du téléphone, la page s'ouvre, c'est tout.
Sur Android comme sur iPhone, « Ajouter à l'écran d'accueil » transforme le jeu en icône d'appli (facultatif).

## Le jour J

- Chaque équipe reçoit une carte avec son **numéro** (1 à 28) : c'est lui qui tire la correspondance QR → pièce.
- Le **code de départ** (`DINER` par défaut, dans `donnees.js`) est donné à voix haute au départ de chaque vague : le chrono de l'équipe démarre à ce moment.
- La progression est gardée dans le téléphone : si la page se ferme, on la rouvre et on reprend.
- À la fin, l'équipe montre un code du type `T7-69-0-95-QEBW` : équipe 7, 69 points, 0 triche, accusation à la minute 95, puis une clé de contrôle.

## Règles de triche

- Deux QR **différents** scannés en moins de 45 s : −5 points et la triche est comptée (3e nombre du code de fin).
- À chaque passage sur un QR, une question sur le lieu réel (3 questions par lieu, en rotation). 3 erreurs : porte bloquée 60 s.
- Les réglages sont en haut de `donnees.js` (`antiTricheSecondes`, `penaliteTriche`, etc.).

## À remplir après le repérage (dans `donnees.js`)

Pour chaque emplacement : position sur le plan (`x`, `y` en %), les 3 questions de relevé et leurs réponses, le mot et le nombre du repère (énigmes de Léna et de la tour).

## Mise à jour (novembre) : règles, pénalités, pièges

- Onglet **Règles** dans l'app : déroulement, barème, fair-play (se met à jour tout seul avec les valeurs de `config`).
- **Pénalités** (dans `js/donnees.js`, bloc `config`) : mauvaise réponse à une énigme −1 (cadenas bloqué 30 s après 3 erreurs d'affilée), mort stupide −10, mauvais coupable −10, preuve qui ne prouve rien −3 par preuve, triche −5.
- **Pièges** : un par pièce, avec une phrase d'appât entre parenthèses. Images à déposer dans `img/morts/` : voir `LISTE-IMAGES-MORTS.md` (sans image, seul le texte s'affiche).
- Beaucoup de contenus ne se débloquent **qu'après le meurtre** (`si: { apres: 50 }`) pour donner de l'intérêt à la 2ᵉ visite.


## Départ et heures
- Chaque équipe démarre à l'ouverture de l'app (code de départ). Le chrono de 2 h court sur l'heure réelle du téléphone.
- Toutes les heures du récit (textes, documents) sont calculées sur l'heure de départ de l'équipe : minute 0 = « 20 h 00 » du récit, meurtre à la minute 50, arrondi à 5 min.
- `classement.html` : page organisateur, collez les codes finaux pour obtenir le classement (meilleur score par équipe, parties multiples signalées).
- `?test` active le panneau de test.
