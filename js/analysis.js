// Panneau « Analyses » : une fiche par itinéraire ou jeu d'isochrones.
import { state } from './state.js';
import { setData } from './map.js';
import { updateAnalysisCount } from './ui.js';
import { el, fmt } from './utils.js';

const MODE_LABELS = { walk: 'à pied', horse: 'à cheval' };

let onCardAdded = () => {};
export function initAnalysis(options) {
  onCardAdded = options.onCardAdded;
  updateAnalysisCount();
}

const ICON_ZOOM =
  '<svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/></svg>';
const ICON_CLOSE =
  '<svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';

function card({ color, title, onZoom, onRemove }, ...body) {
  const node = el(
    'article',
    { class: 'card' },
    el(
      'header',
      { class: 'flex items-start gap-2' },
      el('span', { class: 'mt-1.5 size-2.5 shrink-0 rounded-full', style: `background: ${color}` }),
      el('h3', { class: 'flex-1 font-semibold leading-snug' }, title),
      el('button', {
        type: 'button',
        class: 'icon-btn',
        title: 'Centrer la carte',
        'aria-label': 'Centrer la carte',
        html: ICON_ZOOM,
        onclick: onZoom,
      }),
      el('button', {
        type: 'button',
        class: 'icon-btn',
        title: 'Supprimer',
        'aria-label': 'Supprimer',
        html: ICON_CLOSE,
        onclick: onRemove,
      }),
    ),
    ...body,
  );
  document.getElementById('analysisCards').prepend(node);
  updateAnalysisCount();
  onCardAdded();
  return node;
}

const stat = (label, value) => el('div', {}, el('dt', { class: 'stat-label' }, label), el('dd', { class: 'stat-value' }, value));

// ---------------------------------------------------------------------------
// Itinéraires
// ---------------------------------------------------------------------------

export function addRouteCard(route, { actions, onZoom, onRemove }) {
  const days = (mode) => fmt(route.distanceKm / state.speeds[mode], 1);
  const elevation = el('div', {}, el('dt', { class: 'stat-label' }, 'Dénivelé'), el('dd', { class: 'stat-value' }, '…'));
  const profile = el(
    'div',
    { class: 'profile' },
    el('p', { class: 'text-sm text-stone-500 dark:text-stone-400' }, 'Profil altimétrique en cours de calcul…'),
  );

  const node = card(
    { color: route.color, title: route.name + (route.constrained ? ' (zone évitée)' : ''), onZoom, onRemove },
    el(
      'dl',
      { class: 'grid grid-cols-2 gap-x-4 gap-y-2' },
      stat('Distance', `${fmt(route.distanceKm, 1)} km`),
      stat(`À cheval (${state.speeds.horse} km/j)`, `${days('horse')} j`),
      stat(`À pied (${state.speeds.walk} km/j)`, `${days('walk')} j`),
      elevation,
    ),
    profile,
    actions,
  );

  return {
    remove: () => {
      node.remove();
      updateAnalysisCount();
    },
    setProfile: (data) => {
      if (!data) {
        elevation.lastChild.textContent = '—';
        profile.replaceChildren(el('p', { class: 'text-sm text-stone-500' }, 'Profil altimétrique indisponible.'));
        return;
      }
      elevation.lastChild.textContent = `+${fmt(data.gain, 0)} / −${fmt(data.loss, 0)} m`;
      profile.replaceChildren(profileChart(data.points, route.color));
    },
  };
}

const showHover = (lngLat) =>
  setData('hover', lngLat && { type: 'Feature', geometry: { type: 'Point', coordinates: lngLat }, properties: {} });

