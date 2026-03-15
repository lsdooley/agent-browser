import { useState } from 'react';
import { formatName, formatCategory, getCategoryColor, timeAgo, CATEGORY_ICONS } from '../utils.js';

export default function Sidebar({ categories, selected, onSelect }) {
  // All collapsed by default
  const [open, setOpen] = useState({});
  const toggle = (cat) => setOpen(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <nav className="nav">
      {Object.entries(categories)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([cat, agents]) => {
          const color = getCategoryColor(cat);
          const isOpen = !!open[cat];
          return (
            <div key={cat} className="cat-group">
              <button
                className={`cat-header ${isOpen ? 'open' : ''}`}
                style={{ '--cat-accent': color.accent }}
                onClick={() => toggle(cat)}
              >
                <span className="cat-icon">{CATEGORY_ICONS[cat] || '📁'}</span>
                <span className="cat-label">{formatCategory(cat)}</span>
                <span className="cat-count">{agents.length}</span>
                <span className="cat-chevron">{isOpen ? '▾' : '▸'}</span>
              </button>

              {isOpen && (
                <ul className="agent-list">
                  {[...agents]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(agent => {
                      const isActive = selected?.key === agent.key;
                      return (
                        <li key={agent.key}>
                          <button
                            className={`agent-card ${isActive ? 'active' : ''}`}
                            style={{ '--cat-accent': color.accent }}
                            onClick={() => onSelect(agent)}
                          >
                            <span className="agent-emoji">{agent.emoji || '🤖'}</span>
                            <div className="agent-card-body">
                              <div className="agent-card-name">
                                {agent.name || formatName(agent.filename, agent.category)}
                              </div>
                              {agent.vibe && (
                                <div className="agent-card-vibe">{agent.vibe}</div>
                              )}
                              {agent.lastModified && (
                                <div className="agent-card-meta">
                                  Updated {timeAgo(agent.lastModified)}
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          );
        })}
    </nav>
  );
}
