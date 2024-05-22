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

  Pour réaliser ces calculs, il suffit à l'utilisateur de se rendre sur un point de départ ou d'arrivée, de cliquer et de choisir :
  - bouton vert : point de départ pour le calcul d'un plus court chemin
  - boutn rouge : point d'arrivée pour le calcul d'un plus court chemin
  - bouton noir : zone de contrainte matérialisé sous la forme d'un cercle et dont le rayon peut-être défini dans les paramètres.
  - bouton bleu : point de départ d'un iscohrone, dont les bornes peuvent être saisie dans la partie gauche du menu.

# Paramètres

Le menu gauche présente différents paramètres :
- pour les plus courts chemins, une fois les points de départ et d'arrivée sélectionnés, il est possible de sélectionner une vitesse de déplacement (à pied ou à cheval). Par défaut, les vitesses sont paramétrées respectivement à 24 km/j et 48 km/j. Ces vitesses ne sont pas exactes et ne sont pas le reflet historique de toutes les voies du réseau, il s'agit d'un calcul moyen réalisé à partir des sources notre disposition, notamment l'Atlas de Révolution, vol 1.
  Sous le bouton calcul, il est possible de réaliser soit un nouveau calcul à chaque fois, soit de cumuler des calculs en conservant les plus courts chemins calculés précédemment.
- pour les isochrones, une fois le point de départ, un point bleu s'affiche sur la carte, il est alors possible de sélectionner des bornes (en j) des polygones isochrones qui seront créés avec le format suivant : 1, 2, 3, 4, 7, 10 par exemple.
  Sous le bouton calcul des isochrones, il est possible de réaliser soit un nouveau calcul à chaque fois, soit de cumuler des calculs en conservant les polygones isochrones calculés précédemment.
- le déploiement des paramètres permet de modifier les vitesses de circulation à pied ou à cheval ou encore de faire varier la taille du cercle de contrainte.

# Interactions avec la carte

Lorsqu'un calcul de plus court chemin est réalisé, une trace bleue d'affiche sur la carte et matérialiser le plus court chemin.

Attention, il arrive régulièrement que l'application ne renvoie rien, il peut s'agir d'un problème lié aux données. En effet, toutes les parties du réseau ne sont pas toujours routables.

En passant la souris ou en cliquant sur le chemin, une fenêtre de popup apparait et présente des informations relatives à la distance parcourue et au temps (relatif à la vitesse sélectionnée dans les paramètres).
De plus, l'interface présente également un graphique d'élévation calculé à partir des points prélevés le long du chemin.

En bas de la popup, il est possible d'exporter la trace du plus court chemin au format geojson afin de pouvoir l'exploiter dans un outil SIG (Qgis par exemple ;)

# Onglet analyses

La partie gauche de l'interface est déployable avec le boutin en bas à droite et permet de faire apparaitre de nouvelles informations relatives aux chemins et isochrones calculés.
Au démarrage, l'interface est vide.
Dès qu'un calcul (plus court chemin ou isochrone) est réalisé, des boites apparaissent alors et présente :
- pour les plus courts chemins : le nom du chemin, la distance et le temps ainsi que le grpahique d'élévation.
- pour les isochrones : les coordonnées lat/long du point de départ de l'isochrones ainsi qu'un graphique présentant 3 indicateurs sur les polygones à chacun des pas des isochrones : surface / périmètre / indice de circularité de Gravelius.

