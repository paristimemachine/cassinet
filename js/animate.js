// Animation de chemins exemples au chargement (temporairement désactivée, cf. main.js).
import { map, setData } from './map.js';
import { flatCoords } from './utils.js';

const segmentDelay = 5;
const colors = ['#11ff22', '#ff1122', '#1122ff', '#ffff33', '#ff44ff', '#55ffff'];

export const geojsonUrls = [
  'data/Brest_StOmer.geojson',
  'data/Clermont_Bayonne.geojson',
  'data/Lyon_Bordeaux.geojson',
  'data/Marseille_Nantes.geojson',
  'data/Orleans_Strasbourg.geojson',
  'data/Paris_Toulouse.geojson',
];

let animate = true;
let colorIndex = 0;

export function stopAllAnimations() {
  animate = false;
  if (map?.getSource('anim')) setData('anim', null);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Trace progressivement le chemin, point par point
async function animatePath(path, color) {
  for (let i = 2; i <= path.length && animate; i++) {
    setData('anim', { type: 'Feature', properties: { color }, geometry: { type: 'LineString', coordinates: path.slice(0, i) } });
    await sleep(segmentDelay);
  }
}

async function loadAndAnimateGeoJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    for (const feature of data.features) {
      if (!animate) break;
      await animatePath(flatCoords(feature.geometry), colors[colorIndex % colors.length]);
    }
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
  }
}

export async function loadAndAnimateAllGeoJSON(urls) {
  animate = true;
  while (animate) {
    shuffle(urls);
    for (const url of urls) {
      await loadAndAnimateGeoJSON(url);
      if (!animate) break;
      colorIndex++;
    }
  }
}
