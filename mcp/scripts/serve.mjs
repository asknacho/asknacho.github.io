import app from '../src/index.js';
const port = Number(process.env.PORT || 3100);
app.listen(port, '127.0.0.1', () => console.log(`Nacho MCP: http://127.0.0.1:${port}/mcp`));
