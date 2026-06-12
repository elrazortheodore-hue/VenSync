// VenSync Public Controller

let activeCategory = 'all';
let currentMessages = [];
let offset = 0;
const limit = 20;
let hasMoreMessages = false;
let searchQuery = '';

// Initialize on load
window.addEventListener('load', () => {
  initApp();
  
  // Dynamic refresh loop (every 5 seconds) to fetch live updates
  setInterval(pollNewMessages, 5000);
});

/* ════════════════════════════════════════
   APP INITIALIZATION
════════════════════════════════════════ */
function initApp() {
  activeCategory = 'all';
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchWrap').style.display = 'none';
  loadMessages(true).then(() => {
    // Check if there is a specific card ID deep-link hash in the URL (e.g. #msg-123)
    const hash = window.location.hash;
    if (hash && hash.startsWith('#msg-')) {
      const cardId = hash.replace('#', '');
      openDetailsModal(cardId);
    }
  });
}

/* ════════════════════════════════════════
   DATA SYNCHRONIZATION
════════════════════════════════════════ */
async function loadMessages(reset = false) {
  if (reset) {
    offset = 0;
    currentMessages = [];
  }

  try {
    let url = `/api/public?limit=${limit}&offset=${offset}&category=${activeCategory}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load messages");

    const data = await response.json();
    
    if (reset) {
      currentMessages = data.messages || [];
    } else {
      currentMessages = currentMessages.concat(data.messages || []);
    }

    hasMoreMessages = data.hasMore;
    renderCategories(data.categories || []);
    renderMessagesList();
  } catch (err) {
    showToast("Sync pad unreachable");
  }
}

// Background polling for new messages without reset-flickering
async function pollNewMessages() {
  try {
    let url = `/api/public?limit=${limit}&offset=0&category=${activeCategory}`;
    const response = await fetch(url);
    if (!response.ok) return;

    const data = await response.json();
    const newMsgs = data.messages || [];
    
    // Simple check: if the first ID or length changed, do a silent reload
    if (newMsgs.length > 0 && (currentMessages.length === 0 || newMsgs[0].id !== currentMessages[0].id)) {
      // Retain the offset, but reload the head
      loadMessages(true);
    }
  } catch (e) {
    // Silently ignore polling network failures
  }
}

function loadOlderMessages() {
  offset += limit;
  loadMessages(false);
}

/* ════════════════════════════════════════
   CATEGORIES (CHANNELS)
════════════════════════════════════════ */
function renderCategories(categoriesList) {
  const chatList = document.getElementById('chatList');
  let html = `<div class="chat-item ${activeCategory === 'all' ? 'active' : ''}" onclick="selectCategory('all', this)"><span class="chat-dot"></span>SYS_ALL</div>`;
  
  categoriesList.forEach(cat => {
    if (cat.toLowerCase() !== 'all') {
      html += `<div class="chat-item ${activeCategory === cat ? 'active' : ''}" onclick="selectCategory('${cat}', this)"><span class="chat-dot"></span>${escapeHtml(cat)}</div>`;
    }
  });
  chatList.innerHTML = html;
}

function selectCategory(catName, el) {
  document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
  el.classList.add('active');
  activeCategory = catName;
  document.getElementById('topbarTitle').textContent = catName === 'all' ? 'Public Sync Pad' : catName;
  closeSidebar();
  loadMessages(true);
}

/* ════════════════════════════════════════
   MESSAGES LIST
════════════════════════════════════════ */
function renderMessagesList() {
  const messagesDiv = document.getElementById('messages');
  const loadBtn = document.getElementById('loadOlderBtn');
  
  const bubbles = messagesDiv.querySelectorAll('.msg-group');
  bubbles.forEach(b => b.remove());

  let filtered = currentMessages;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(m => 
      (m.text || '').toLowerCase().includes(q) || 
      (m.title || '').toLowerCase().includes(q) || 
      (m.category || '').toLowerCase().includes(q) || 
      (m.notes || '').toLowerCase().includes(q)
    );
  }

  const end = document.getElementById('msgEnd');

  filtered.forEach(msg => {
    const msgGroup = document.createElement('div');
    msgGroup.className = 'msg-group'; // Public messages shown on left (them)
    msgGroup.id = `bubble-${msg.id}`;

    let contentHtml = '';
    
    // 1. LINK CARD
    if (msg.type === 'link') {
      let domain = '';
      try { domain = new URL(msg.text).hostname.replace('www.', ''); } catch (e) { domain = 'link'; }
      contentHtml = `
        <div class="link-card" onclick="openDetailsModal('${msg.id}')">
          <div class="link-bar"></div>
          <div class="link-body">
            <div class="link-domain"><div class="link-fav"></div>${escapeHtml(domain)}</div>
            <div class="link-title">${escapeHtml(msg.title || msg.text)}</div>
            <div class="link-desc">${escapeHtml(msg.text)}</div>
            <div class="anon-tag"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a2 2 0 110 4 2 2 0 010-4zm0 9.2a6.1 6.1 0 01-4.3-1.8A5 5 0 018 9.5c1.8 0 3.3.9 4.3 2A6.1 6.1 0 018 13.2z"/></svg>PUBLIC PREVIEW</div>
          </div>
        </div>`;
    } 
    // 2. DOCUMENT CARD
    else if (msg.type === 'doc') {
      const wordCount = (msg.text || '').trim().split(/\s+/).filter(Boolean).length;
      contentHtml = `
        <div class="doc-card" id="card-${msg.id}">
          <div class="doc-head">
            <div class="doc-icon"><svg viewBox="0 0 16 16"><path d="M9.5 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V5.5L9.5 1zM9 2.5V5h2.5M5 8h6M5 10h6M5 6h3"/></svg></div>
            <div class="doc-title-wrap" onclick="openDetailsModal('${msg.id}')" style="cursor:pointer;">
              <div class="doc-title">${escapeHtml(msg.title || "Document Card")}</div>
              <div class="doc-subtitle">${wordCount} words · Click details</div>
            </div>
            <div class="doc-acts">
              <button class="doc-btn" onclick="toggleDocCardExpand('${msg.id}')" id="expBtn-${msg.id}">Expand</button>
            </div>
          </div>
          <div class="doc-body collapsed" id="body-${msg.id}">
            <div class="doc-snippet">${escapeHtml(msg.text.substring(0, 150) + (msg.text.length > 150 ? '…' : ''))}</div>
            <div class="doc-full" id="full-${msg.id}">${escapeHtml(msg.text)}</div>
          </div>
          <div class="doc-foot">
            <div class="doc-stats">
              <span>${wordCount} words</span>
              <span>● Synced</span>
            </div>
            <button class="copy-btn" onclick="copyCardShareLink('${msg.id}')">
              <svg viewBox="0 0 16 16"><path d="M4 4a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 1h8a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M6 2h4a1 1 0 011 1v1H5V3a1 1 0 011-1z"/></svg>
              Copy Link
            </button>
          </div>
        </div>`;
    } 
    // 3. STANDARD CHAT BUBBLE
    else {
      contentHtml = `
        <div class="bubble" onclick="openDetailsModal('${msg.id}')" style="cursor:pointer;">
          ${escapeHtml(msg.text)}
        </div>`;
    }

    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let badgeHtml = '';
    if (msg.category && msg.category !== 'General') {
      badgeHtml += `<span class="msg-cat-badge">${escapeHtml(msg.category)}</span>`;
    }
    if (msg.status) {
      badgeHtml += `<span class="msg-status-badge ${msg.status}">${msg.status}</span>`;
    }

    msgGroup.innerHTML = `
      <div class="msg-av them">VS</div>
      <div class="msg-col">
        <div class="msg-meta">
          <span class="msg-sender">Synced Card</span>
          <span class="msg-time">${timeStr}</span>
        </div>
        
        ${contentHtml}

        <div class="msg-badge-row">
          ${badgeHtml}
        </div>
      </div>`;

    messagesDiv.insertBefore(msgGroup, end);
  });

  loadBtn.style.display = hasMoreMessages ? 'block' : 'none';
}

function toggleDocCardExpand(id) {
  const body = document.getElementById(`body-${id}`);
  const btn = document.getElementById(`expBtn-${id}`);
  
  if (body.classList.contains('collapsed')) {
    body.classList.remove('collapsed');
    body.classList.add('expanded');
    btn.innerText = "Collapse";
    document.getElementById(`full-${id}`).style.display = 'block';
  } else {
    body.classList.add('collapsed');
    body.classList.remove('expanded');
    btn.innerText = "Expand";
    document.getElementById(`full-${id}`).style.display = 'none';
  }
}

/* ════════════════════════════════════════
   SEND CARD (PUBLIC UPLOAD)
════════════════════════════════════════ */
function onInput(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 130) + 'px';

  const len = el.value.length;
  const cc = document.getElementById('charCount');
  const btn = document.getElementById('sendBtn');

  if (len > 200) {
    cc.style.display = 'block';
    cc.textContent = len.toLocaleString();
    cc.classList.toggle('warn', len > 3000);
  } else {
    cc.style.display = 'none';
  }

  btn.disabled = el.value.trim().length === 0;
}

function onPaste(e) {
  const text = e.clipboardData.getData('text/plain');
  
  if (/^https?:\/\//i.test(text.trim())) {
    e.preventDefault();
    document.getElementById('msgInput').value = text.trim();
    onInput(document.getElementById('msgInput'));
    showToast("URL detected");
    return;
  }

  if (text.length >= 600) {
    e.preventDefault();
    const title = prompt("Large text block. Enter document designation title:", "Pasted Document");
    if (title !== null) {
      sendLargeDocument(text, title || "Pasted Document");
    }
  }
}

function onKey(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
    e.preventDefault();
    sendMsg(e);
  }
}

async function sendMsg(e) {
  const el = document.getElementById('msgInput');
  const text = el.value.trim();
  if (!text) return;

  if (e && e.currentTarget) {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = 'width:50px;height:50px;top:50%;left:50%;margin:-25px 0 0 -25px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }

  let type = 'text';
  let title = '';
  
  if (/^https?:\/\//i.test(text)) {
    type = 'link';
  } else if (text.length >= 600) {
    type = 'doc';
    const userTitle = prompt("Large text block. Enter document title:", "Text Document");
    if (userTitle === null) return;
    title = userTitle || "Text Document";
  }

  const payload = {
    text: text,
    type: type,
    title: title,
    category: activeCategory === 'all' ? 'General' : activeCategory
  };

  try {
    const response = await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      el.value = '';
      el.style.height = 'auto';
      document.getElementById('sendBtn').disabled = true;
      document.getElementById('charCount').style.display = 'none';
      loadMessages(true);
      showToast("Card Synced");
    } else {
      showToast("Broadcast locked or server busy");
    }
  } catch (err) {
    showToast("Transmission Error");
  }
}

async function sendLargeDocument(text, title) {
  const payload = {
    text: text,
    type: 'doc',
    title: title,
    category: activeCategory === 'all' ? 'General' : activeCategory
  };

  try {
    const response = await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      loadMessages(true);
      showToast("Document Card Synced");
    } else {
      showToast("Sync document failed");
    }
  } catch (err) {
    showToast("Connection Error");
  }
}

function triggerFileInput() {
  document.getElementById('fileInput').click();
}

function onFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const title = prompt("Attach file text content. Enter designation:", file.name);
    if (title !== null) {
      sendLargeDocument(e.target.result, title || file.name);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

/* ════════════════════════════════════════
   READ-ONLY DETAILS MODAL
════════════════════════════════════════ */
function openDetailsModal(id) {
  const msg = currentMessages.find(m => m.id === id);
  if (!msg) {
    // If not found in current messages, attempt to fetch deep link card (we fetch page 1 and try to locate)
    showToast("Opening link...");
    return;
  }

  document.getElementById('mTitle').innerText = msg.title || msg.text;
  document.getElementById('mUrl').value = msg.text || '';
  document.getElementById('mCategory').innerText = msg.category || 'General';
  document.getElementById('mNotes').innerText = msg.notes || 'NO ADDITIONAL PARAMETERS RECORDED.';

  if (msg.type === 'link') {
    document.getElementById('mUrlGroup').style.display = 'flex';
    document.getElementById('mLaunchBtn').style.display = 'block';
  } else {
    document.getElementById('mUrlGroup').style.display = 'none';
    document.getElementById('mLaunchBtn').style.display = 'none';
  }

  // Set window hash to shareable card URL dynamically
  window.location.hash = msg.id;

  document.getElementById('detailsModal').style.display = 'flex';
}

function closeDetailsModal() {
  document.getElementById('detailsModal').style.display = 'none';
  // Clear card hash without reloading page
  history.replaceState(null, null, ' ');
}

function copyCardLink() {
  const urlVal = document.getElementById('mUrl').value;
  if (!urlVal) return;
  navigator.clipboard.writeText(urlVal).then(() => {
    showToast("Link URL copied");
  }).catch(() => {});
}

function copyCardShareLink(id) {
  const shareUrl = `${window.location.origin}/public#${id}`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast("Share link copied to clipboard");
  }).catch(() => {});
}

