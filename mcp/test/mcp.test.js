import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import app, { documents } from '../src/index.js';

let listener, origin, client;
const data = response => JSON.parse(response.content[0].text);
before(async () => {
  listener = app.listen(0, '127.0.0.1');
  await new Promise(resolve => listener.once('listening', resolve));
  origin = `http://127.0.0.1:${listener.address().port}`;
  client = new Client({name: 'nacho-integration-test', version: '1.0.0'});
  await client.connect(new StreamableHTTPClientTransport(new URL('/mcp', origin)));
});
after(async () => {
  await client?.close();
  await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
});

test('an MCP client discovers read-only tools and retrieves the career and source index', async () => {
  const tools = await client.listTools();
  assert.deepEqual(tools.tools.map(t => t.name).sort(), ['get_profile', 'list_documents', 'read_document', 'search_documents']);
  assert.ok(tools.tools.every(t => t.annotations.readOnlyHint && !t.annotations.destructiveHint));
  const profile = data(await client.callTool({name: 'get_profile', arguments: {}}));
  assert.match(profile.career.content, /G2 · 2026/);
  assert.match(profile.career.content, /13 people/);
  assert.match(profile.career.content, /Chalk Daily Fantasy Sports/);
  assert.match(profile.career.content, /Audio engineer by training/);
  assert.doesNotMatch(profile.career.content, /Copy endpoint|MCP preview|Paste your role/);
  assert.match(profile.profile.content, /fictional/);
  assert.equal(profile.sources.length, 10);
});

test('all allowlisted sources are readable over MCP and plain HTTP', async () => {
  const index = data(await client.callTool({name: 'list_documents', arguments: {}}));
  for (const entry of index) {
    const actual = data(await client.callTool({name: 'read_document', arguments: {id: entry.id}}));
    const original = documents.find(d => d.id === entry.id);
    assert.equal(actual.content, original.content);
    assert.equal(actual.sha256, original.sha256);
    const plain = await fetch(new URL(entry.path, origin));
    assert.equal(plain.status, 200);
    assert.equal(await plain.text(), original.content);
  }
});

test('published source data has only public personal links and no credential or internal-ticket patterns', () => {
  const publicHosts = new Set(['asknacho.to', 'scorepace.com', 'tonelab.asknacho.to', 'linehaus.asknacho.to']);
  for (const doc of documents) {
    for (const match of doc.content.matchAll(/https?:\/\/[^\s)>"'`]+/g)) {
      assert.ok(publicHosts.has(new URL(match[0]).hostname), `Unreviewed source URL in ${doc.id}`);
    }
    assert.doesNotMatch(doc.content, /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bAKIA[A-Z0-9]{16}\b/, `Credential pattern in ${doc.id}`);
    assert.doesNotMatch(doc.content, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, `Personal or company email in ${doc.id}`);
    assert.doesNotMatch(doc.content, /\b[A-Z][A-Z0-9]{1,9}-\d{2,}\b/, `Possible internal ticket in ${doc.id}`);
  }
  // The guidance must stay generic; approved employer names belong in the CV/profile.
  for (const doc of documents.filter(d => d.sourceFile.includes('/guidance/'))) {
    assert.doesNotMatch(doc.content, /\b(?:G2|Gartner|Thoughtworks|Chalk)\b/);
  }
});

test('unknown IDs cannot read arbitrary repository files', async () => {
  const response = await client.callTool({name: 'read_document', arguments: {id: '../../.git/config'}});
  assert.equal(response.isError, true);
  for (const path of ['/content/guidance/AGENTS.md', '/src/index.js', '/.git/config']) {
    assert.equal((await fetch(new URL(path, origin))).status, 404);
  }
});

test('search returns source evidence, handles missing evidence, and bounds results', async () => {
  const [leadership, unknown] = await Promise.all([
    client.callTool({name: 'search_documents', arguments: {query: 'delegated ownership', limit: 3}}),
    client.callTool({name: 'search_documents', arguments: {query: 'zznonexistentcompetencyxx'}}),
  ]);
  assert.ok(data(leadership).matches.some(hit => hit.id === 'career' || hit.id === 'profile'));
  assert.ok(data(leadership).matches.length <= 3);
  assert.ok(data(leadership).matches.every(hit => hit.evidenceType && hit.sha256));
  assert.deepEqual(data(unknown).matches, []);
  const invalid = await client.callTool({name: 'search_documents', arguments: {query: 'lead', limit: 1000}});
  assert.equal(invalid.isError, true);
});

test('resources and the fit prompt preserve evidence limits', async () => {
  const resources = await client.listResources();
  assert.equal(resources.resources.length, 10);
  const calibration = await client.readResource({uri: 'nacho://documents/calibration'});
  assert.match(calibration.contents[0].text, /fictional/);
  const prompt = await client.getPrompt({name: 'assess_fit', arguments: {requirements: 'Lead a small product engineering team'}});
  assert.match(prompt.messages[0].content.text, /gaps in the evidence/);
  assert.match(prompt.messages[0].content.text, /Lead a small product engineering team/);
});

test('MCP metadata and discovery are reachable without serving the website', async () => {
  assert.equal((await fetch(new URL('/health', origin))).status, 200);
  const root = await fetch(origin);
  assert.match(root.headers.get('content-type'), /application\/json/);
  const info = await root.json();
  assert.equal(info.endpoint, '/mcp');
  assert.equal(info.website, 'https://asknacho.to/');
  for (const path of ['/index.html', '/assets/mcp.js', '/assets/favicon.png']) {
    assert.equal((await fetch(new URL(path, origin))).status, 404);
  }
  assert.match(await (await fetch(new URL('/llms.txt', origin))).text(), /Read-only MCP: \/mcp/);
  const get = await fetch(new URL('/mcp', origin));
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('allow'), 'POST');
  const oldEndpoint = await fetch(new URL('/api/mcp', origin), {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{}',
  });
  assert.equal(oldEndpoint.status, 404);
});
