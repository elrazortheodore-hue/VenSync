export default async function handler(req, res) {
  const BIN_ID = process.env.JSONBIN_ID;
  const BIN_KEY = process.env.JSONBIN_KEY;

  try {
    const configCheck = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': BIN_KEY }
    });
    
    if (configCheck.ok) {
      const configData = await configCheck.json();
      if (configData.record.isPublicEnabled === false) {
        // Intercept and redirect to Sudo Mode trap
        return res.redirect(307, '/private');
      }
    }
  } catch (err) {
    // Failsafe lockdown
    return res.redirect(307, '/private');
  }

  // If public broadcast is enabled, render the HTML natively from memory
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>VenSync | Public Mode</title>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#030303">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta name="mobile-web-app-capable" content="yes">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="aurora-bg"></div>
  <div id="toast">SECURE</div>

  <div id="app-container">
    <div id="screen-loading">
      <div class="logo-wordmark">VenSync</div>
      <p style="color: var(--text-dim); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;">Public Broadcast</p>
      <div class="pulse-dot" style="margin-top: 20px;"></div>
    </div>

    <div id="screen-main" style="display: none; flex-direction: column; height: 100%; width: 100%; background: transparent;">
      <div class="status-bar glass-panel">
        <div class="status-left">
          <div class="wordmark-small"><i data-lucide="box" width="14" height="14" style="display:inline; vertical-align:text-bottom; margin-right:4px;"></i>VenSync</div>
        </div>
        <div class="clock" id="clock">00:00:00</div>
        <div class="status-right" title="Live Sync">
          <div id="connection-dot" class="connection-dot"></div>
          <span id="connection-text">Live Sync</span>
        </div>
      </div>

      <div class="pinned-header glass-panel" id="pinned-toggle">
        <span>Pinned Assets</span>
        <i data-lucide="chevron-down" id="pinned-icon" width="14" height="14" style="transition: transform 0.3s ease;"></i>
      </div>
      <div class="pinned-panel glass-panel" id="pinned-panel">
        <div class="pinned-grid" id="pinned-grid"></div>
      </div>

      <div class="sync-pad" id="sync-pad">
        <div class="empty-state" id="empty-state">
          <i data-lucide="database" width="32" height="32" style="opacity: 0.3;"></i>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Awaiting Data</span>
        </div>
      </div>

      <div class="input-bar glass-panel">
        <div class="textarea-wrapper">
          <textarea id="msg-input" placeholder="Paste asset link or text data..." rows="1"></textarea>
        </div>
        <button id="btn-send" class="send-btn" disabled>
          <i data-lucide="arrow-up" width="20" height="20"></i>
        </button>
      </div>
    </div>
  </div>

  <script src="/js/public.js"></script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
