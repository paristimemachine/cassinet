// Point d'entrée : initialise l'interface, la carte, puis restaure l'état du lien partagé.
import { state } from './state.js';
import { readShareParams, syncUrl } from './share.js';
import { createMap, map, setExaggeration, showConstraint, notifyChange } from './map.js';
import { initTabs, initPanels, initTheme } from './ui.js';
import { initPointFields, initMapClick, initSearch, setPoint, swapPoints, renderConstraint } from './points.js';
import { computeRoute, initRouteInteractions } from './route.js';
import { computeIsochrones, isoDays, MODE_LABELS } from './isochrone.js';
import { initAnalysis } from './analysis.js';
import { initReport } from './report.js';
import { initArthurYoung } from './ay.js';
import { fetchNearestPlace } from './api.js';
import { debounce, fmt } from './utils.js';
// import { loadAndAnimateAllGeoJSON, geojsonUrls } from './animate.js';

const $ = (id) => document.getElementById(id);

const restore = readShareParams();

initTheme();
const tabs = initTabs($('tabs'));
const panels = initPanels();
initAnalysis({ onCardAdded: panels.openPanelOnDesktop });
initReport();
initDialogs();
initSettings();
initPointFields();

await createMap(restore.camera);

initMapClick();
initRouteInteractions();
initSearch({ onChoose: panels.closeSidebarOnMobile });
initArthurYoung();

$('routeButton').addEventListener('click', (e) => computeRoute(e.currentTarget));
$('isoButton').addEventListener('click', (e) => computeIsochrones(e.currentTarget));
$('swapButton').addEventListener('click', swapPoints);

document.addEventListener('cassinet:point', ({ detail: { type } }) => {
  tabs.select(type === 'isochrone' ? 'tab-iso' : 'tab-route');
  // Sur mobile, on rouvre le menu une fois le dernier point choisi
  if (type === 'arrivee' || type === 'isochrone') panels.openSidebarOnMobile();
});

const sync = debounce(syncUrl, 300);
document.addEventListener('cassinet:change', sync);
map.on('moveend', sync);

await restorePoints(restore);
sync();

// Animations des chemins exemples, temporairement désactivées
// loadAndAnimateAllGeoJSON(geojsonUrls);

// ---------------------------------------------------------------------------

async function restorePoints({ depart, arrivee, isochrone, constraint, camera }) {
  const nameOf = async (lngLat) => {
    if (!lngLat) return null;
    try {
      return (await fetchNearestPlace(lngLat))?.nom || 'Point';
    } catch {
      return 'Point';
    }
  };
  const [departName, arriveeName, isoName] = await Promise.all([nameOf(depart), nameOf(arrivee), nameOf(isochrone)]);

  if (constraint) {
    state.constraintKm = constraint.radiusKm;
    $('constraintKm').value = constraint.radiusKm;
    setPoint('constraint', constraint.lngLat);
  }
  if (depart) setPoint('depart', depart, departName);
  if (arrivee) setPoint('arrivee', arrivee, arriveeName);
  if (isochrone) setPoint('isochrone', isochrone, isoName);

  // Un lien avec une vue de carte explicite la conserve
  const hasRoute = depart && arrivee;
  if (hasRoute) await computeRoute($('routeButton'), { fit: !camera });
  if (isochrone) await computeIsochrones($('isoButton'), { fit: !camera && !hasRoute });
  tabs.select(isochrone && !hasRoute ? 'tab-iso' : 'tab-route');
}

function initDialogs() {
  const info = $('infoDialog');
  $('infoButton').addEventListener('click', () => info.showModal());
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dialog.close()));
    // Clic sur le fond : fermeture
    dialog.addEventListener('click', (e) => e.target === dialog && dialog.close());
  }
}

function initSettings() {
  // Mode de déplacement
  const modeInputs = document.querySelectorAll('input[name="mode"]');
  const renderSpeeds = () => {
    $('speedWalkLabel').textContent = `${fmt(state.speeds.walk, 0)} km/j`;
    $('speedHorseLabel').textContent = `${fmt(state.speeds.horse, 0)} km/j`;
  };
  modeInputs.forEach((input) => {
    input.checked = input.value === state.mode;
    input.addEventListener('change', () => {
      state.mode = input.value;
      renderIsoPreview();
      notifyChange();
    });
  });

  // Vitesses
  for (const [id, mode] of [
    ['speedWalk', 'walk'],
    ['speedHorse', 'horse'],
  ]) {
    const input = $(id);
    input.value = state.speeds[mode];
    input.addEventListener('change', () => {
      const value = Number(input.value);
      if (Number.isFinite(value) && value > 0) state.speeds[mode] = value;
      input.value = state.speeds[mode];
      renderSpeeds();
      renderIsoPreview();
      notifyChange();
    });
  }
  renderSpeeds();

  // Rayon de la zone à éviter
  const radius = $('constraintKm');
  radius.value = state.constraintKm;
  radius.addEventListener('change', () => {
    const value = Number(radius.value);
    if (Number.isFinite(value) && value > 0) state.constraintKm = value;
    radius.value = state.constraintKm;
    if (state.constraint) {
      state.constraint.radiusKm = state.constraintKm;
      showConstraint(state.constraint);
      renderConstraint();
      notifyChange();
    }
  });

  // Exagération du relief
  const exaggeration = $('exaggeration');
  exaggeration.value = state.exaggeration;
  $('exaggerationValue').textContent = `×${fmt(state.exaggeration, 1)}`;
  exaggeration.addEventListener('input', () => {
    $('exaggerationValue').textContent = `×${fmt(Number(exaggeration.value), 1)}`;
    if (map) setExaggeration(Number(exaggeration.value));
  });
  exaggeration.addEventListener('change', notifyChange);

  // Isochrones : durée maximale et pas
  const isoMax = $('isoMax');
  const isoStep = $('isoStep');
  isoMax.value = state.iso.max;
  if (![...isoStep.options].some((o) => Number(o.value) === state.iso.step)) {
    isoStep.append(new Option(`${fmt(state.iso.step, 1)} j`, state.iso.step));
  }
  isoStep.value = state.iso.step;
  const onIsoChange = () => {
    state.iso.max = Number(isoMax.value);
    state.iso.step = Number(isoStep.value);
    renderIsoPreview();
    notifyChange();
  };
  isoMax.addEventListener('input', onIsoChange);
  isoStep.addEventListener('change', onIsoChange);
  renderIsoPreview();
}

function renderIsoPreview() {
  const days = isoDays();
  $('isoMaxValue').textContent = `${fmt(state.iso.max, 0)} j`;
  const truncated = days.at(-1) < state.iso.max;
  $('isoPreview').textContent =
    `${days.length} isochrone${days.length > 1 ? 's' : ''} ${MODE_LABELS[state.mode]} : ` +
    `${days.map((d) => fmt(d, d % 1 ? 1 : 0)).join(', ')} j` +
    (truncated ? ' (10 pas au maximum)' : '');
}
