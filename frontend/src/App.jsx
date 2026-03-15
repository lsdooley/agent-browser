import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import AgentDetail from './components/AgentDetail.jsx';
import './App.css';

export default function App() {
  const [manifest, setManifest] = useState(null);
  const [selected, setSelected] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/agents')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (!data?.agents) throw new Error('Unexpected response format');
        setManifest(data);
        setLoadingList(false);
      })
      .catch(err => {
        setError(`Could not load agents: ${err.message}`);
        setLoadingList(false);
      });
  }, []);

  const selectAgent = async (agent) => {
    if (selected?.key === agent.key) return;
    setSelected(agent);
    setAgentData(null);
    setLoadingAgent(true);
    try {
      // Encode each path segment individually so slashes in the key are preserved
      const encodedKey = agent.key.split('/').map(encodeURIComponent).join('/');
      const res = await fetch(`/api/agents/${encodedKey}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgentData(data);
    } catch (err) {
      setAgentData({ error: `Failed to load agent: ${err.message}` });
    } finally {
      setLoadingAgent(false);
    }
  };

  const agents = manifest?.agents || [];
  const filtered = search.trim()
    ? agents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase()) ||
        a.vibe?.toLowerCase().includes(search.toLowerCase())
      )
    : agents;

  const categories = {};
  filtered.forEach(a => {
    if (!categories[a.category]) categories[a.category] = [];
    categories[a.category].push(a);
  });

  const totalCategories = [...new Set(agents.map(a => a.category))].length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-logo">⚡</span>
            <div>
              <div className="brand-name">Agent Browser</div>
              {manifest && (
                <div className="brand-meta">
                  {agents.length} agents · {totalCategories} categories
                </div>
              )}
            </div>
          </div>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search"
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              spellCheck={false}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>

        <div className="nav-scroll">
          {loadingList && <div className="sidebar-msg">Loading agents...</div>}
          {error && <div className="sidebar-msg error">{error}</div>}
          {!loadingList && !error && Object.keys(categories).length === 0 && (
            <div className="sidebar-msg">No agents match "{search}"</div>
          )}
          {!loadingList && !error && (
            <Sidebar categories={categories} selected={selected} onSelect={selectAgent} />
          )}
        </div>
      </aside>

      <main className="main">
        {!selected && !loadingList && (
          <Welcome agents={agents} categories={totalCategories} manifest={manifest} />
        )}
        {selected && (
          <AgentDetail agent={selected} data={agentData} loading={loadingAgent} />
        )}
      </main>
    </div>
  );
}

function Welcome({ agents, categories, manifest }) {
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-glyph">⚡</div>
        <h1>Agent Browser</h1>
        <p>Your complete Claude Code specialist roster. Browse agents, explore their capabilities, and copy their prompts to use anywhere.</p>
      </div>
      <div className="welcome-stats">
        <div className="w-stat">
          <span className="w-num">{agents.length}</span>
          <span className="w-label">Agents</span>
        </div>
        <div className="w-divider" />
        <div className="w-stat">
          <span className="w-num">{categories}</span>
          <span className="w-label">Categories</span>
        </div>
        {manifest?.generated && (
          <>
            <div className="w-divider" />
            <div className="w-stat">
              <span className="w-num" style={{ fontSize: '14px' }}>
                {new Date(manifest.generated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="w-label">Last Synced</span>
            </div>
          </>
        )}
      </div>
      <div className="welcome-tip">
        <span className="tip-icon">💡</span>
        <span>
          Select any agent to view its full prompt. Use <strong>Copy to Clipboard</strong> to paste it into Claude.ai, Cursor, or any other AI tool.
        </span>
      </div>
    </div>
  );
}
