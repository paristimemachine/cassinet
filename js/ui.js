// Éléments d'interface génériques : toasts, états de chargement, onglets,
// panneaux latéraux, thème sombre.
import { el } from './utils.js';

const ICONS = {
  info: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>',
  success:
    '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  warn: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>',
  error:
    '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>',
};

const TOAST_STYLES = {
  info: 'text-stone-700 dark:text-stone-200',
  success: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  error: 'text-red-700 dark:text-red-400',
};

export function toast(message, type = 'info', { duration = 5000, action } = {}) {
  const container = document.getElementById('toasts');
  const icon = el('span', {
    class: `shrink-0 ${TOAST_STYLES[type]}`,
    html: `<svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor" aria-hidden="true">${ICONS[type]}</svg>`,
  });
  const close = el('button', { class: 'icon-btn -m-1 shrink-0', 'aria-label': 'Fermer', html: '&times;' });
  const node = el(
    'div',
    { class: 'toast', role: type === 'error' ? 'alert' : 'status' },
    icon,
    el('p', { class: 'flex-1' }, message),
    action &&
      el(
        'button',
        {
          class: 'font-semibold underline underline-offset-2',
          onclick: () => {
            action.onClick();
            dismiss();
          },
        },
        action.label,
      ),
    close,
  );
  const dismiss = () => {
    node.classList.add('opacity-0', '-translate-y-1');
    setTimeout(() => node.remove(), 200);
  };
  close.addEventListener('click', dismiss);
  container.append(node);
  if (duration) setTimeout(dismiss, duration);
}

// Bouton en cours de traitement + barre de progression sur la carte
let pending = 0;
export async function withBusy(button, task) {
  const progress = document.getElementById('progress');
  pending++;
  progress.hidden = false;
  button?.setAttribute('aria-busy', 'true');
  if (button) button.disabled = true;
  try {
    return await task();
  } finally {
    if (button) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
    if (--pending === 0) progress.hidden = true;
  }
}

export function initTabs(root) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    for (const t of tabs) {
      const selected = t === tab;
      t.setAttribute('aria-selected', selected);
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
    }
  };
  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!delta) return;
      const next = tabs[(tabs.indexOf(tab) + delta + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  }
  return { select: (id) => select(tabs.find((t) => t.id === id)) };
}

// La barre latérale est fixe à partir de md (768 px), le panneau d'analyse
// s'ouvre automatiquement à partir de lg (1024 px)
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
const isMobile = () => !window.matchMedia('(min-width: 768px)').matches;

export function initPanels() {
  const sidebar = document.getElementById('sidebar');
  const panel = document.getElementById('analysisPanel');
  const toggle = document.getElementById('analysisToggle');

  const setSidebar = (open) => sidebar.classList.toggle('is-open', open);
  document.getElementById('sidebarOpen').addEventListener('click', () => setSidebar(true));
  document.getElementById('sidebarBackdrop').addEventListener('click', () => setSidebar(false));
  document.getElementById('sidebarClose').addEventListener('click', () => setSidebar(false));

  const setPanel = (open) => {
    panel.classList.toggle('is-open', open);
    panel.inert = !open;
    toggle.setAttribute('aria-expanded', open);
    document.body.classList.toggle('analysis-open', open);
  };
  toggle.addEventListener('click', () => setPanel(!panel.classList.contains('is-open')));
  document.getElementById('analysisClose').addEventListener('click', () => setPanel(false));
  setPanel(false);

  return {
    closeSidebarOnMobile: () => isMobile() && setSidebar(false),
    openSidebarOnMobile: () => isMobile() && setSidebar(true),
    openPanelOnDesktop: () => isDesktop() && setPanel(true),
    openPanel: () => setPanel(true),
  };
}

export function updateAnalysisCount() {
  const count = document.getElementById('analysisCards').children.length;
  const badge = document.getElementById('analysisCount');
  badge.textContent = count;
  badge.hidden = count === 0;
  document.getElementById('analysisEmpty').hidden = count > 0;
}

export function initTheme() {
  const button = document.getElementById('themeToggle');
  const apply = (dark) => {
    document.documentElement.classList.toggle('dark', dark);
    button.setAttribute('aria-pressed', dark);
  };
  apply(document.documentElement.classList.contains('dark'));
  button.addEventListener('click', () => {
    const dark = !document.documentElement.classList.contains('dark');
    apply(dark);
    try {
      localStorage.setItem('cassinet-theme', dark ? 'dark' : 'light');
    } catch {
      // stockage indisponible (navigation privée…)
    }
  });
}
