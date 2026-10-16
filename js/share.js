// État de l'application dans l'URL : lien de partage, restauration à l'ouverture.
//   ?from=lng,lat&to=lng,lat&avoid=lng,lat,km&iso=lng,lat&isomax=3&isostep=1
//   &mode=horse&vp=24&vc=48&base=cassini-bnf&layers=reseau,ay&3d=1&ex=1.5
//   &map=zoom/lat/lng/bearing/pitch
import { state } from './state.js';
import { map } from './map.js';
import { BASEMAPS, OVERLAYS, DEFAULT_SPEEDS, MAX_ISOCHRONE_STEPS } from './config.js';

const ll = ([lng, lat]) => `${lng.toFixed(5)},${lat.toFixed(5)}`;

function parseLngLat(value) {
  const [lng, lat] = (value ?? '').split(',').map(Number);
  return Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90 ? [lng, lat] : null;
}

const positive = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function buildShareUrl() {
  const p = new URLSearchParams();
  if (state.depart) p.set('from', ll(state.depart.lngLat));
  if (state.arrivee) p.set('to', ll(state.arrivee.lngLat));
  if (state.constraint) p.set('avoid', `${ll(state.constraint.lngLat)},${state.constraint.radiusKm}`);
  if (state.isochrone) {
    p.set('iso', ll(state.isochrone.lngLat));
    p.set('isomax', state.iso.max);
    p.set('isostep', state.iso.step);
  }
  p.set('mode', state.mode);
  if (state.speeds.walk !== DEFAULT_SPEEDS.walk) p.set('vp', state.speeds.walk);
  if (state.speeds.horse !== DEFAULT_SPEEDS.horse) p.set('vc', state.speeds.horse);
  p.set('base', state.basemap);
  p.set('layers', [...state.overlays].join(','));
  if (state.terrain) {
    p.set('3d', '1');
    p.set('ex', state.exaggeration);
  }
  if (map) {
    const c = map.getCenter();
    p.set(
      'map',
      [
        map.getZoom().toFixed(2),
        c.lat.toFixed(4),
        c.lng.toFixed(4),
        Math.round(map.getBearing()),
        Math.round(map.getPitch()),
      ].join('/'),
    );
  }
  return `${location.origin}${location.pathname}?${p.toString().replaceAll('%2C', ',').replaceAll('%2F', '/')}`;
}

export function syncUrl() {
  history.replaceState(null, '', buildShareUrl());
}

// Lit l'URL, applique les réglages à `state` et renvoie ce qui doit être
// restauré après le chargement de la carte (points, caméra).
export function readShareParams() {
  const p = new URLSearchParams(location.search);

  if (['walk', 'horse'].includes(p.get('mode'))) state.mode = p.get('mode');
  state.speeds.walk = positive(p.get('vp')) ?? state.speeds.walk;
  state.speeds.horse = positive(p.get('vc')) ?? state.speeds.horse;
  if (BASEMAPS.some((b) => b.id === p.get('base'))) state.basemap = p.get('base');
  if (p.has('layers')) {
    const known = new Set(OVERLAYS.map((o) => o.id));
    state.overlays = new Set(
      p
        .get('layers')
        .split(',')
        .filter((id) => known.has(id)),
    );
  }
  state.terrain = p.get('3d') === '1';
  const ex = positive(p.get('ex'));
  if (ex && ex <= 5) state.exaggeration = ex;

  const isoMax = positive(p.get('isomax'));
  const isoStep = positive(p.get('isostep'));
  if (isoMax && isoMax <= 30) state.iso.max = isoMax;
  if (isoStep && isoStep <= state.iso.max) state.iso.step = Math.max(isoStep, state.iso.max / MAX_ISOCHRONE_STEPS);

  const avoid = (p.get('avoid') ?? '').split(',');
  const avoidLngLat = parseLngLat(avoid.slice(0, 2).join(','));
  const avoidKm = positive(avoid[2]);

  let camera = null;
  const [zoom, lat, lng, bearing, pitch] = (p.get('map') ?? '').split('/').map(Number);
  if ([zoom, lat, lng].every(Number.isFinite)) {
    camera = { zoom, center: [lng, lat], bearing: bearing || 0, pitch: pitch || 0 };
  }

  return {
    depart: parseLngLat(p.get('from')),
    arrivee: parseLngLat(p.get('to')),
    isochrone: parseLngLat(p.get('iso')),
    constraint: avoidLngLat && avoidKm ? { lngLat: avoidLngLat, radiusKm: avoidKm } : null,
    camera,
  };
}
