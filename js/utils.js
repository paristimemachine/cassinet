const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// À utiliser pour toute donnée externe (API, CSV) injectée en innerHTML
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

const numberFormats = new Map();
export function fmt(value, digits = 1) {
  if (!numberFormats.has(digits)) {
    numberFormats.set(digits, new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits }));
  }
  return numberFormats.get(digits).format(value);
}

export const fmtLngLat = ([lng, lat], digits = 5) => `${lat.toFixed(digits)}, ${lng.toFixed(digits)}`;

export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function downloadJson(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/geo+json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Petit constructeur DOM : el('button', { class: 'btn', onclick: fn }, 'Texte')
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
}

// Coordonnées « à plat » d'une géométrie LineString / MultiLineString
export const flatCoords = (geometry) =>
  geometry.type === 'MultiLineString' ? geometry.coordinates.flat() : geometry.coordinates;
