// Calcul et affichage des isochrones, légende.
import { state, currentSpeed } from './state.js';
import { fetchIsochrones } from './api.js';
import { setData, fitTo } from './map.js';
import { NETWORK_SPEED, ISOCHRONE_RAMP, MAX_ISOCHRONE_STEPS } from './config.js';
import { toast, withBusy } from './ui.js';
import { addIsochroneCard } from './analysis.js';
import { el, fmt } from './utils.js';

let isoSeq = 0;

export const MODE_LABELS = { walk: 'à pied', horse: 'à cheval' };

// Pas d'isochrone en jours, d'après le curseur (durée max) et le pas choisi
export function isoDays() {
  const { max, step } = state.iso;
  const days = [];
  for (let d = step; d <= max + 1e-9 && days.length < MAX_ISOCHRONE_STEPS; d += step) {
    days.push(Math.round(d * 100) / 100);
  }
  return days.length ? days : [max];
}

const rampColor = (index, count) =>
  ISOCHRONE_RAMP[count <= 1 ? 0 : Math.round((index * (ISOCHRONE_RAMP.length - 1)) / (count - 1))];

export async function computeIsochrones(button, { fit = true } = {}) {
  const center = state.isochrone;
  if (!center) {
    toast("Choisissez le centre de l'isochrone en cliquant sur la carte.", 'warn');
    return;
  }
  const days = isoDays();
  const { mode } = state;
  const speed = currentSpeed();
  // Coût réseau = jours à cheval à 48 km/j
  const costs = days.map((d) => Number(((d * speed) / NETWORK_SPEED).toFixed(4)));
  const cumulative = document.getElementById('isoCumul').checked;

  await withBusy(button, async () => {
    let collection;
    try {
      collection = await fetchIsochrones(center.lngLat, costs);
    } catch (error) {
      toast(`Calcul impossible : ${error.message}`, 'error');
      return;
    }
    const features = collection.features.filter((f) => f.geometry && /Polygon$/.test(f.geometry.type));
    if (!features.length) {
      toast('Aucune zone accessible calculée depuis ce point.', 'warn');
      return;
    }

    if (!cumulative) clearIsochrones();
    const id = ++isoSeq;
    for (const f of features) {
      const index = costs.findIndex((c) => Math.abs(c - f.properties.step) < 1e-6);
      f.properties = { set: id, step: f.properties.step, days: days[index], color: rampColor(index, days.length) };
    }

    const set = {
      id,
      title: `Isochrones depuis ${center.name || 'le point choisi'}`,
      mode,
      speed,
      features,
      indicators: features.map(indicators),
    };
    state.isochroneSets.push(set);
    renderIsochrones();
    set.card = addIsochroneCard(set, {
      onZoom: () => fitTo({ type: 'FeatureCollection', features }),
      onRemove: () => removeIsochroneSet(id),
    });
    if (fit) fitTo({ type: 'FeatureCollection', features });
  });
}

// Surface, périmètre et indice de circularité (4πA / P², 1 pour un disque)
function indicators(feature) {
  const area = turf.area(feature);
  const perimeter = turf.length(turf.polygonToLine(feature), { units: 'meters' });
  return {
    days: feature.properties.days,
    color: feature.properties.color,
    areaKm2: area / 1e6,
    perimeterKm: perimeter / 1000,
    circularity: (4 * Math.PI * area) / perimeter ** 2,
  };
}

function renderIsochrones() {
  setData('isochrones', { type: 'FeatureCollection', features: state.isochroneSets.flatMap((s) => s.features) });
  renderLegend();
}

export function removeIsochroneSet(id) {
  const index = state.isochroneSets.findIndex((s) => s.id === id);
  if (index < 0) return;
  state.isochroneSets[index].card.remove();
  state.isochroneSets.splice(index, 1);
  renderIsochrones();
}

export function clearIsochrones() {
  for (const set of state.isochroneSets) set.card.remove();
  state.isochroneSets = [];
  renderIsochrones();
}

// Légende du dernier jeu d'isochrones calculé
function renderLegend() {
  const legend = document.getElementById('legend');
  const set = state.isochroneSets.at(-1);
  legend.hidden = !set;
  if (!set) return;
  legend.replaceChildren(
    el('p', { class: 'font-semibold' }, `Isochrones ${MODE_LABELS[set.mode]}`),
    el('p', { class: 'mb-1.5 text-stone-500 dark:text-stone-400' }, `${fmt(set.speed, 0)} km/j`),
    el(
      'ul',
      { class: 'space-y-1' },
      set.indicators.map((i) =>
        el(
          'li',
          { class: 'flex items-center gap-2' },
          el('span', { class: 'legend-swatch', style: `background: ${i.color}` }),
          `≤ ${fmt(i.days, i.days % 1 ? 1 : 0)} j`,
        ),
      ),
    ),
  );
}
