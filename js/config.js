// Configuration de l'application : URLs, vitesses, fonds de carte, styles.

export const API_BASE = 'https://api.ptm.huma-num.fr/cassinet';
export const MARTIN_BASE = 'https://api.ptm.huma-num.fr/martin';
export const ALTI_URL = 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json';
export const GEOCODE_URL = 'https://data.geopf.fr/geocodage/completion';

// Le coût `tempsmin` du réseau est exprimé en jours de voyage à cheval à 48 km/j :
// distance (km) = coût × 48, durée (j) = distance / vitesse choisie.
export const NETWORK_SPEED = 48;
export const DEFAULT_SPEEDS = { walk: 24, horse: 48 };
export const DEFAULT_CONSTRAINT_KM = 10;
export const DEFAULT_ISO = { max: 3, step: 1 };
export const MAX_ISOCHRONE_STEPS = 10;
// Nombre de points échantillonnés le long d'un itinéraire pour le profil altimétrique
export const ELEVATION_SAMPLES = 150;

export const INITIAL_VIEW = { center: [1.8, 46.9], zoom: 5 };

export const POINT_COLORS = {
  depart: '#16a34a',
  arrivee: '#dc2626',
  isochrone: '#2563eb',
  reporting: '#f59e0b',
};

export const ROUTE_COLORS = ['#1d4ed8', '#be185d', '#047857', '#7c3aed', '#c2410c', '#0e7490'];

// Du pas le plus court (foncé) au plus long (clair)
export const ISOCHRONE_RAMP = [
  '#08306b',
  '#08519c',
  '#2171b5',
  '#4292c6',
  '#6baed6',
  '#9ecae1',
  '#b9d6ea',
  '#c6dbef',
  '#d6e6f4',
  '#deebf7',
];

const ign = (layer, format = 'image/png', matrixSet = 'PM') =>
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&STYLE=normal' +
  `&TILEMATRIXSET=${matrixSet}&FORMAT=${format}&LAYER=${layer}` +
  '&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

const wms = (base, layer) =>
  `${base}SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=${layer}&STYLES=` +
  '&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true';

// Emprise des cartes historiques : évite de demander des tuiles hors couverture
const FRANCE_BOUNDS = [-5.8, 41.2, 10, 51.3];

// minzoom / maxzoom : niveaux de tuiles réellement disponibles (au-delà, MapLibre sur-zoome)
export const BASEMAPS = [
  {
    id: 'cassini-bnf',
    label: 'Carte de Cassini couleur (BnF)',
    tiles: [ign('BNF-IGNF_GEOGRAPHICALGRIDSYSTEMS.CASSINI', 'image/png', 'PM_6_14')],
    minzoom: 6,
    maxzoom: 14,
    bounds: FRANCE_BOUNDS,
    attribution: 'BnF / IGN-F / Géoplateforme',
  },
  {
    id: 'cassini-ehess',
    label: 'Carte de Cassini couleur (EHESS)',
    tiles: [wms('https://geohistoricaldata.org/geoserver/cassini-ehess/CASSINI/wms?', 'CASSINI')],
    bounds: FRANCE_BOUNDS,
    attribution: 'EHESS / GeoHistoricalData',
  },
  {
    id: 'cassini-nb',
    label: 'Carte de Cassini N&B',
    tiles: [wms('https://ms.sogefi-web.com/wms?', 'Carte_Cassini')],
    bounds: FRANCE_BOUNDS,
    attribution: 'EHESS / IGN / SOGEFI',
  },
  {
    id: 'capitaine',
    label: 'Carte de Capitaine',
    tiles: [wms('https://ms.sogefi-web.com/wms?', 'Carte_Capitaine')],
    bounds: FRANCE_BOUNDS,
    attribution: 'SOGEFI',
  },
  {
    id: 'etat-major',
    label: "Carte d'État-major",
    tiles: [ign('GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40', 'image/jpeg')],
    minzoom: 6,
    maxzoom: 15,
    bounds: FRANCE_BOUNDS,
    attribution: 'IGN-F / Géoplateforme',
  },
  {
    id: 'ign-plan',
    label: 'IGN Plan actuel',
    tiles: [ign('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2')],
    maxzoom: 19,
    attribution: 'IGN-F / Géoplateforme',
  },
  {
    id: 'ign-ortho',
    label: 'IGN Orthophotographie',
    tiles: [ign('ORTHOIMAGERY.ORTHOPHOTOS', 'image/jpeg')],
    maxzoom: 19,
    attribution: 'IGN-F / Géoplateforme',
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    maxzoom: 19,
    attribution: '© OpenStreetMap contributors',
  },
];
export const DEFAULT_BASEMAP = 'cassini-bnf';

export const OVERLAYS = [
  { id: 'reseau', label: 'Réseau Cassini', visible: false },
  { id: 'taches', label: 'Tâches urbaines', visible: false },
  { id: 'hillshade', label: 'Ombrage du relief', visible: false },
  { id: 'ay', label: "Voyage d'Arthur Young (1787)", visible: true },
];

// Relief : tuiles Terrarium (Mapzen / AWS Open Data)
export const TERRAIN_TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'];
export const TERRAIN_ATTRIBUTION =
  '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Terrain : Mapzen / AWS</a>';
export const DEFAULT_EXAGGERATION = 1.5;
