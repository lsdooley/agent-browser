import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import AgentDetail from './components/AgentDetail.jsx';
import RobotIcon from './components/RobotIcon.jsx';
import './App.css';

export default function App() {
  const [manifest, setManifest] = useState(null);
  const [selected, setSelected] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const activeKeyRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

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
    if (selected?.key === agent.key) { setSidebarOpen(false); return; }
    setSelected(agent);
    setAgentData(null);
    setLoadingAgent(true);
    setSidebarOpen(false); // auto-close on mobile after selection
    activeKeyRef.current = agent.key;
    try {
      const encodedKey = agent.key.split('/').map(encodeURIComponent).join('/');
      const res = await fetch(`/api/agents/${encodedKey}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (activeKeyRef.current === agent.key) {
        setAgentData(data);
        setLoadingAgent(false);
      }
    } catch (err) {
      if (activeKeyRef.current === agent.key) {
        setAgentData({ error: `Failed to load agent: ${err.message}` });
        setLoadingAgent(false);
      }
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

      {/* Mobile top bar */}
      <div className="mobile-bar">
        <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <span/><span/><span/>
        </button>
        <div className="mobile-title">
          <RobotIcon size={20}/>
          Agent Browser
        </div>
        <button className="dark-toggle" onClick={() => setDark(d => !d)}
          title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-logo"><RobotIcon size={22}/></span>
            <div className="brand-text">
              <div className="brand-name">Agent Browser</div>
              {manifest && (
                <div className="brand-meta">
                  {agents.length} agents · {totalCategories} categories
                </div>
              )}
            </div>
            <button className="dark-toggle" onClick={() => setDark(d => !d)}
              title={dark ? 'Light mode' : 'Dark mode'}>
              {dark ? '☀️' : '🌙'}
            </button>
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
              <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">✕</button>
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
            <Sidebar categories={categories} selected={selected} onSelect={selectAgent} search={search} />
          )}
        </div>

        <SidebarFooter manifest={manifest} onAbout={() => setAboutOpen(true)} />
      </aside>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

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
        <div className="welcome-glyph"><RobotIcon size={40}/></div>
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
          Select any agent to view its full prompt. Use <strong>Copy Prompt</strong> to paste into Claude.ai, Cursor, or any AI tool.
        </span>
      </div>

      <SyncCard />
    </div>
  );
}

function SidebarFooter({ manifest, onAbout }) {
  const lastSynced = manifest?.generated
    ? new Date(manifest.generated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="sidebar-footer">
      <div className="sf-top">
        <span className="sf-version">v1.0.0</span>
        {lastSynced && <span className="sf-synced">Synced {lastSynced}</span>}
      </div>
      <div className="sf-links">
        <a
          className="sf-link"
          href="https://github.com/lsdooley/agent-browser"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <span className="sf-dot">·</span>
        <button className="sf-link sf-link-btn" onClick={onAbout}>About this app</button>
      </div>
    </div>
  );
}

function AboutModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="about-title">
        <div className="modal-header">
          <div className="modal-title" id="about-title">About Agent Browser</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <p>
            Agent Browser is a personal productivity tool built to organize, explore, and put to work the growing library
            of Claude Code specialist agents installed on your Mac. It started with a simple question: after accumulating
            dozens of carefully crafted AI agent personality files, how do you actually remember what you have, what each
            one does, and how to quickly put one to work?
          </p>

          <h3>What It Does</h3>
          <p>
            At its core, Agent Browser is a polished web interface that sits in front of the agent Markdown files stored
            locally at <code>~/.claude/agents/</code>. Each of those files is a self-contained AI persona — a set of
            instructions that transforms Claude Code into a specialized expert: a seasoned software architect, a meticulous
            QA engineer, a sharp product manager, a creative game developer, and dozens more spanning ten categories.
          </p>
          <p>
            The app lets you browse all installed agents organized by category, read their full prompts, understand their
            personality and focus through metadata like their emoji, vibe, and description, and copy their entire prompt
            to the clipboard with a single click — ready to paste into Claude.ai, Cursor, or any other AI tool.
          </p>

          <h3>How It Works</h3>
          <p>
            The app runs on a serverless AWS architecture designed to stay entirely within the AWS free tier. On the back
            end, a Node.js Lambda function serves the API, reading agent data from an S3 bucket. A CloudFront distribution
            sits in front of everything, routing <code>/api/*</code> requests to API Gateway and serving the React
            frontend from S3 for all other paths.
          </p>
          <p>
            The frontend loads a single <code>agents-manifest.json</code> file on startup — a pre-built index of all
            installed agents with their names, categories, metadata, and file sizes. This manifest approach means the page
            loads with one S3 read rather than hundreds of individual file requests. When you select an agent, its full
            Markdown file is fetched on demand and rendered with GitHub Flavored Markdown support, including code blocks,
            tables, emoji shortcodes, and all the rich formatting the agent prompts use.
          </p>

          <h3>The Sync Workflow</h3>
          <p>
            Because the source of truth for agents lives on your Mac (<code>~/.claude/agents/</code>), the app includes
            a sync mechanism to push local changes to the cloud. Running <code>npm run sync</code> from the project
            directory walks the local agents folder, parses every Markdown file's frontmatter for metadata, builds a
            fresh manifest, and uploads everything to S3. Running <code>npm run deploy:frontend</code> builds the React
            app and deploys it to S3 with a CloudFront cache invalidation. Both commands are shown on the welcome screen
            so they're always easy to find.
          </p>

          <h3>Technical Stack</h3>
          <ul>
            <li><strong>Frontend:</strong> React 18 + Vite 5, react-markdown, remark-gfm, remark-emoji</li>
            <li><strong>Backend:</strong> AWS Lambda (Node.js 20), API Gateway HTTP API v2</li>
            <li><strong>Storage &amp; CDN:</strong> Amazon S3 (static files + agent content), CloudFront with OAC</li>
            <li><strong>Infrastructure:</strong> AWS SAM for repeatable, version-controlled deployments</li>
            <li><strong>Source:</strong> GitHub — <a href="https://github.com/lsdooley/agent-browser" target="_blank" rel="noopener noreferrer">lsdooley/agent-browser</a></li>
          </ul>

          <h3>Design Decisions</h3>
          <p>
            Category-based color theming gives each section of the sidebar a distinct identity, making navigation feel
            natural even with many agents. The sidebar collapses all categories by default but auto-expands them during
            search, so filtering never hides relevant results. Dark mode is persistent across sessions. On mobile, the
            sidebar slides in as a full overlay and auto-closes when you select an agent. A custom robot icon — indigo
            boxy head, cyan binocular eyes, RGB indicator lights — ties the visual identity together across the favicon,
            sidebar brand, and welcome screen.
          </p>
          <p>
            The app intentionally stays lean. There is no database, no authentication, no user accounts. It is a
            single-owner tool built for one workflow: give every AI specialist in your roster a face, a description, and
            a one-click copy path to wherever you need it.
          </p>
        </div>
      </div>
    </div>
  );
}

function SyncCard() {
  const [copied, setCopied] = useState(null);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const commands = [
    {
      key: 'sync',
      label: 'Sync agents from your Mac',
      description: 'Run this whenever you install, remove, or update agents locally.',
      cmd: 'cd ~/projects/agent-browser && npm run sync',
    },
    {
      key: 'deploy',
      label: 'Deploy UI changes',
      description: 'Run this after making any changes to the app code.',
      cmd: 'cd ~/projects/agent-browser && npm run deploy:frontend',
    },
  ];

  return (
    <div className="sync-card">
      <div className="sync-card-header">
        <span className="sync-card-icon">📡</span>
        <div>
          <div className="sync-card-title">Keeping Agents Up to Date</div>
          <div className="sync-card-subtitle">Run these commands from your Mac terminal</div>
        </div>
      </div>

      <div className="sync-commands">
        {commands.map(({ key, label, description, cmd }) => (
          <div key={key} className="sync-command">
            <div className="sync-command-meta">
              <div className="sync-command-label">{label}</div>
              <div className="sync-command-desc">{description}</div>
            </div>
            <div className="sync-command-row">
              <code className="sync-code">{cmd}</code>
              <button
                className={`sync-copy ${copied === key ? 'copied' : ''}`}
                onClick={() => copy(cmd, key)}
              >
                {copied === key ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="sync-card-footer">
        After syncing, refresh the page to see your updated agent list.
      </div>
    </div>
  );
}
