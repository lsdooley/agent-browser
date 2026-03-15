import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import AgentDetail from './components/AgentDetail.jsx';
import './App.css';

export default function App() {
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(data => {
        setAgents(data);
        setLoadingList(false);
      })
      .catch(err => {
        setError('Could not load agents. Is the app deployed?');
        setLoadingList(false);
      });
  }, []);

  const selectAgent = async (agent) => {
    if (selected?.key === agent.key) return;
    setSelected(agent);
    setAgentData(null);
    setLoadingAgent(true);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agent.key)}`);
      const data = await res.json();
      setAgentData(data);
    } catch (err) {
      setAgentData({ error: 'Failed to load agent content.' });
    } finally {
      setLoadingAgent(false);
    }
  };

  // Filter and group by category
  const filtered = search.trim()
    ? agents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
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
            <span className="brand-icon">⚡</span>
            <span className="brand-name">Agent Browser</span>
          </div>
          <div className="agent-stats">
            {agents.length} agents &middot; {totalCategories} categories
          </div>
          <input
            className="search"
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="nav-scroll">
          {loadingList && <div className="sidebar-status">Loading agents...</div>}
          {error && <div className="sidebar-status error">{error}</div>}
          {!loadingList && !error && (
            <Sidebar
              categories={categories}
              selected={selected}
              onSelect={selectAgent}
            />
          )}
          {!loadingList && !error && filtered.length === 0 && (
            <div className="sidebar-status">No agents match "{search}"</div>
          )}
        </div>
      </aside>

      <main className="main">
        {!selected && !loadingList && (
          <div className="welcome">
            <div className="welcome-icon">⚡</div>
            <h2>Claude Code Agent Browser</h2>
            <p>
              Browse your installed Claude Code agent specialists. Select an agent
              to read its full instructions, understand its capabilities, and copy
              its prompt to use in any application.
            </p>
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-num">{agents.length}</span>
                <span className="stat-label">Agents</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{totalCategories}</span>
                <span className="stat-label">Categories</span>
              </div>
            </div>
            <div className="welcome-tip">
              <strong>Tip:</strong> Use <kbd>sync-agents.sh</kbd> on your Mac to keep
              this list up to date with your local <code>~/.claude/agents/</code> folder.
            </div>
          </div>
        )}
        {selected && (
          <AgentDetail
            agent={selected}
            data={agentData}
            loading={loadingAgent}
          />
        )}
      </main>
    </div>
  );
}
