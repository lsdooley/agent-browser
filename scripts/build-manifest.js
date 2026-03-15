#!/usr/bin/env node
/**
 * Reads all .md files from ~/.claude/agents/, parses frontmatter,
 * and uploads a single agents-manifest.json to S3.
 * Called automatically by sync-agents.sh.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AGENTS_DIR = path.join(process.env.HOME, '.claude', 'agents');
const STACK_NAME = 'agent-browser';

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return meta;
}

function formatName(filename, category) {
  let name = filename.replace('.md', '');
  if (name.startsWith(category + '-')) name = name.slice(category.length + 1);
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function extractDescription(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('|') || t.startsWith('```') || t.startsWith('---')) continue;
    const clean = t.replace(/^[>*_`~]+\s*/, '').trim();
    if (clean.length > 30) return clean.slice(0, 200);
  }
  return '';
}

function walkDir(dir, base = '') {
  if (!fs.existsSync(dir)) return [];
  const entries = [];
  for (const item of fs.readdirSync(dir)) {
    if (item.startsWith('.')) continue;
    const fullPath = path.join(dir, item);
    const relPath = base ? `${base}/${item}` : item;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      entries.push(...walkDir(fullPath, relPath));
    } else if (item.endsWith('.md')) {
      entries.push({ fullPath, relPath, mtime: stat.mtime.toISOString(), size: stat.size });
    }
  }
  return entries;
}

// Look up S3 bucket from CloudFormation
let bucket;
try {
  bucket = execSync(
    `aws cloudformation describe-stacks --stack-name ${STACK_NAME} ` +
    `--query 'Stacks[0].Outputs[?OutputKey==\`BucketName\`].OutputValue' --output text`,
    { stdio: ['pipe', 'pipe', 'pipe'] }
  ).toString().trim();
} catch (e) {
  console.error(`ERROR: Could not find stack '${STACK_NAME}'. Deploy the backend first.`);
  process.exit(1);
}

if (!bucket) {
  console.error('ERROR: Bucket name not found in stack outputs.');
  process.exit(1);
}

console.log('Building agent manifest...');

const files = walkDir(AGENTS_DIR);
const agents = files.map(({ fullPath, relPath, mtime, size }) => {
  const parts = relPath.split('/');
  const category = parts.length > 1 ? parts[0] : 'general';
  const filename = parts[parts.length - 1];

  let meta = {};
  let description = '';
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    meta = parseFrontmatter(content);
    // Strip frontmatter to get body for description fallback
    const body = content.replace(/^---[\s\S]*?---\n?/, '').trim();
    description = meta.description || extractDescription(body);
  } catch (e) {
    // skip unreadable files
  }

  return {
    key: relPath,
    category,
    filename,
    name: (meta.name || formatName(filename, category)).trim(),
    emoji: meta.emoji?.trim() || null,
    vibe: meta.vibe?.trim() || null,
    color: meta.color?.trim() || null,
    description: description?.trim() || null,
    lastModified: mtime,
    size,
  };
}).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

const manifest = {
  generated: new Date().toISOString(),
  count: agents.length,
  agents,
};

const tmpFile = '/tmp/agents-manifest.json';
fs.writeFileSync(tmpFile, JSON.stringify(manifest));

// Validate bucket name before shell interpolation (defensive check)
if (!/^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$/.test(bucket)) {
  console.error(`ERROR: Unexpected bucket name format: ${bucket}`);
  process.exit(1);
}

execSync(`aws s3 cp ${tmpFile} s3://${bucket}/agents-manifest.json --content-type "application/json" --cache-control "no-cache"`);

console.log(`✓ Manifest built: ${agents.length} agents across ${[...new Set(agents.map(a => a.category))].length} categories`);
