# Images à générer : les morts stupides du château

**Format :** JPG, 16/9 (idéal 1360×784 comme les cinématiques d'origine ; 960×553 suffit), poids < 250 Ko si possible.
**Dossier :** `C:\Jeu-IA\Projets\Le-Dernier-Diner\img\morts\`
**Nom des fichiers :** exactement ceux ci-dessous (3 images par mort, `_1`, `_2`, `_3`). Tant qu'une image manque, l'app affiche simplement le texte de la scène : rien ne plante, on peut tester sans.

**Style commun** (à copier dans chaque prompt) : illustration de bande dessinée style 1900, gros traits d'encre noire, couleurs sombres et saturées (bleu-vert, bordeaux, ocre), ambiance « Enquête sur l'Orient-Express » ; le héros est un chef inspecteur en imperméable beige et chapeau mou, moustache ; personnage toujours le même ; aucun gore excessif ; pas de texte dans l'image.

**Déjà faites (images d'origine réutilisées) :** soupe (`f1_1-3`), corde de la remise (`f6_1-3`), chambre froide (`f7_1-3`).
Remarque : les 3 images de la soupe montrent encore un wagon-restaurant ; à refaire en salle à manger de château si tu veux la cohérence parfaite (garde les mêmes noms de fichiers).

## À créer : 7 morts, 21 images

### Se pencher au parapet de la tour de guet
- `m_parapet_1.jpg` : Plan large : le chef inspecteur (imperméable beige, chapeau mou) en haut d'une tour de pierre, de nuit, penché au parapet pour lire une inscription à la craie. Vallée et lumières au loin.
- `m_parapet_2.jpg` : Plan moyen : il est penché bien trop loin, les pieds décollent, le chapeau glisse de sa tête, l'air surpris.
- `m_parapet_3.jpg` : Plan de chute : le chef inspecteur étendu au pied de la tour, sur les graviers, chapeau à côté, mort (sans gore excessif, comme dans les morts d'origine).

### Finir le cognac abandonné (buvette de la vigne)
- `m_cognac_1.jpg` : L'inspecteur seul à la buvette (piano fermé, tabourets vides) regarde un verre de cognac à moitié bu avec envie.
- `m_cognac_2.jpg` : Gros plan : il boit le verre cul sec, les yeux écarquillés, la fumée d'un cigarillo au premier plan.
- `m_cognac_3.jpg` : L'inspecteur effondré sur le comptoir, le verre renversé, chapeau tombé, une fiole discrète près du verre.

### Tirer sur le gros livre rouge (bibliothèque)
- `m_livre_1.jpg` : L'inspecteur devant une haute bibliothèque, un gros livre rouge dépasse d'une étagère ; il le saisit, l'air malin.
- `m_livre_2.jpg` : La bibliothèque entière penche vers lui, livres en cascade, l'inspecteur lève les bras, paniqué.
- `m_livre_3.jpg` : L'inspecteur enseveli sous une montagne de livres, seule une main et le chapeau dépassent.

### Tirer le cordon de sonnette (chambre d'Odile)
- `m_cordon_1.jpg` : L'apprenti inspecteur dans une chambre bourgeoise, la main sur un long cordon de velours près du lit ; au plafond, un grand lustre de cristal.
- `m_cordon_2.jpg` : Il lève la tête, le lustre se décroche, les chaînes cèdent, étincelles de cristal.
- `m_cordon_3.jpg` : Le lustre au sol, en morceaux ; seule une main et le chapeau dépassent.

### Jeter une bûche dans la cheminée (loge d'Irène)
- `m_buche_1.jpg` : L'inspecteur devant la cheminée de la loge d'Irène (miroirs, plumes), une bûche à la main, souriant.
- `m_buche_2.jpg` : La bûche dans le foyer ; le conduit éclate de lumière, étincelles colorées, l'inspecteur recule.
- `m_buche_3.jpg` : L'inspecteur noirci, cheveux dressés, chapeau fumant, sur le dos, feux d'artifice qui éclatent dans la cheminée.

### Forcer le tiroir verrouillé (bureau de Hallier)
- `m_tiroir_1.jpg` : L'inspecteur au bureau de Hallier (désordre, coffre-fort au fond) s'acharne sur un tiroir verrouillé avec un coupe-papier.
- `m_tiroir_2.jpg` : Gros plan : le tiroir s'ouvre, un vieux pistolet monté en piège pointe vers lui, ressort tendu.
- `m_tiroir_3.jpg` : L'inspecteur au sol derrière le bureau, chapeau percé, le tiroir ouvert avec le pistolet fumant.

### Se coucher sur le lit défait (chambre d'amis)
- `m_lit_1.jpg` : L'inspecteur dans la chambre du chef (lit défait, manteau à l'armoire, valise) regarde le lit avec envie, bâille.
- `m_lit_2.jpg` : Il est allongé, paupières lourdes, une boîte de chloral presque vide visible sur la table de nuit.
- `m_lit_3.jpg` : L'inspecteur endormi profondément, un « Z » ou un halo de lune à la fenêtre, un drap qui le recouvre jusqu'au menton comme un gisant.

## Prompt type
« Illustration de bande dessinée style 1900, gros traits d'encre, couleurs sombres saturées. Un chef inspecteur moustachu en imperméable beige et chapeau mou. [description de la scène]. Format 16/9, sans texte. »


## Décors à générer (960×553, 16:9, même style ligne claire que les autres, murs vert-bleu sombre, lampes chaudes)
- `img/decors/loge_irene.jpg` — R7 : loge de théâtre/cabaret, miroirs entourés d'ampoules, plumes, parfum lourd, gants longs sur une chaise, papiers brûlés dans la cheminée. Aucun personnage.
- `img/decors/tour_guet.jpg` — R8 : sommet d'une tour de guet, vent, lanterne à volets colorés sur le parapet tournée vers l'autre rive, registre accroché avec un cadenas, vallée et nuit au fond. Aucun personnage.
- `img/decors/bureau_hallier_avant.jpg` — R9 avant le meurtre : bureau rangé, cuir et tabac froid, coffre-fort dans un coin, corbeille. (`bureau.jpg`, le bureau saccagé, reste pour l'après.)
- `img/decors/chambre_amis_couloir.jpg` — R10 avant le meurtre : couloir étroit, porte fermée à clé, Pichon (majordome moustachu en uniforme) montant la garde. (`chambre_amis.jpg` reste pour l'après.)
