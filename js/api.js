import { API_BASE, ALTI_URL, GEOCODE_URL } from './config.js';

export class ApiError extends Error {}

async function getJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError('Le serveur ne répond pas. Vérifiez votre connexion.');
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    // corps vide ou non JSON
  }
  if (!response.ok) {
    throw new ApiError(data?.erreur || data?.error || `Erreur du serveur (${response.status})`);
  }
  return data;
}

const ll = ([lng, lat]) => [lng.toFixed(6), lat.toFixed(6)];

// URL publique de l'API pour un itinéraire (aussi proposée à la copie)
export function routeApiUrl(depart, arrivee, constraint = null) {
  const [x1, y1] = ll(depart);
  const [x2, y2] = ll(arrivee);
  const params = new URLSearchParams({ coordx_depart: x1, coordy_depart: y1, coordx_arrivee: x2, coordy_arrivee: y2 });
  if (constraint) {
    const [cx, cy] = ll(constraint.lngLat);
    params.set('coordx_constraint', cx);
    params.set('coordy_constraint', cy);
    params.set('radius', Math.round(constraint.radiusKm * 1000));
    return `${API_BASE}/search/route-contrainte/?${params}`;
  }
  return `${API_BASE}/search/route/?${params}`;
}

export const fetchRoute = (url) => getJson(url);

// `costs` : coûts réseau (jours à cheval). Renvoie une FeatureCollection,
// une Feature par coût (propriété `step`).
export async function fetchIsochrones(lngLat, costs) {
  const [lng, lat] = ll(lngLat);
  const base = `${API_BASE}/isochrone/?longitude=${lng}&latitude=${lat}`;
  try {
    const data = await getJson(`${base}&steps=${costs.join(',')}`);
    if (data?.type === 'FeatureCollection') return data;
  } catch {
    // API antérieure au paramètre `steps` : on se rabat sur un appel par pas
  }
  const geometries = await Promise.all(costs.map((c) => getJson(`${base}&distance=${c}`)));
  return {
    type: 'FeatureCollection',
    features: geometries.map((geometry, i) => ({ type: 'Feature', geometry, properties: { step: costs[i] } })),
  };
}

export async function fetchNearestPlace([lng, lat]) {
  const data = await getJson(`${API_BASE}/cherche_tache_urbaine/?longitude=${lng}&latitude=${lat}`);
  return data?.[0] ?? null;
}

export const submitProblem = (payload) =>
  getJson(`${API_BASE}/submit_problem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

// Altitudes IGN pour une liste de [lng, lat] (≤ ~200 points pour rester sous la limite d'URL)
export async function fetchElevations(coords) {
  const params = new URLSearchParams({
    lon: coords.map((c) => c[0].toFixed(5)).join('|'),
    lat: coords.map((c) => c[1].toFixed(5)).join('|'),
    resource: 'ign_rge_alti_wld',
    delimiter: '|',
    indent: 'false',
    measures: 'false',
    zonly: 'true',
  });
  const data = await getJson(`${ALTI_URL}?${params}`);
  return data.elevations;
}

// Recherche de lieux (communes, lieux-dits…) via le géocodeur de la Géoplateforme
export async function geocode(text) {
  const params = new URLSearchParams({ text, type: 'PositionOfInterest', maximumResponses: 6 });
  const data = await getJson(`${GEOCODE_URL}?${params}`);
  return (data?.results ?? []).map((r) => ({ label: r.fulltext, lngLat: [r.x, r.y] }));
}
