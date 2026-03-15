import { useState, useEffect } from 'react';

function formatName(filename, category) {
  let name = filename.replace('.md', '');
  if (name.startsWith(category + '-')) {
    name = name.slice(category.length + 1);
  }
  return name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatCategory(cat) {
  return cat
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const CATEGORY_ICONS = {
  engineering: '⚙️',
  design: '🎨',
  product: '📦',
  testing: '✅',
  support: '🛠',
  'project-management': '📋',
  specialized: '🔬',
  strategy: '🧭',
  'game-development': '🎮',
  general: '📄',
};

export default function Sidebar({ categories, selected, onSelect }) {
  const [open, setOpen] = useState({});

  // Auto-open all categories on first load
  useEffect(() => {
    const initial = {};
    Object.keys(categories).forEach(c => { initial[c] = true; });
    setOpen(prev => ({ ...initial, ...prev }));
  }, [Object.keys(categories).join(',')]);

  const toggle = (cat) => setOpen(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <nav className="nav">
      {Object.entries(categories)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([cat, agents]) => (
          <div key={cat} className="category">
            <button className="category-header" onClick={() => toggle(cat)}>
              <span className="cat-icon">{CATEGORY_ICONS[cat] || '📁'}</span>
              <span className="cat-name">{formatCategory(cat)}</span>
              <span className="cat-count">{agents.length}</span>
              <span className="chevron">{open[cat] ? '▾' : '▸'}</span>
            </button>

            {open[cat] && (
              <ul className="agent-list">
                {[...agents]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(agent => (
                    <li key={agent.key}>
                      <button
                        className={`agent-item ${selected?.key === agent.key ? 'active' : ''}`}
                        onClick={() => onSelect(agent)}
                        title={agent.name}
                      >
                        {formatName(agent.filename, agent.category)}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}
    </nav>
  );
}
