/**
 * Module de gestion du voyage d'Arthur Young
 *
 * CONFIGURATION TEMPORAIRE :
 * - Le personnage est actuellement figé au 20/07 (voir variable FREEZE_DATE)
 * - Pour réactiver le mode temps réel, mettre FREEZE_DATE = null
 * - Le parcours antérieur au 20/07 reste affiché intégralement
 */
import { map, setData } from './map.js';
import { state } from './state.js';
import { el, escapeHtml } from './utils.js';

// Configuration pour figer le personnage à une date spécifique
// Mettre à null pour désactiver et utiliser la date actuelle
const FREEZE_DATE = '07-20'; // Format MM-DD pour le 20/07 - mettre à null pour désactiver

const CSV_URL = 'data/arthur_young_trajet_v5.csv';
// Délai de fermeture après que la souris quitte la popup
const POPUP_CLOSE_DELAY = 2000;

const INTRO_POPUP = `
  <div class="ay-popup">
    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Arthur_Young_%281741-1820%29.jpg" alt="Portrait d'Arthur Young">
    <p><strong>Arthur Young</strong> partira le 15 mai de Calais.</p>
    <p><a href="https://fr.wikipedia.org/wiki/Arthur_Young" target="_blank" rel="noopener">En savoir plus sur Arthur Young</a>
    · <a href="https://gallica.bnf.fr/ark:/12148/bpt6k1192719/f85.item.texteImage" target="_blank" rel="noopener">Source Gallica</a></p>
  </div>`;

// Fonction pour générer le contenu HTML de la popup d'Arthur Young
function genererContenuPopupArthur(row) {
  // row.date est au format YYYY-MM-DD
  const [year, month, day] = row.date.trim().split('-');
  return `
    <div class="ay-popup">
      <img src="data/img/${encodeURIComponent(row.file)}" alt="Illustration pour ${escapeHtml(row.origin)} – ${escapeHtml(row.destination)}"
           title="Illustration générée par IA : ${escapeHtml(row.text)}" class="ay-illustration">
      <p><strong>${day}/${month}/${year} – ${escapeHtml(row.origin)} → ${escapeHtml(row.destination)}</strong></p>
      <p>${escapeHtml(row.text)}</p>
      <p><a href="${escapeHtml(row.url)}" target="_blank" rel="noopener">Voir sur Gallica</a>
      · <a href="https://fr.wikipedia.org/wiki/Arthur_Young" target="_blank" rel="noopener">Arthur Young</a></p>
    </div>`;
}

// Popup ouverte au survol, refermée quelques secondes après que la souris
// a quitté à la fois le déclencheur et la popup.
function hoverPopup() {
  const popup = new maplibregl.Popup({ className: 'cn-popup', maxWidth: '360px', closeButton: true, offset: 12 });
  let timer = null;
  let overPopup = false;
  const cancel = () => clearTimeout(timer);
  const scheduleClose = () => {
    cancel();
    timer = setTimeout(() => !overPopup && popup.remove(), POPUP_CLOSE_DELAY);
  };
  popup.on('open', () => {
    const node = popup.getElement();
    node.addEventListener('mouseenter', () => {
      overPopup = true;
      cancel();
    });
    node.addEventListener('mouseleave', () => {
      overPopup = false;
      scheduleClose();
    });
  });
  return {
    show(lngLat, html) {
      cancel();
      overPopup = false;
      popup.setLngLat(lngLat).setHTML(html);
      if (!popup.isOpen()) popup.addTo(map);
    },
    scheduleClose,
  };
}

const parseDate = (mmdd) => new Date(`2025-${mmdd}`);

