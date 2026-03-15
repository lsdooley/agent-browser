const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    // .trim() on both key and value strips trailing \r from Windows line endings
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: content.slice(match[0].length).trim() };
}

async function getS3Object(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return res.Body.transformToString('utf-8');
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
    // GET /api/agents — return full manifest
    if (path === '/api/agents') {
      const raw = await getS3Object('agents-manifest.json');
      const manifest = JSON.parse(raw);
      return json(200, manifest);
    }

    // GET /api/agents/{key} — return full agent content
    if (path.startsWith('/api/agents/')) {
      const agentKey = decodeURIComponent(path.slice('/api/agents/'.length));

      // Block path traversal — key must be a safe relative .md path
      if (agentKey.includes('..') || agentKey.startsWith('/') || !agentKey.endsWith('.md')) {
        return json(400, { error: 'Invalid agent key' });
      }

      const content = await getS3Object('agents/' + agentKey);
      const { meta, body } = parseFrontmatter(content);
      return json(200, { content, meta, body });
    }

    return json(404, { error: 'Not found' });

  } catch (err) {
    console.error('Error:', err);
    if (err.name === 'NoSuchKey') return json(404, { error: 'Agent not found' });
    return json(500, { error: 'Internal server error' });
  }
};
