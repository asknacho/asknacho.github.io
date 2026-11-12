(() => {
  const section = document.querySelector('[data-mcp-base]');
  if (!section) return;
  const base = section.dataset.mcpBase;
  if (base) {
    section.querySelector('#mcp-endpoint').value = `${base}/api/mcp`;
    section.querySelector('[data-copy="mcp-endpoint"]').disabled = false;
    section.querySelector('[data-mcp-document]').href = `${base}/documents/profile.md`;
  }
  for (const button of section.querySelectorAll('[data-copy]')) {
    button.addEventListener('click', async () => {
      const field = document.getElementById(button.dataset.copy);
      const status = section.querySelector('[role="status"]');
      try {
        await navigator.clipboard.writeText(field.value);
        status.textContent = button.dataset.copy === 'mcp-endpoint' ? 'Endpoint copied.' : 'Prompt copied.';
      } catch {
        field.focus();
        field.select();
        status.textContent = 'Text selected. Use your device’s copy command.';
      }
    });
  }
})();
