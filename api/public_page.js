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
        // Enforce server-level redirect trap if public mode is off
        return res.redirect(307, '/private');
      }
    } else {
      return res.redirect(307, '/private');
    }
  } catch (err) {
    return res.redirect(307, '/private');
  }

  // Render the V4 Chat interface dynamically
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>VenSync</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<div class="app">

<!-- Sidebar backdrop for mobile -->
<div class="sb-backdrop" id="sbBackdrop" onclick="closeSidebar()"></div>

<!-- Sidebar -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-head">
    <div class="logo-mark">
      <svg viewBox="0 0 16 16"><path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1zm-1 9.4L4.6 8l1.1-1.1L7 9.2l3.3-3.3 1.1 1.1L7 10.4z"/></svg>
    </div>
    <span class="logo-text">VenSync</span>
    <button class="sb-close" onclick="closeSidebar()">
      <svg viewBox="0 0 16 16"><path d="M12.7 3.3a1 1 0 00-1.4 0L8 6.6 4.7 3.3a1 1 0 00-1.4 1.4L6.6 8l-3.3 3.3a1 1 0 001.4 1.4L8 9.4l3.3 3.3a1 1 0 001.4-1.4L9.4 8l3.3-3.3a1 1 0 000-1.4z"/></svg>
    </button>
  </div>

  <div class="sb-label">Channels</div>
  <div class="chat-list" id="chatList">
    <!-- Categories will be dynamically rendered here as channels -->
    <div class="chat-item active" onclick="selectCategory('all', this)"><span class="chat-dot"></span>SYS_ALL</div>
  </div>

  <div class="sb-foot">
    <div class="av">PUB</div>
    <div>
      <div class="u-name">Public Mode</div>
      <div class="u-status"><span class="u-dot"></span>Synced</div>
    </div>
  </div>
</aside>

<!-- Main panel -->
<main class="main">

  <!-- Topbar -->
  <div class="topbar">
    <button class="menu-btn" onclick="toggleSidebar()">
      <svg viewBox="0 0 16 16"><path d="M1 3h14v1.5H1zm0 4.5h14V9H1zM1 12h14v1.5H1z"/></svg>
    </button>
    <span class="topbar-title" id="topbarTitle">Public Sync Pad</span>
    
    <!-- Topbar search field -->
    <div class="search-wrap" id="searchWrap" style="display:none; flex:1; margin:0 10px;">
      <input type="text" id="searchInput" placeholder="Search public cards..." style="width:100%; padding:4px 8px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:12px; outline:none;" onkeyup="onSearch(this.value)">
    </div>

    <div class="topbar-actions">
      <div class="sync-badge"><span class="sync-dot"></span>Live</div>
      <button class="icon-btn" title="Share channel" onclick="copyShareLink()">
        <svg viewBox="0 0 16 16"><path d="M11 10.2a2.5 2.5 0 00-1.7.67L5.96 8.6a2.5 2.5 0 000-1.2l3.34-2.27A2.5 2.5 0 1011 3.5a2.49 2.49 0 00-1.7.67L5.96 6.44A2.5 2.5 0 103.5 10.5a2.49 2.49 0 001.7-.67l3.34 2.27A2.5 2.5 0 1011 10.2z"/></svg>
      </button>
      <button class="icon-btn" title="Search cards" id="searchBtn" onclick="toggleSearch()">
        <svg viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398l3.85 3.85a1 1 0 001.415-1.415l-3.868-3.833zm-5.242 1.156a5 5 0 110-10 5 5 0 010 10z"/></svg>
      </button>
      <a href="/private" class="icon-btn" title="Admin gateway door" style="text-decoration:none; display:flex; align-items:center; justify-content:center;">
        <svg viewBox="0 0 16 16" style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;"><path d="M9 3h4a1 1 0 011 1v8a1 1 0 01-1 1H9m-4-3l3-3-3-3m3 3H2"/></svg>
      </a>
    </div>
  </div>

  <!-- Messages / Cards thread -->
  <div class="messages" id="messages">
    <!-- Pagination Load Older button at top of chat thread -->
    <button id="loadOlderBtn" class="doc-btn" style="margin: 0 auto 10px; display: none; align-self: center;" onclick="loadOlderMessages()">Load Older Messages</button>
    <div id="msgEnd"></div>
  </div>

  <!-- Input zone -->
  <div class="input-zone">
    <div class="toolbar">
      <button class="tb-btn" onclick="triggerFileInput()" title="Attach document text file">
        <svg viewBox="0 0 16 16"><path d="M4.5 3a2.5 2.5 0 015 0v9a1.5 1.5 0 01-3 0V5a.5.5 0 011 0v7a.5.5 0 001 0V3a1.5 1.5 0 00-3 0v9a2.5 2.5 0 005 0V5a.5.5 0 011 0v7a3.5 3.5 0 01-7 0V3z"/></svg>
        <span>Attach</span>
      </button>
      <button class="tb-btn" id="linkToggle" onclick="toggleLinkMode()" title="Enforce URL link validation">
        <svg viewBox="0 0 16 16"><path d="M6.354 5.5H4a3 3 0 000 6h3a3 3 0 002.83-2H9a2 2 0 01-2 1.5H4a2 2 0 010-4h2.354l1-1zM9.646 10.5H12a3 3 0 000-6H9a3 3 0 00-2.83 2H7a2 2 0 012-1.5h3a2 2 0 010 4H9.646l-1 1z"/></svg>
        <span>Link</span>
      </button>
    </div>

    <div class="input-wrap">
      <textarea
        class="msg-input" id="msgInput" rows="1"
        placeholder="Type a message, paste text, or drop a file…"
        oninput="onInput(this)"
        onpaste="onPaste(event)"
        onkeydown="onKey(event)"
      ></textarea>
      <span class="char-count" id="charCount" style="display:none"></span>
      <button class="send-btn" id="sendBtn" disabled onclick="sendMsg(event)">
        <svg viewBox="0 0 16 16"><path d="M15.854.146a.5.5 0 01.11.54l-5.819 14.547a.75.75 0 01-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 01.124-1.33L15.314.037a.5.5 0 01.54.11z"/></svg>
      </button>
    </div>
    <div class="paste-hint">
      <span class="kbd">Enter</span>
      <span class="label">Send · Large pastes auto-attach as documents</span>
    </div>
  </div>
