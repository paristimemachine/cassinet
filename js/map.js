// Carte MapLibre : style (fonds, relief, couches), contrôles, marqueurs.
import { BASEMAPS, OVERLAYS, MARTIN_BASE, TERRAIN_TILES, TERRAIN_ATTRIBUTION, INITIAL_VIEW, POINT_COLORS } from './config.js';
import { state } from './state.js';
import { el } from './utils.js';

export let map;

export const EMPTY = { type: 'FeatureCollection', features: [] };

const OVERLAY_LAYERS = {
  reseau: ['reseau'],
  taches: ['taches'],
  hillshade: ['hillshade'],
  ay: ['ay-line', 'ay-steps'],
};

const visibility = (on) => (on ? 'visible' : 'none');
const geojson = () => ({ type: 'geojson', data: EMPTY });

// Notifie main.js qu'un élément partageable de l'état a changé (cf. share.js)
export const notifyChange = () => document.dispatchEvent(new CustomEvent('cassinet:change'));

function buildStyle() {
  const sources = {};
  // Blanc : se raccorde aux marges blanches des tuiles de la carte de Cassini (BnF)
  const layers = [{ id: 'background', type: 'background', paint: { 'background-color': '#ffffff' } }];

  for (const b of BASEMAPS) {
    sources[`base-${b.id}`] = {
      type: 'raster',
      tiles: b.tiles,
      tileSize: 256,
      minzoom: b.minzoom ?? 0,
      maxzoom: b.maxzoom ?? 18,
      bounds: b.bounds,
      attribution: b.attribution,
    };
    layers.push({
      id: `base-${b.id}`,
      type: 'raster',
      source: `base-${b.id}`,
      layout: { visibility: visibility(b.id === state.basemap) },
    });
  }

  // Deux sources distinctes pour le relief 3D et l'ombrage (recommandé par MapLibre)
  const dem = { type: 'raster-dem', tiles: TERRAIN_TILES, encoding: 'terrarium', tileSize: 256, maxzoom: 15 };
  sources.terrain = { ...dem, attribution: TERRAIN_ATTRIBUTION };
  sources.hillshade = dem;

  sources.reseau = {
    type: 'vector',
    tiles: [`${MARTIN_BASE}/france_cassini_edge/{z}/{x}/{y}`],
    maxzoom: 14,
    attribution: 'Réseau : EHESS / LaDéHis / GeoHistoricalData',
  };
  sources.taches = { type: 'vector', tiles: [`${MARTIN_BASE}/taches_urbaines/{z}/{x}/{y}`], maxzoom: 14 };
  for (const id of ['isochrones', 'constraint', 'routes', 'hover', 'ay-line', 'ay-steps', 'anim']) {
    sources[id] = geojson();
  }

  const overlay = (id) => ({ visibility: visibility(state.overlays.has(id)) });

  layers.push(
    {
      id: 'hillshade',
      type: 'hillshade',
      source: 'hillshade',
      layout: overlay('hillshade'),
      paint: { 'hillshade-exaggeration': 0.35, 'hillshade-shadow-color': '#3d3226' },
    },
    {
      id: 'reseau',
      type: 'line',
      source: 'reseau',
      'source-layer': 'france_cassini_edge',
      layout: overlay('reseau'),
      paint: {
        'line-color': ['match', ['get', 'road_type'], 'rouge', '#bb2211', '#111111'],
        'line-opacity': 0.6,
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 12, 2],
      },
    },
    {
      id: 'taches',
      type: 'fill',
      source: 'taches',
      'source-layer': 'taches_urbaines',
      layout: overlay('taches'),
      paint: { 'fill-color': '#ee0000', 'fill-opacity': 0.6 },
    },
    {
      id: 'iso-fill',
      type: 'fill',
      source: 'isochrones',
      // Les pas les plus courts sont dessinés au-dessus
      layout: { 'fill-sort-key': ['*', -1, ['get', 'step']] },
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.35 },
    },
    {
      id: 'iso-line',
      type: 'line',
      source: 'isochrones',
      paint: { 'line-color': ['get', 'color'], 'line-width': 1.2 },
    },
    {
      id: 'constraint-fill',
      type: 'fill',
      source: 'constraint',
      paint: { 'fill-color': '#000000', 'fill-opacity': 0.15 },
    },
    {
      id: 'constraint-line',
      type: 'line',
      source: 'constraint',
      paint: { 'line-color': '#000000', 'line-width': 1.5, 'line-dasharray': [3, 2] },
    },
    {
      id: 'ay-line',
      type: 'line',
      source: 'ay-line',
      layout: overlay('ay'),
      paint: { 'line-color': '#333333', 'line-width': 2, 'line-opacity': 0.8, 'line-dasharray': [2, 2] },
    },
    {
      id: 'ay-steps',
      type: 'circle',
      source: 'ay-steps',
      layout: overlay('ay'),
      paint: { 'circle-radius': 4, 'circle-color': '#c83232', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1 },
    },
    {
      id: 'anim-line',
      type: 'line',
      source: 'anim',
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-opacity': 0.7, 'line-dasharray': [1, 2] },
    },
    {
      id: 'route-casing',
      type: 'line',
      source: 'routes',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.85 },
    },
    {
      id: 'route-line',
      type: 'line',
      source: 'routes',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': ['get', 'color'], 'line-width': 3.5 },
    },
    {
      id: 'hover',
      type: 'circle',
      source: 'hover',
      paint: { 'circle-radius': 6, 'circle-color': '#ffffff', 'circle-stroke-color': '#1d4ed8', 'circle-stroke-width': 3 },
    },
  );

  return {
    version: 8,
    sources,
    layers,
    sky: {
      'sky-color': '#a9c6e3',
      'horizon-color': '#efe9dc',
      'fog-color': '#efe9dc',
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.7,
      'fog-ground-blend': 0.85,
    },
  };
}

