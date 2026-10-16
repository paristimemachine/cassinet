# L'application Cassinet

L'application est disponible à l'adresse : https://app.ptm.huma-num.fr/cassinet/
Elle permet de réaliser des calculs de plus courts chemins et d'isochrones sur les données du réseau viaire issu des cartes de Cassini.

Le travail de géoréférencement des cartes de Cassini a été réalisé dans les années 2000 par le LaDéHis (Laboratoire de Démographie Historique) de l'EHESS.
Sur cette base, il a été possible entre les années 2013 & 2014 de réaliser une saisie des voies de Cassini.

# Les données

L'application Cassini se base sur la saisie qui a été faite lors d'une expérience de saisie collaborative dans le cadre du projet GeoHistoricalData et décrite à cette adresse et dont la publication est visible à cette adresse :
https://www.nature.com/articles/sdata201548
Les données initiales ont été reprise pour former un réseau topologiquement routable, c'est-à-dire transformable en un objet mathématique de type graphe sur lequel il est possible de réaliser des calculs de plus courts chemins.
Ces données exploitées dans Cassinet sont celles disponibles sur le github de Julien Perret : https://github.com/julienperret/cassini-topology

Une autre donnée exploitée est celle de l'altimétrie IGN disponible via l'API :
https://geoservices.ign.fr/documentation/services/services-deprecies/calcul-altimetrique-rest
Attention, cette API est dépréciée, elle pourrait donc disparaitre à tout moment.

# Utilisation

L'application Cassinet permet de réaliser plusieurs choses :
- calcul de plus court chemin,
- calcul de plus court chemin avec une contrainte, c'est-à-dire une zone à éviter,
- calcul d'isochrones.

Un clic sur la carte ouvre une fenêtre indiquant la tâche urbaine la plus proche et propose de définir le point comme :
- **Départ** (vert) ou **Arrivée** (rouge) d'un itinéraire,
- **Isochrone** (bleu) : centre des isochrones,
- **Zone à éviter** (noir) : cercle dont le rayon se règle dans les paramètres.

Le champ de recherche (en haut du menu) permet aussi de trouver un lieu par son nom (géocodeur de la Géoplateforme IGN).

# Paramètres

Le menu gauche présente :
- le **mode de déplacement** (à pied / à cheval), utilisé pour les durées et les isochrones. Par défaut, les vitesses sont de 24 km/j et 48 km/j. Ces vitesses ne sont pas exactes et ne reflètent pas la réalité historique de toutes les voies du réseau : il s'agit d'une moyenne établie à partir des sources à notre disposition, notamment l'Atlas de la Révolution, vol. 1 ;
- l'onglet **Itinéraire** : départ, arrivée, zone à éviter éventuelle. Sous le bouton de calcul, on choisit de remplacer le résultat précédent (*Nouveau*) ou de le conserver (*Cumuler*) ;
- l'onglet **Isochrones** : centre, durée maximale (curseur, en jours) et pas (½, 1, 2, 3 ou 5 jours), dans la limite de 10 isochrones par calcul ;
- l'onglet **Paramètres** : vitesses, rayon de la zone à éviter, exagération du relief 3D.

# Carte

Le bouton « couches » en haut à droite permet de choisir le fond de carte (Cassini BnF, EHESS, N&B, Capitaine, État-major, IGN, OpenStreetMap) et d'afficher le réseau Cassini, les tâches urbaines, l'ombrage du relief et le voyage d'Arthur Young (1787).

Le bouton **3D** active le relief (tuiles d'altitude Terrarium, Mapzen / AWS) : la carte s'incline, les itinéraires et isochrones épousent le terrain. Clic droit + glisser (ou Ctrl + glisser) pour faire pivoter et incliner la vue.

Un clic sur un itinéraire affiche sa distance, sa durée à pied et à cheval, et permet de :
- télécharger le chemin au format GeoJSON (pour Qgis par exemple ;),
- copier l'URL de l'API qui a produit le calcul,
- copier le **lien de partage** de l'application.

L'adresse de la page reflète en permanence l'état de l'application (points, mode, fond de carte, 3D, vue) : la copier ou l'envoyer suffit pour partager un calcul, qui est relancé à l'ouverture du lien.

Attention, il arrive que le calcul ne renvoie rien, il peut s'agir d'un problème lié aux données : toutes les parties du réseau ne sont pas routables.

# Panneau Analyses

Le panneau de droite (bouton *Analyses*) s'ouvre à chaque calcul et présente une fiche par résultat :
- pour les plus courts chemins : distance, durées à pied et à cheval, dénivelé et profil altimétrique (altimétrie IGN). Survoler le profil montre la position correspondante sur la carte ;
- pour les isochrones : pour chaque pas, surface, périmètre et indice de circularité (4πA/P², égal à 1 pour un disque).

Chaque fiche permet de recentrer la carte sur le résultat ou de le supprimer.

# Signalement

Les données historiques étant issus de sources qui sont interprétés par des opérateurs de saisie ne sont pas parfaites. Il arrive régulièrement qu'une interrogation sur un calcul de plus court chemin ne donne rien.
IL est alors possible, si toutefois cela provient d'un problème relatif au réseau (composante connexe, segment manquants, problème de topologie, etc.) de signaler cette erreur.
Cette option est possible en cliquant sur la carte puis sur « Signaler un problème ici », qui ouvre une fenêtre à compléter : nom, prénom, mail institution, descriptif. Le signament est alors fait au point cliqué sur la carte.
Nous prendrons alors les mesures nécessaires pour réaliser des corrections sur la base afin que celle-ci soit enrichie peu à peu des contributions des utilisateurs menant alors à un nouveau dépôt du réseau viaire des Cartes de Cassini.

# Développement

Le front est en JavaScript « vanilla » (modules ES natifs, sans bundler) :
- [MapLibre GL JS](https://maplibre.org/) pour la carte, d3 pour les graphiques, Turf pour les calculs géométriques, PapaParse pour le CSV d'Arthur Young, chargés depuis jsDelivr (versions figées, avec empreintes SRI) ;
- [Tailwind CSS v4](https://tailwindcss.com/) compilé en CSS statique : la page n'a besoin d'aucune étape de build au déploiement, mais `css/style.css` doit être régénéré après modification des classes.

```
index.html          page et gabarit
css/app.css         source Tailwind (composants, surcharges MapLibre)
css/style.css       CSS compilé — ne pas éditer à la main
js/main.js          point d'entrée
js/config.js        URLs, vitesses, fonds de carte, couleurs
js/map.js           carte, couches, relief 3D, contrôles
js/points.js        choix des points, popup de la carte, recherche
js/route.js         itinéraires et profil altimétrique
js/isochrone.js     isochrones et légende
js/analysis.js      fiches du panneau Analyses
js/share.js         état dans l'URL (lien de partage)
js/ay.js            voyage d'Arthur Young
```

Commandes :

```bash
npm install              # outils de développement (ESLint, Prettier)
npm run setup:tailwind   # télécharge le binaire Tailwind CLI dans bin/
npm run watch:css        # recompile css/style.css en continu
npm run serve            # serveur local sur http://localhost:8080
npm run lint && npm run format
```

Le dossier `data/` (CSV et illustrations d'Arthur Young, chemins exemples) n'est pas versionné.
