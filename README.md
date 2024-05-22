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
