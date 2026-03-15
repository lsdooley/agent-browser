const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME;
const AGENTS_PREFIX = 'agents/';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return { meta, body: content.slice(match[0].length).trim() };
}

function extractDescription(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const t = line.trim();
    // Skip headings, horizontal rules, table rows, code fences, empty lines
    if (!t || t.startsWith('#') || t.startsWith('|') || t.startsWith('```') || t.startsWith('---') || t.startsWith('===')) continue;
    // Strip leading markdown symbols (blockquote, bold markers, etc.)
    const clean = t.replace(/^[>*_`~]+\s*/, '').trim();
    if (clean.length > 30) return clean.slice(0, 220);
  }
  return '';
}

async function listAllObjects(prefix) {
  const items = [];
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: token,
    }));
    items.push(...(res.Contents || []));
    token = res.NextContinuationToken;
  } while (token);
  return items;
}

const json = (statusCode, body) => ({
  statusCode,
  headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || 'GET';
  const path = event.rawPath || '/';

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    // GET /api/agents — list all agents
    if (path === '/api/agents') {
      const objects = await listAllObjects(AGENTS_PREFIX);
      const agents = objects
        .filter(o => o.Key.endsWith('.md'))
        .map(o => {
          const rel = o.Key.slice(AGENTS_PREFIX.length); // e.g. "engineering/engineering-frontend-developer.md"
          const parts = rel.split('/');
          const category = parts.length > 1 ? parts[0] : 'general';
          const filename = parts[parts.length - 1];
          const name = formatName(filename, category);
          return { key: rel, category, filename, name };
        })
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

      return json(200, agents);
    }

    // GET /api/agents/{key} — get full agent content
    if (path.startsWith('/api/agents/')) {
      const agentKey = decodeURIComponent(path.slice('/api/agents/'.length));
      const s3Key = AGENTS_PREFIX + agentKey;

      const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }));
      const content = await res.Body.transformToString('utf-8');
      const { meta, body } = parseFrontmatter(content);
      const description = meta.description || extractDescription(body);

      return json(200, { content, meta, description });
    }

    return json(404, { error: 'Not found' });

  } catch (err) {
    console.error('Error:', err);
    if (err.name === 'NoSuchKey') return json(404, { error: 'Agent not found' });
    return json(500, { error: 'Internal server error' });
  }
};
