// Exercise the public custom domain or a protected preview with a real MCP client.
// Vercel CLI handles preview auth without extracting or printing credentials.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const deployment = process.argv[2] || 'https://mcp.asknacho.to';
if (!/^https:\/\/(?:mcp\.asknacho\.to|[a-z0-9-]+\.vercel\.app)$/.test(deployment)) {
  throw new Error('Usage: node scripts/smoke.mjs [https://mcp.asknacho.to | https://your-deployment.vercel.app]');
}
const protectedPreview = new URL(deployment).hostname.endsWith('.vercel.app');
async function authenticatedFetch(input, init = {}) {
  const url = new URL(typeof input === 'string' ? input : input.url || input.href);
  assert.equal(url.origin, deployment);
  const args = ['curl', url.pathname + url.search, '--deployment', deployment, '--scope', 'ignaciomaldonados-projects', '--', '--silent', '--show-error', '--max-time', '30', '--request', init.method || 'GET', '--write-out', '\n%{http_code}'];
  for (const [key, value] of new Headers(init.headers).entries()) args.push('--header', `${key}: ${value}`);
  if (init.body) args.push('--data-binary', '@-');
  const output = await new Promise((resolve, reject) => {
    const child = spawn('vercel', args, {stdio: ['pipe', 'pipe', 'pipe']});
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(`Vercel request failed (${code}): ${stderr}`)));
    child.stdin.end(init.body || '');
  });
  const boundary = output.lastIndexOf('\n');
  const status = Number(output.slice(boundary + 1));
  const body = output.slice(0, boundary);
  return new Response(status === 204 || status === 304 ? null : body, {status, headers: {'Content-Type': 'application/json'}});
}
const client = new Client({name: 'nacho-preview-smoke', version: '1.0.0'});
try {
  await client.connect(new StreamableHTTPClientTransport(new URL('/api/mcp', deployment), protectedPreview ? {fetch: authenticatedFetch} : {}));
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 4);
  const profile = JSON.parse((await client.callTool({name: 'get_profile', arguments: {}})).content[0].text);
  assert.equal(profile.sources.length, 10);
  assert.match(profile.career.content, /13 people/);
  const search = JSON.parse((await client.callTool({name: 'search_documents', arguments: {query: 'delegated ownership', limit: 3}})).content[0].text);
  assert.ok(search.matches.length > 0);
  const resources = await client.listResources();
  assert.equal(resources.resources.length, 10);
  const calibration = await client.readResource({uri: 'nacho://documents/calibration'});
  assert.match(calibration.contents[0].text, /fictional/);
  console.log(`PASS: ${protectedPreview ? 'protected preview' : 'public endpoint without authentication'} supports MCP initialization, four tools, full profile, search, ten resources, and resource retrieval.`);
} finally {
  await client.close();
}