export function initArthurYoung() {
  const image = el('img', { src: 'img/ay/ay_anim3.gif', alt: 'Arthur Young, à cheval', width: 48, height: 48 });
  const element = el('div', { class: 'ay-character', role: 'img', 'aria-label': "Position d'Arthur Young" }, image);
  const personnage = new maplibregl.Marker({ element, anchor: 'bottom' }).setLngLat([1.846303, 50.957562]);
  const popup = hoverPopup();
  let personnageHtml = INTRO_POPUP;

  element.addEventListener('mouseenter', () => popup.show(personnage.getLngLat(), personnageHtml));
  element.addEventListener('mouseleave', popup.scheduleClose);
  element.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.show(personnage.getLngLat(), personnageHtml);
  });

  map.on('mouseenter', 'ay-steps', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    popup.show(e.features[0].geometry.coordinates, genererContenuPopupArthur(e.features[0].properties));
  });
  map.on('mouseleave', 'ay-steps', () => {
    map.getCanvas().style.cursor = '';
    popup.scheduleClose();
  });
  map.on('click', 'ay-steps', (e) =>
    popup.show(e.features[0].geometry.coordinates, genererContenuPopupArthur(e.features[0].properties)),
  );

  const setVisible = (on) => (on ? personnage.addTo(map) : personnage.remove());
  document.addEventListener('cassinet:overlay', (e) => e.detail.id === 'ay' && setVisible(e.detail.on));

  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    complete: ({ data }) => {
      // Utilisation de la date figée ou de la date actuelle selon la configuration
      const today = FREEZE_DATE ? parseDate(FREEZE_DATE) : new Date();
      const todayString = FREEZE_DATE || today.toISOString().split('T')[0].slice(5); // Format MM-DD
      const currentHour = FREEZE_DATE ? 20 : today.getHours(); // Fin de journée si date figée

      const rows = data.filter((r) => r.date);
      // Tri chronologique, puis par 'ordre' au sein d'une même journée
      rows.sort((a, b) => a.date.trim().localeCompare(b.date.trim()) || parseInt(a.ordre, 10) - parseInt(b.ordre, 10));

      // Étape en cours : position dans la journée selon l'heure (8 h – 20 h)
      const todayRows = rows.filter((r) => r.date.trim().slice(5) === todayString);
      if (!todayRows.length) return;
      let index;
      if (currentHour < 8) index = 0;
      else if (currentHour > 20) index = todayRows.length - 1;
      else index = Math.min(Math.floor(((currentHour - 8) / 12) * todayRows.length), todayRows.length - 1);
      const ligneDuJour = todayRows[index];

      personnage.setLngLat([parseFloat(ligneDuJour.x_end), parseFloat(ligneDuJour.y_end)]);
      personnageHtml = genererContenuPopupArthur(ligneDuJour);

      // Tracé de tout le parcours jusqu'à la date limite (figée ou actuelle) incluse
      const limitDate = parseDate(todayString);
      const journey = [];
      const seen = new Set();
      const addPoint = (x, y) => {
        if (!x || !y || seen.has(`${x},${y}`)) return;
        seen.add(`${x},${y}`);
        journey.push([parseFloat(x), parseFloat(y)]);
      };
      for (const row of rows) {
        if (parseDate(row.date.trim().slice(5)) > limitDate) break;
        addPoint(row.x_start, row.y_start);
        addPoint(row.x_end, row.y_end);
      }
      setData(
        'ay-line',
        journey.length > 1 && { type: 'Feature', geometry: { type: 'LineString', coordinates: journey }, properties: {} },
      );

      // Marqueurs des étapes passées (jusqu'à l'étape en cours, exclue)
      const steps = [];
      for (const row of rows) {
        if (row.date === ligneDuJour.date && row.ordre === ligneDuJour.ordre) break;
        if (!row.x_end || !row.y_end) continue;
        steps.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [parseFloat(row.x_end), parseFloat(row.y_end)] },
          properties: {
            date: row.date,
            origin: row.origin,
            destination: row.destination,
            text: row.text,
            url: row.url,
            file: row.file,
          },
        });
      }
      setData('ay-steps', { type: 'FeatureCollection', features: steps });
    },
  });

  setVisible(state.overlays.has('ay'));
}
