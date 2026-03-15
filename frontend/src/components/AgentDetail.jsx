import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import { getCategoryColor, formatCategory, formatName, timeAgo, formatDate, formatSize } from '../utils.js';

// Convert Python-style unicode escapes that are stored as literal text in some agent files.
// e.g. \U0001F5FA\uFE0F → 🗺️
function preprocessMarkdown(text) {
  if (!text) return text;
  text = text.replace(/\\U([0-9A-Fa-f]{8})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
  text = text.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
  return text;
}

export default function AgentDetail({ agent, data, loading }) {
  const [copied, setCopied] = useState(false);

  // Use CATEGORY color for the header — not the agent's own color
  const color = getCategoryColor(agent.category);

  const copy = async () => {
    if (!data?.content) return;
    let success = false;
    try {
      await navigator.clipboard.writeText(data.content);
      success = true;
    } catch {
      // Fallback for browsers without Clipboard API
      try {
        const el = document.createElement('textarea');
        el.value = data.content;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        success = document.execCommand('copy');
        document.body.removeChild(el);
      } catch {
        success = false;
      }
    }
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const name = agent.name || formatName(agent.filename, agent.category);
  const category = formatCategory(agent.category);
  const emoji = agent.emoji || '🤖';

  return (
    <div className="detail">

      {/* ── Hero banner (category color) ────────────────────────────── */}
      <div className="detail-hero" style={{ background: color.gradient }}>
        <div className="hero-inner">
          <div className="hero-emoji">{emoji}</div>
          <div className="hero-text">
            <div className="hero-category">{category}</div>
            <h1 className="hero-name">{name}</h1>
            {agent.vibe && <p className="hero-vibe">"{agent.vibe}"</p>}
          </div>
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={copy}
            disabled={!data?.content || loading}
          >
            {copied ? '✓  Copied!' : '⎘  Copy Prompt'}
          </button>
        </div>
      </div>

      {/* ── Metadata cards row ───────────────────────────────────────── */}
      <div className="meta-row">
        {agent.lastModified && (
          <div className="meta-card">
            <div className="meta-card-label">Last Updated</div>
            <div className="meta-card-value" title={formatDate(agent.lastModified)}>
              {timeAgo(agent.lastModified)}
            </div>
          </div>
        )}
        {agent.size && (
          <div className="meta-card">
            <div className="meta-card-label">Prompt Size</div>
            <div className="meta-card-value">{formatSize(agent.size)}</div>
          </div>
        )}
        <div className="meta-card">
          <div className="meta-card-label">Category</div>
          <div className="meta-card-value">{category}</div>
        </div>
        {agent.description && (
          <div className="meta-card meta-card-wide">
            <div className="meta-card-label">Description</div>
            <div className="meta-card-value meta-card-desc">{agent.description}</div>
          </div>
        )}
      </div>

      {/* ── How to use ──────────────────────────────────────────────── */}
      {!loading && data?.body && (
        <div className="how-to-card" style={{ borderLeftColor: color.accent }}>
          <span className="how-to-icon">💡</span>
          <span>
            In Claude Code say <strong>"Activate {name} mode"</strong>, or use{' '}
            <strong>Copy Prompt</strong> to paste into Claude.ai, Cursor, or any AI tool.
          </span>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="detail-content">
        {loading && (
          <div className="loading-state">
            <div className="spinner" style={{ borderTopColor: color.accent }} />
            Loading agent...
          </div>
        )}

        {!loading && data?.error && (
          <div className="error-state">{data.error}</div>
        )}

        {/* Use data.body — frontmatter is already stripped */}
        {!loading && data?.body && (
          <div className="content-card">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkEmoji]}>
              {preprocessMarkdown(data.body)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
