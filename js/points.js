// Choix des points (départ, arrivée, centre d'isochrone, zone à éviter) :
// popup au clic sur la carte, champs de la barre latérale, recherche de lieux.
import { map, placeMarker, removeMarker, showConstraint, notifyChange } from './map.js';
import { state } from './state.js';
import { fetchNearestPlace, geocode } from './api.js';
import { el, fmt, fmtLngLat, debounce } from './utils.js';
import { stopAllAnimations } from './animate.js';
import { openReport } from './report.js';

const FIELDS = { depart: 'departField', arrivee: 'arriveeField', isochrone: 'isochroneField' };
const PLACEHOLDERS = {
  depart: 'Cliquez sur la carte',
  arrivee: 'Cliquez sur la carte',
  isochrone: 'Cliquez sur la carte',
};

export function setPoint(type, lngLat, name) {
  if (type === 'constraint') {
    state.constraint = { lngLat, radiusKm: state.constraintKm };
    showConstraint(state.constraint);
    renderConstraint();
  } else {
    state[type] = { lngLat, name };
    placeMarker(type, lngLat);
    renderPoint(type);
  }
  notifyChange();
  document.dispatchEvent(new CustomEvent('cassinet:point', { detail: { type } }));
}

export function clearPoint(type) {
  if (type === 'constraint') {
    state.constraint = null;
    showConstraint(null);
    renderConstraint();
  } else {
    state[type] = null;
    removeMarker(type);
    renderPoint(type);
  }
  notifyChange();
}

export function swapPoints() {
  const { depart, arrivee } = state;
  for (const [type, point] of [
    ['depart', arrivee],
    ['arrivee', depart],
  ]) {
    if (point) setPoint(type, point.lngLat, point.name);
    else clearPoint(type);
  }
}

function renderPoint(type) {
  const field = document.getElementById(FIELDS[type]);
  const point = state[type];
  field.toggleAttribute('data-empty', !point);
  field.querySelector('.point-value').textContent = point ? point.name || 'Point' : PLACEHOLDERS[type];
  field.querySelector('.point-coords').textContent = point ? fmtLngLat(point.lngLat, 4) : '';
  field.querySelector('[data-clear]').hidden = !point;
}

export function renderConstraint() {
  const field = document.getElementById('constraintField');
  field.hidden = !state.constraint;
  if (state.constraint) {
    field.querySelector('.point-value').textContent = `Zone à éviter · ${fmt(state.constraint.radiusKm, 0)} km`;
    field.querySelector('.point-coords').textContent = fmtLngLat(state.constraint.lngLat, 4);
  }
}

export function initPointFields() {
  document
    .querySelectorAll('[data-clear]')
    .forEach((button) => button.addEventListener('click', () => clearPoint(button.dataset.clear)));
  Object.keys(FIELDS).forEach(renderPoint);
  renderConstraint();
}

// ---------------------------------------------------------------------------
// Popup au clic sur la carte
// ---------------------------------------------------------------------------

const formatDistance = (m) => (m < 1000 ? `${Math.round(m)} m` : `${fmt(m / 1000, 1)} km`);

