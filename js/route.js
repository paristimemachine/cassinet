// Calcul et affichage des itinéraires, profil altimétrique.
import { state } from './state.js';
import { routeApiUrl, fetchRoute, fetchElevations } from './api.js';
import { map, setData, fitTo } from './map.js';
import { NETWORK_SPEED, ROUTE_COLORS, ELEVATION_SAMPLES } from './config.js';
import { toast, withBusy } from './ui.js';
import { addRouteCard } from './analysis.js';
import { buildShareUrl } from './share.js';
import { openReport } from './report.js';
import { el, fmt, flatCoords, downloadJson } from './utils.js';

let routeSeq = 0;

const featureOf = (route) => ({
  type: 'Feature',
  properties: { id: route.id, color: route.color },
  geometry: { type: 'LineString', coordinates: route.line },
});

const renderRoutes = () => setData('routes', { type: 'FeatureCollection', features: state.routes.map(featureOf) });

export async function computeRoute(button, { fit = true } = {}) {
  const { depart, arrivee, constraint } = state;
  if (!depart || !arrivee) {
    toast('Choisissez un départ et une arrivée en cliquant sur la carte.', 'warn');
    return;
  }
  const cumulative = document.getElementById('routeCumul').checked;
  const url = routeApiUrl(depart.lngLat, arrivee.lngLat, constraint);

  await withBusy(button, async () => {
    let data;
    try {
      data = await fetchRoute(url);
    } catch (error) {
      toast(`Calcul impossible : ${error.message}`, 'error');
      return;
    }
    if (!data?.features?.length) {
      toast("Aucun itinéraire trouvé entre ces deux points. Il peut s'agir d'un problème dans le réseau.", 'warn', {
        duration: 10000,
        action: { label: 'Signaler', onClick: () => openReport(depart.lngLat) },
      });
      return;
    }

    if (!cumulative) clearRoutes();
    const id = ++routeSeq;
    const route = {
      id,
      color: ROUTE_COLORS[(id - 1) % ROUTE_COLORS.length],
      name: `${depart.name || 'Départ'} → ${arrivee.name || 'Arrivée'}`,
      constrained: Boolean(constraint),
      data,
      apiUrl: url,
      shareUrl: buildShareUrl(),
      line: orderedLine(data.features),
      distanceKm: data.temps_total * NETWORK_SPEED,
      profile: undefined, // undefined : en cours, null : indisponible
    };
    state.routes.push(route);
    renderRoutes();
    // La fiche d'abord : le panneau d'analyse s'ouvre et le cadrage en tient compte
    route.card = addRouteCard(route, {
      actions: routeActions(route),
      onZoom: () => fitTo(featureOf(route)),
      onRemove: () => removeRoute(id),
    });
    if (fit) fitTo(featureOf(route));
    loadProfile(route);
  });
}

async function loadProfile(route) {
  try {
    route.profile = await elevationProfile(route.line);
  } catch {
    route.profile = null;
  }
  route.card.setProfile(route.profile);
}

export function removeRoute(id) {
  const index = state.routes.findIndex((r) => r.id === id);
  if (index < 0) return;
  state.routes[index].card.remove();
  state.routes.splice(index, 1);
  renderRoutes();
}

export function clearRoutes() {
  for (const route of state.routes) route.card.remove();
  state.routes = [];
  renderRoutes();
}

export const travelDays = (route, mode) => route.distanceKm / state.speeds[mode];

// Les tronçons renvoyés par l'API sont ordonnés (seq) mais pas forcément orientés
// dans le sens du parcours : on les retourne au besoin pour obtenir une ligne continue.
export function orderedLine(features) {
  const parts = features.map((f) => flatCoords(f.geometry));
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const line = [];
  parts.forEach((coords, i) => {
    let part = coords;
    if (i === 0 && parts.length > 1) {
      const next = parts[1];
      const nearEnd = Math.min(d2(part.at(-1), next[0]), d2(part.at(-1), next.at(-1)));
      const nearStart = Math.min(d2(part[0], next[0]), d2(part[0], next.at(-1)));
      if (nearStart < nearEnd) part = [...part].reverse();
    } else if (i > 0 && d2(line.at(-1), part.at(-1)) < d2(line.at(-1), part[0])) {
      part = [...part].reverse();
    }
    line.push(...part);
  });
  return line;
}

// Échantillonne la ligne à intervalle régulier et interroge l'altimétrie IGN
async function elevationProfile(line) {
  const lineString = turf.lineString(line);
  const total = turf.length(lineString, { units: 'kilometers' });
  const n = Math.max(2, Math.min(ELEVATION_SAMPLES, Math.ceil(total / 0.2)));
  const samples = Array.from({ length: n }, (_, i) => {
    const distance = (total * i) / (n - 1);
    return { distance, coords: turf.along(lineString, distance, { units: 'kilometers' }).geometry.coordinates };
  });
  const z = await fetchElevations(samples.map((s) => s.coords));
  const points = samples.map((s, i) => ({ distance: s.distance, lngLat: s.coords, z: z[i] })).filter((p) => p.z > -1000); // -99999 : pas de donnée
  if (points.length < 2) return null;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].z - points[i - 1].z;
    if (delta > 0) gain += delta;
    else loss -= delta;
  }
  return { points, gain, loss };
}

// ---------------------------------------------------------------------------
// Actions et popup sur un itinéraire
// ---------------------------------------------------------------------------

async function copy(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message, 'success', { duration: 2500 });
  } catch {
    toast('Copie impossible dans ce navigateur.', 'error');
  }
}

function routeActions(route) {
  const filename = `Cassinet ${route.name.replace(/[\\/:*?"<>|→]/g, '-')}.geojson`;
  return el(
    'div',
    { class: 'flex flex-wrap gap-1.5' },
    el('button', { type: 'button', class: 'btn-chip', onclick: () => downloadJson(route.data, filename) }, 'GeoJSON'),
    el('button', { type: 'button', class: 'btn-chip', onclick: () => copy(route.apiUrl, "URL de l'API copiée") }, "Copier l'URL"),
    el(
      'button',
      { type: 'button', class: 'btn-chip', onclick: () => copy(route.shareUrl, 'Lien de partage copié') },
      'Lien de partage',
    ),
  );
}

function routePopup(route) {
  return el(
    'div',
    { class: 'space-y-2' },
    el('p', { class: 'font-semibold' }, route.name, route.constrained ? ' (avec zone à éviter)' : ''),
    el(
      'p',
      { class: 'text-sm tabular-nums' },
      `${fmt(route.distanceKm, 1)} km · à cheval ${fmt(travelDays(route, 'horse'), 1)} j · à pied ${fmt(travelDays(route, 'walk'), 1)} j`,
    ),
    routeActions(route),
  );
}

export function initRouteInteractions() {
  map.on('mouseenter', 'route-line', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'route-line', () => {
    map.getCanvas().style.cursor = '';
  });
  map.on('click', 'route-line', (e) => {
    const route = state.routes.find((r) => r.id === e.features[0].properties.id);
    if (!route) return;
    new maplibregl.Popup({ className: 'cn-popup', maxWidth: '320px' })
      .setLngLat(e.lngLat)
      .setDOMContent(routePopup(route))
      .addTo(map);
  });
}
