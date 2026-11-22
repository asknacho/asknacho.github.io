// Bridge Claude Desktop's stdio MCP to Nacho's stateless Streamable HTTP MCP.
// The endpoint is deliberately fixed: this extension only connects to this service.
const readline = require('node:readline');
const endpoint = 'https://mcp.asknacho.to/mcp';
let protocolVersion;

async function forward(line) {
  let message;
  try {
    message = JSON.parse(line);
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
    if (protocolVersion) headers['MCP-Protocol-Version'] = protocolVersion;
    const response = await fetch(endpoint, {
      method: 'POST', headers, body: JSON.stringify(message), signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.status === 202) return;
    const result = await response.json();
    if (message.method === 'initialize' && result.result?.protocolVersion) protocolVersion = result.result.protocolVersion;
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    if (message && Object.hasOwn(message, 'id')) {
      process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: `Could not reach Nacho's profile: ${error.message}` } })}\n`);
    } else {
      console.error(`Ask Nacho connector: ${error.message}`);
    }
  }
}

readline.createInterface({ input: process.stdin }).on('line', line => { void forward(line); });