function placeContent(lngLat, place, label, close) {
  const name = place?.nom || label || 'Point';
  let header;
  if (place === undefined) {
    header = el('p', { class: 'text-sm text-stone-500 dark:text-stone-400' }, 'Recherche du lieu le plus proche…');
  } else if (place) {
    header = el(
      'div',
      {},
      el('p', { class: 'text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400' }, 'Tâche urbaine la plus proche'),
      el(
        'p',
        { class: 'font-semibold text-base' },
        place.nom || 'Lieu sans nom',
        el('span', { class: 'font-normal text-stone-500 dark:text-stone-400' }, ` · ${formatDistance(place.distance)}`),
      ),
    );
  } else {
    header = el('p', { class: 'text-sm' }, label || 'Aucune tâche urbaine trouvée');
  }

  const choose = (type) => () => {
    close();
    setPoint(type, lngLat, name);
  };
  const action = (type, text, color) =>
    el('button', { type: 'button', class: 'popup-action', style: `--action-color: ${color}`, onclick: choose(type) }, text);

  const inConstraint =
    state.constraint && turf.distance(lngLat, state.constraint.lngLat, { units: 'kilometers' }) <= state.constraint.radiusKm;

  return el(
    'div',
    { class: 'space-y-3' },
    header,
    el('p', { class: 'text-xs tabular-nums text-stone-500 dark:text-stone-400' }, fmtLngLat(lngLat, 5)),
    el(
      'div',
      { class: 'grid grid-cols-2 gap-1.5' },
      action('depart', 'Départ', '#16a34a'),
      action('arrivee', 'Arrivée', '#dc2626'),
      action('isochrone', 'Isochrone', '#2563eb'),
      action('constraint', 'Zone à éviter', '#1c1917'),
    ),
    inConstraint &&
      el(
        'button',
        {
          type: 'button',
          class: 'text-sm font-medium underline underline-offset-2',
          onclick: () => {
            close();
            clearPoint('constraint');
          },
        },
        'Retirer la zone à éviter',
      ),
    el(
      'button',
      {
        type: 'button',
        class: 'text-sm font-medium text-amber-700 dark:text-amber-400 underline underline-offset-2',
        onclick: () => {
          close();
          openReport(lngLat);
        },
      },
      'Signaler un problème ici',
    ),
  );
}

export async function openPlacePopup(lngLat, label) {
  const popup = new maplibregl.Popup({ className: 'cn-popup', maxWidth: '300px' }).setLngLat(lngLat);
  const close = () => popup.remove();
  popup.setDOMContent(placeContent(lngLat, undefined, label, close)).addTo(map);
  let place = null;
  try {
    place = await fetchNearestPlace(lngLat);
  } catch {
    // on garde la popup sans nom de lieu
  }
  if (popup.isOpen()) popup.setDOMContent(placeContent(lngLat, place, label, close));
}

export function initMapClick() {
  map.on('click', (e) => {
    // Les itinéraires et étapes d'Arthur Young ont leur propre popup
    if (map.queryRenderedFeatures(e.point, { layers: ['route-line', 'ay-steps'] }).length) return;
    stopAllAnimations();
    openPlacePopup([e.lngLat.lng, e.lngLat.lat]);
  });
}

// ---------------------------------------------------------------------------
// Recherche de lieux
// ---------------------------------------------------------------------------

export function initSearch({ onChoose } = {}) {
  const input = document.getElementById('search');
  const list = document.getElementById('searchResults');
  let results = [];
  let active = -1;
  let requestId = 0;

  const render = () => {
    list.replaceChildren(
      ...results.map((r, i) =>
        el(
          'li',
          {
            id: `search-${i}`,
            role: 'option',
            class: 'search-option',
            'aria-selected': i === active ? 'true' : 'false',
            // mousedown plutôt que click : passe avant le blur du champ
            onmousedown: (e) => {
              e.preventDefault();
              choose(r);
            },
          },
          r.label,
        ),
      ),
    );
    list.hidden = results.length === 0;
    input.setAttribute('aria-expanded', results.length > 0);
    input.setAttribute('aria-activedescendant', active >= 0 ? `search-${active}` : '');
  };

  const choose = (result) => {
    input.value = result.label;
    results = [];
    render();
    map.flyTo({ center: result.lngLat, zoom: Math.max(map.getZoom(), 11) });
    openPlacePopup(result.lngLat, result.label);
    onChoose?.();
  };

  input.addEventListener(
    'input',
    debounce(async () => {
      const query = input.value.trim();
      const id = ++requestId;
      if (query.length < 3) {
        results = [];
        render();
        return;
      }
      try {
        const found = await geocode(query);
        if (id !== requestId) return;
        results = found;
      } catch {
        results = [];
      }
      active = -1;
      render();
    }, 300),
  );

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!results.length) return;
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      render();
    } else if (e.key === 'Enter' && results.length) {
      e.preventDefault();
      choose(results[Math.max(active, 0)]);
    } else if (e.key === 'Escape') {
      results = [];
      render();
    }
  });
  input.addEventListener('blur', () => {
    results = [];
    render();
  });
}