</main>
</div>

<!-- Hidden file input -->
<input type="file" id="fileInput" accept=".txt,.md,.html,.csv,.json" style="display:none" onchange="onFileSelect(event)">

<!-- Drag overlay -->
<div class="drag-ov" id="dragOv">
  <div class="drag-label">
    <div class="drag-title">Drop to sync</div>
    <div class="drag-sub">Text files, documents, or raw text</div>
  </div>
</div>

<!-- Card Details Modal (Read-Only) -->
<div class="modal-overlay" id="detailsModal" style="display:none;">
  <div class="modal-card">
    <div class="modal-head">
      <h3 class="modal-title" id="mHeader">Card Details</h3>
      <button class="menu-btn" onclick="closeDetailsModal()" style="border:none; background:none; color:var(--text-2); cursor:pointer;"><svg viewBox="0 0 16 16" style="width:16px;height:16px;fill:currentColor;"><path d="M12.7 3.3a1 1 0 00-1.4 0L8 6.6 4.7 3.3a1 1 0 00-1.4 1.4L6.6 8l-3.3 3.3a1 1 0 001.4 1.4L8 9.4l3.3 3.3a1 1 0 001.4-1.4L9.4 8l3.3-3.3a1 1 0 000-1.4z"/></svg></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <span class="form-label">Designation</span>
        <h2 id="mTitle" style="font-size:16px; font-weight:700; color:var(--text); word-break:break-word;"></h2>
      </div>
      <div class="form-group" id="mUrlGroup">
        <span class="form-label">Vector Path (URL)</span>
        <div style="display:flex; gap:8px;">
          <input type="text" id="mUrl" class="form-input" readonly style="flex:1; opacity:0.8;">
          <button class="doc-btn" onclick="copyCardLink()" style="flex-shrink:0;">Copy Link</button>
        </div>
      </div>
      <div class="form-group">
        <span class="form-label">Classification / Category</span>
        <span id="mCategory" class="msg-cat-badge" style="align-self:flex-start;">General</span>
      </div>
      <div class="form-group">
        <span class="form-label">Operational Notes</span>
        <div id="mNotes" style="font-family:monospace; padding:10px; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface); font-size:12px; white-space:pre-wrap; max-height:200px; overflow-y:auto;"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button id="mLaunchBtn" class="doc-btn accent" onclick="launchCardUrl()">Initiate Launch</button>
      <button class="doc-btn" onclick="closeDetailsModal()">Close</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script src="/js/public.js"></script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
