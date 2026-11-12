import { readFile, writeFile } from 'node:fs/promises';

// The site remains the source of truth for career information.
const source = new URL('../../index.html', import.meta.url);
const html = await readFile(source, 'utf8');
const workStart = html.indexOf('<section class="scene scene--code"');
const guitarStart = html.indexOf('<section class="scene scene--guitar"');
const work = html.slice(workStart, html.indexOf('</section>', workStart) + 10)
  + html.slice(guitarStart, html.indexOf('<section class="bcn"'));
if (!work.includes('View career history') || !work.includes('Thoughtworks')) {
  throw new Error('Website career structure changed; review the extraction before updating the snapshot.');
}
const text = work
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<canvas\b[^>]*>[\s\S]*?<\/canvas>/g, '')
  .replace(/<h[23][^>]*>/g, '\n\n## ')
  .replace(/<li>\s*<div class="quest-role">/g, '\n\n### ')
  .replace(/<li[^>]*>/g, '\n- ')
  .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '$2 ($1)')
  .replace(/<\/(?:p|div|h[23]|summary|footer|li)>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .split('\n').map(line => line.trim()).filter(Boolean).join('\n\n');
await writeFile(new URL('../content/career.md', import.meta.url),
  '# Career, credentials, and projects\n\nSource: https://asknacho.to/ (repository index.html). Self-reported career information; the teammate quotation is an anonymously attributed testimonial.\n\n' + text + '\n');
console.log('Updated the career snapshot from index.html.');
