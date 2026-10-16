import { DEFAULT_SPEEDS, DEFAULT_CONSTRAINT_KM, DEFAULT_ISO, DEFAULT_BASEMAP, DEFAULT_EXAGGERATION, OVERLAYS } from './config.js';

// État partagé de l'application. Les modules le lisent et le modifient
// directement, puis appellent syncUrl() (share.js) si l'état partageable change.
export const state = {
  mode: 'horse', // 'walk' | 'horse'
  speeds: { ...DEFAULT_SPEEDS },
  constraintKm: DEFAULT_CONSTRAINT_KM,
  iso: { ...DEFAULT_ISO },
  exaggeration: DEFAULT_EXAGGERATION,

  // Points choisis : { lngLat: [lng, lat], name }
  depart: null,
  arrivee: null,
  isochrone: null,
  // Zone à éviter : { lngLat: [lng, lat], radiusKm }
  constraint: null,

  basemap: DEFAULT_BASEMAP,
  overlays: new Set(OVERLAYS.filter((o) => o.visible).map((o) => o.id)),
  terrain: false,

  routes: [], // itinéraires affichés (route.js)
  isochroneSets: [], // jeux d'isochrones affichés (isochrone.js)
};

export const currentSpeed = () => state.speeds[state.mode];