export function createMap(camera) {
  map = new maplibregl.Map({
    container: 'map',
    style: buildStyle(),
    center: camera?.center ?? INITIAL_VIEW.center,
    zoom: camera?.zoom ?? INITIAL_VIEW.zoom,
    bearing: camera?.bearing ?? 0,
    pitch: camera?.pitch ?? 0,
    maxPitch: 80,
    attributionControl: { compact: true },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new TerrainToggle(), 'top-right');
  map.addControl(new LayerControl(), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

  return new Promise((resolve) =>
    map.once('load', () => {
      // Sans vue explicite dans le lien, on incline la carte pour montrer le relief
      if (state.terrain) setTerrain(true, { animate: !camera });
      resolve(map);
    }),
  );
}

// ---------------------------------------------------------------------------
// Fonds, couches, relief
// ---------------------------------------------------------------------------

export function setBasemap(id) {
  state.basemap = id;
  for (const b of BASEMAPS) map.setLayoutProperty(`base-${b.id}`, 'visibility', visibility(b.id === id));
  syncControls();
  notifyChange();
}

export function setOverlay(id, on) {
  if (on) state.overlays.add(id);
  else state.overlays.delete(id);
  for (const layer of OVERLAY_LAYERS[id]) map.setLayoutProperty(layer, 'visibility', visibility(on));
  document.dispatchEvent(new CustomEvent('cassinet:overlay', { detail: { id, on } }));
  syncControls();
}

export function setTerrain(on, { animate = true } = {}) {
  state.terrain = on;
  map.setTerrain(on ? { source: 'terrain', exaggeration: state.exaggeration } : null);
  if (animate) {
    if (on && map.getPitch() < 30) map.easeTo({ pitch: 60, duration: 1200 });
    if (!on) map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
  }
  syncControls();
  notifyChange();
}

export function setExaggeration(value) {
  state.exaggeration = value;
  if (state.terrain) map.setTerrain({ source: 'terrain', exaggeration: value });
}

export const setData = (sourceId, data) => map.getSource(sourceId)?.setData(data ?? EMPTY);

export function fitTo(geojsonData) {
  const [w, s, e, n] = turf.bbox(geojsonData);
  // Le panneau d'analyse vient peut-être de s'ouvrir et de réduire la carte
  map.resize();
  map.fitBounds(
    [
      [w, s],
      [e, n],
    ],
    { padding: 60, maxZoom: 13, duration: 900 },
  );
}

// ---------------------------------------------------------------------------
// Marqueurs (départ, arrivée, centre d'isochrone, signalement) et zone à éviter
// ---------------------------------------------------------------------------

const MARKER_LABELS = { depart: 'Départ', arrivee: 'Arrivée', isochrone: "Centre de l'isochrone", reporting: 'Signalement' };
const markers = {};

export function placeMarker(type, lngLat) {
  if (!markers[type]) {
    const element = el('div', {
      class: 'map-marker',
      style: `--marker-color: ${POINT_COLORS[type]}`,
      title: MARKER_LABELS[type],
      role: 'img',
      'aria-label': MARKER_LABELS[type],
    });
    markers[type] = new maplibregl.Marker({ element });
  }
  markers[type].setLngLat(lngLat).addTo(map);
}

export function removeMarker(type) {
  markers[type]?.remove();
}

export function showConstraint(constraint) {
  setData('constraint', constraint && turf.circle(constraint.lngLat, constraint.radiusKm, { steps: 96, units: 'kilometers' }));
}

// ---------------------------------------------------------------------------
// Contrôles
// ---------------------------------------------------------------------------

const controlSyncs = new Set();
const syncControls = () => controlSyncs.forEach((sync) => sync());

const LAYERS_ICON =
  '<svg class="size-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"/></svg>';

class TerrainToggle {
  onAdd() {
    this.button = el(
      'button',
      {
        type: 'button',
        class: 'terrain-toggle',
        title: 'Relief 3D',
        'aria-label': 'Relief 3D',
        onclick: () => setTerrain(!state.terrain),
      },
      '3D',
    );
    this.sync = () => this.button.setAttribute('aria-pressed', state.terrain);
    controlSyncs.add(this.sync);
    this.sync();
    this.container = el('div', { class: 'maplibregl-ctrl maplibregl-ctrl-group' }, this.button);
    return this.container;
  }

  onRemove() {
    controlSyncs.delete(this.sync);
    this.container.remove();
  }
}

class LayerControl {
  onAdd() {
    const panel = el('div', { class: 'layer-panel', id: 'layerPanel', hidden: true });

    const baseInputs = BASEMAPS.map((b) =>
      el('input', { type: 'radio', name: 'basemap', value: b.id, onchange: () => setBasemap(b.id) }),
    );
    const overlayInputs = OVERLAYS.map((o) =>
      el('input', { type: 'checkbox', value: o.id, onchange: (e) => setOverlay(o.id, e.target.checked) }),
    );
    const terrainInput = el('input', { type: 'checkbox', onchange: (e) => setTerrain(e.target.checked) });

    panel.append(
      el(
        'fieldset',
        {},
        el('legend', {}, 'Fond de carte'),
        BASEMAPS.map((b, i) => el('label', { class: 'layer-option' }, baseInputs[i], b.label)),
      ),
      el(
        'fieldset',
        {},
        el('legend', {}, 'Couches'),
        OVERLAYS.map((o, i) => el('label', { class: 'layer-option' }, overlayInputs[i], o.label)),
        el('label', { class: 'layer-option' }, terrainInput, 'Relief 3D'),
      ),
    );

    this.sync = () => {
      baseInputs.forEach((input) => {
        input.checked = input.value === state.basemap;
      });
      overlayInputs.forEach((input) => {
        input.checked = state.overlays.has(input.value);
      });
      terrainInput.checked = state.terrain;
    };
    controlSyncs.add(this.sync);
    this.sync();

    const button = el('button', {
      type: 'button',
      title: 'Fonds et couches',
      'aria-label': 'Fonds de carte et couches',
      'aria-expanded': 'false',
      'aria-controls': 'layerPanel',
      html: LAYERS_ICON,
    });
    const setOpen = (open) => {
      panel.hidden = !open;
      button.setAttribute('aria-expanded', open);
    };
    button.addEventListener('click', () => setOpen(panel.hidden));
    this.onDocClick = (e) => !this.container.contains(e.target) && setOpen(false);
    document.addEventListener('click', this.onDocClick);
    this.onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', this.onKey);

    this.container = el('div', { class: 'maplibregl-ctrl maplibregl-ctrl-group layer-control' }, button, panel);
    return this.container;
  }

  onRemove() {
    controlSyncs.delete(this.sync);
    document.removeEventListener('click', this.onDocClick);
    document.removeEventListener('keydown', this.onKey);
    this.container.remove();
  }
}