function profileChart(points, color) {
  const width = 340;
  const height = 130;
  const margin = { top: 18, right: 8, bottom: 22, left: 46 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const [zMin, zMax] = d3.extent(points, (p) => p.z);
  const pad = Math.max(10, (zMax - zMin) * 0.1);
  const x = d3
    .scaleLinear()
    .domain([0, points.at(-1).distance])
    .range([0, innerW]);
  const y = d3
    .scaleLinear()
    .domain([Math.max(0, zMin - pad), zMax + pad])
    .nice()
    .range([innerH, 0]);

  const svg = d3
    .create('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class', 'w-full h-auto')
    .attr('role', 'img')
    .attr('aria-label', `Profil altimétrique : de ${Math.round(zMin)} à ${Math.round(zMax)} m`);
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  g.append('g')
    .attr('class', 'chart-axis')
    .attr('transform', `translate(0,${innerH})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(5)
        .tickSizeOuter(0)
        .tickFormat((d) => `${d} km`),
    );
  g.append('g')
    .attr('class', 'chart-axis chart-grid')
    .call(
      d3
        .axisLeft(y)
        .ticks(3)
        .tickSize(-innerW)
        .tickFormat((d) => `${d} m`),
    )
    .call((axis) => axis.select('.domain').remove());

  g.append('path')
    .datum(points)
    .attr('fill', color)
    .attr('fill-opacity', 0.15)
    .attr(
      'd',
      d3
        .area()
        .x((p) => x(p.distance))
        .y0(innerH)
        .y1((p) => y(p.z))
        .curve(d3.curveMonotoneX),
    );
  g.append('path')
    .datum(points)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', 1.8)
    .attr(
      'd',
      d3
        .line()
        .x((p) => x(p.distance))
        .y((p) => y(p.z))
        .curve(d3.curveMonotoneX),
    );

  const focus = g.append('g').style('display', 'none');
  focus.append('line').attr('class', 'chart-rule').attr('y1', 0).attr('y2', innerH);
  focus.append('circle').attr('r', 3.5).attr('fill', color).attr('stroke', 'white').attr('stroke-width', 1.5);
  const label = focus.append('text').attr('class', 'chart-label').attr('y', -2);

  const bisect = d3.bisector((p) => p.distance).center;
  g.append('rect')
    .attr('width', innerW)
    .attr('height', innerH)
    .attr('fill', 'transparent')
    .on('pointerenter', () => focus.style('display', null))
    .on('pointerleave', () => {
      focus.style('display', 'none');
      showHover(null);
    })
    .on('pointermove', (event) => {
      const p = points[bisect(points, x.invert(d3.pointer(event)[0]))];
      const px = x(p.distance);
      focus.select('line').attr('x1', px).attr('x2', px);
      focus.select('circle').attr('cx', px).attr('cy', y(p.z));
      label
        .attr('x', px)
        .attr('text-anchor', px > innerW / 2 ? 'end' : 'start')
        .attr('dx', px > innerW / 2 ? -6 : 6)
        .text(`${fmt(p.distance, 1)} km · ${Math.round(p.z)} m`);
      showHover(p.lngLat);
    });

  return svg.node();
}

// ---------------------------------------------------------------------------
// Isochrones
// ---------------------------------------------------------------------------

export function addIsochroneCard(set, { onZoom, onRemove }) {
  const rows = set.indicators.map((i) =>
    el(
      'tr',
      {},
      el(
        'td',
        {},
        el('span', { class: 'legend-swatch mr-1.5 align-[-1px]', style: `background: ${i.color}` }),
        `${fmt(i.days, i.days % 1 ? 1 : 0)} j`,
      ),
      el('td', {}, fmt(i.areaKm2, 0)),
      el('td', {}, fmt(i.perimeterKm, 0)),
      el('td', {}, fmt(i.circularity, 2)),
    ),
  );

  const node = card(
    { color: set.indicators[0].color, title: set.title, onZoom, onRemove },
    el(
      'p',
      { class: 'text-sm text-stone-500 dark:text-stone-400' },
      `Voyage ${MODE_LABELS[set.mode]} · ${fmt(set.speed, 0)} km/j`,
    ),
    el(
      'table',
      { class: 'data-table' },
      el(
        'thead',
        {},
        el(
          'tr',
          {},
          el('th', { scope: 'col' }, 'Durée'),
          el('th', { scope: 'col' }, 'Surface (km²)'),
          el('th', { scope: 'col' }, 'Périmètre (km)'),
          el('th', { scope: 'col', title: '4πA / P² : 1 pour un disque parfait' }, 'Circularité'),
        ),
      ),
      el('tbody', {}, rows),
    ),
  );

  return {
    remove: () => {
      node.remove();
      updateAnalysisCount();
    },
  };
}