function launchCardUrl() {
  const urlVal = document.getElementById('mUrl').value;
  if (urlVal) {
    window.open(urlVal, '_blank');
  }
}

/* ════════════════════════════════════════
   SEARCH AND SYSTEM DECORATIONS
════════════════════════════════════════ */
function toggleSearch() {
  const wrap = document.getElementById('searchWrap');
  const input = document.getElementById('searchInput');
  if (wrap.style.display === 'none') {
    wrap.style.display = 'block';
    input.focus();
  } else {
    wrap.style.display = 'none';
    input.value = '';
    onSearch('');
  }
}

function onSearch(val) {
  searchQuery = val.trim();
  renderMessagesList();
}

function copyShareLink() {
  const shareLink = window.location.origin + '/public';
  navigator.clipboard.writeText(shareLink).then(() => {
    showToast("Public sync link copied to clipboard");
  }).catch(() => {});
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sbBackdrop');
  if (sb.classList.contains('open')) {
    closeSidebar();
  } else {
    sb.classList.add('open');
    bd.classList.add('show');
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbBackdrop').classList.remove('show');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.className = 'toast show';
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ════════════════════════════════════════
   DRAG AND DROP OVERLAY
════════════════════════════════════════ */
const dragOv = document.getElementById('dragOv');
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  dragOv.classList.add('on');
});
window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
    dragOv.classList.remove('on');
  }
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragOv.classList.remove('on');
  const file = e.dataTransfer.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const title = prompt("Drop file text content. Enter designation title:", file.name);
    if (title !== null) {
      sendLargeDocument(evt.target.result, title || file.name);
    }
  };
  reader.readAsText(file);
});
