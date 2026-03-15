import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

export default function AgentDetail({ agent, data, loading }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!data?.content) return;
    try {
      await navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = data.content;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const name = formatName(agent.filename, agent.category);
  const category = formatCategory(agent.category);

  return (
    <div className="agent-detail">
      {/* Header */}
      <div className="agent-header">
        <div className="agent-meta">
          <span className="category-badge">{category}</span>
          <h2 className="agent-name">{name}</h2>
          {data?.description && !loading && (
            <p className="agent-desc">{data.description}</p>
          )}
        </div>

        <div className="header-actions">
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={copy}
            disabled={!data?.content || loading}
          >
            {copied ? '✓ Copied to clipboard!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>

      {/* How to use box */}
      {!loading && data?.content && (
        <div className="how-to-use">
          <strong>How to use:</strong> In Claude Code, say{' '}
          <code>"Activate {name} mode"</code> — or paste the copied prompt directly
          into Claude.ai, Cursor, or any other AI assistant.
        </div>
      )}

      {/* Content */}
      <div className="agent-content">
        {loading && (
          <div className="loading-agent">
            <div className="spinner" />
            Loading agent...
          </div>
        )}

        {!loading && data?.error && (
          <div className="content-error">{data.error}</div>
        )}

        {!loading && data?.content && (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {data.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
