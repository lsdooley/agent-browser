export const COLOR_MAP = {
  cyan:   { accent: '#0891b2', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', light: '#ecfeff', text: '#fff' },
  blue:   { accent: '#2563eb', gradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)', light: '#eff6ff', text: '#fff' },
  purple: { accent: '#7c3aed', gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', light: '#f5f3ff', text: '#fff' },
  green:  { accent: '#15803d', gradient: 'linear-gradient(135deg, #4ade80 0%, #15803d 100%)', light: '#f0fdf4', text: '#fff' },
  orange: { accent: '#c2410c', gradient: 'linear-gradient(135deg, #fb923c 0%, #c2410c 100%)', light: '#fff7ed', text: '#fff' },
  red:    { accent: '#b91c1c', gradient: 'linear-gradient(135deg, #f87171 0%, #b91c1c 100%)', light: '#fef2f2', text: '#fff' },
  yellow: { accent: '#a16207', gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', light: '#fefce8', text: '#fff' },
  pink:   { accent: '#be185d', gradient: 'linear-gradient(135deg, #f472b6 0%, #be185d 100%)', light: '#fdf4ff', text: '#fff' },
};

export const DEFAULT_COLOR = {
  accent: '#4f46e5',
  gradient: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)',
  light: '#eef2ff',
  text: '#fff',
};

export function getColor(color) {
  return COLOR_MAP[color?.toLowerCase()] || DEFAULT_COLOR;
}

// Per-category colors — used for headers and accents
export const CATEGORY_COLORS = {
  engineering:          'blue',
  design:               'purple',
  product:              'orange',
  testing:              'green',
  support:              'cyan',
  'project-management': 'yellow',
  specialized:          'pink',
  strategy:             'blue',
  'game-development':   'red',
  general:              'purple',
};

export function getCategoryColor(category) {
  const key = CATEGORY_COLORS[category] || 'blue';
  return COLOR_MAP[key] || DEFAULT_COLOR;
}

export function formatName(filename, category) {
  let name = filename.replace(/\.md$/i, '');
  if (name.startsWith(category + '-')) name = name.slice(category.length + 1);
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function formatCategory(cat) {
  return cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function timeAgo(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export const CATEGORY_ICONS = {
  engineering: '⚙️',
  design: '🎨',
  product: '📦',
  testing: '✅',
  support: '🛠️',
  'project-management': '📋',
  specialized: '🔬',
  strategy: '🧭',
  'game-development': '🎮',
  general: '📄',
};
