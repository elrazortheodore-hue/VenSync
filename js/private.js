// VenSync Private Controller

let activeCategory = 'all';
let currentMessages = [];
let offset = 0;
const limit = 20;
let hasMoreMessages = false;
let isPublicEnabled = false;
let editModeActive = false;
let currentEditingMsgId = null;
let currentDeleteMsgId = null;
let isTodoFilterActive = false;
let searchQuery = '';
let inactivityTimer;

// Auto-lock / Inactivity monitor (10 minutes)
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    logOut();
    showToast("Session locked due to inactivity.");
  }, 600000); // 10 minutes
}
window.addEventListener('mousemove', resetInactivityTimer);
window.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    logOut();
  }
});

// Init on load
window.addEventListener('load', () => {
  resetInactivityTimer();
  const cachedPass = sessionStorage.getItem('vs_pass');
  if (cachedPass) {
    verifySession(cachedPass);
  } else {
    showAuthScreen();
  }
});

/* ════════════════════════════════════════
   AUTHENTICATION
════════════════════════════════════════ */
function showAuthScreen() {
  document.getElementById('screenAuth').style.display = 'flex';
  document.getElementById('authPass').focus();
}

function hideAuthScreen() {
  document.getElementById('screenAuth').style.display = 'none';
}

async function loginAdmin() {
  const passInput = document.getElementById('authPass');
  const pass = passInput.value.trim();
  if (!pass) return;

  const btn = document.getElementById('loginBtn');
  btn.innerText = "Verifying...";
  btn.disabled = true;

  try {
    const response = await fetch('/api/private?limit=1', {
      headers: { 'X-Ven-Pass': pass }
    });
    if (response.ok) {
      sessionStorage.setItem('vs_pass', pass);
      hideAuthScreen();
      initApp();
      showToast("Access Granted");
    } else {
      showToast("ACCESS DENIED");
      passInput.classList.add('warn');
      setTimeout(() => passInput.classList.remove('warn'), 1000);
      passInput.value = '';
      passInput.focus();
    }
  } catch (err) {
    showToast("Uplink Error");
  } finally {
    btn.innerText = "Authenticate";
    btn.disabled = false;
  }
}

async function verifySession(pass) {
  try {
    const response = await fetch('/api/private?limit=1', {
      headers: { 'X-Ven-Pass': pass }
    });
    if (response.ok) {
      hideAuthScreen();
      initApp();
    } else {
      sessionStorage.removeItem('vs_pass');
      showAuthScreen();
    }
  } catch (e) {
    showAuthScreen();
  }
}

function logOut() {
  sessionStorage.removeItem('vs_pass');
  clearTimeout(inactivityTimer);
  showAuthScreen();
  document.getElementById('messages').innerHTML = '<button id="loadOlderBtn" class="doc-btn" style="margin: 0 auto 10px; display: none; align-self: center;" onclick="loadOlderMessages()">Load Older Messages</button><div id="msgEnd"></div>';
  document.getElementById('chatList').innerHTML = '<div class="chat-item active" onclick="selectCategory(\'all\', this)"><span class="chat-dot"></span>SYS_ALL</div>';
}

function getAuthHeader() {
  return { 'X-Ven-Pass': sessionStorage.getItem('vs_pass') || '' };
}

/* ════════════════════════════════════════
   APP INITIALIZATION
════════════════════════════════════════ */
function initApp() {
  activeCategory = 'all';
  isTodoFilterActive = false;
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchWrap').style.display = 'none';
  document.getElementById('todoBtn').classList.remove('on');
  loadMessages(true);
}

/* ════════════════════════════════════════
   DATA SYNCHRONIZATION
════════════════════════════════════════ */
async function loadMessages(reset = false) {
  if (reset) {
    offset = 0;
    currentMessages = [];
  }

  const pass = sessionStorage.getItem('vs_pass');
  if (!pass) return;

  try {
    let url = `/api/private?limit=${limit}&offset=${offset}&category=${activeCategory}`;
    const response = await fetch(url, { headers: getAuthHeader() });
    if (!response.ok) {
      if (response.status === 401) logOut();
      throw new Error("Failed to load messages");
    }

    const data = await response.json();
    isPublicEnabled = data.isPublicEnabled;
    document.getElementById('masterSwitch').checked = isPublicEnabled;

    if (reset) {
      currentMessages = data.messages || [];
    } else {
      currentMessages = currentMessages.concat(data.messages || []);
    }

    hasMoreMessages = data.hasMore;
    renderCategories(data.categories || []);
    renderMessagesList();
  } catch (err) {
    showToast("Network Sync Failed");
  }
}

function loadOlderMessages() {
  offset += limit;
  loadMessages(false);
}

/* ════════════════════════════════════════
   CATEGORIES (CHANNELS) MANAGEMENT
════════════════════════════════════════ */
function renderCategories(categoriesList) {
  const chatList = document.getElementById('chatList');
  // Always include SYS_ALL
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
  document.getElementById('topbarTitle').textContent = catName === 'all' ? 'SYS_ALL' : catName;
  closeSidebar();
  loadMessages(true);
}

function newCategoryPrompt() {
  const cat = prompt("Enter new channel/category designation:");
  if (cat && cat.trim()) {
    const cleanCat = cat.trim();
    activeCategory = cleanCat;
    document.getElementById('topbarTitle').textContent = cleanCat;
    
    // Optimistically render in sidebar
    const chatList = document.getElementById('chatList');
    const activeItem = chatList.querySelector('.chat-item.active');
    if (activeItem) activeItem.classList.remove('active');
    
    const div = document.createElement('div');
    div.className = 'chat-item active';
    div.innerHTML = `<span class="chat-dot"></span>${escapeHtml(cleanCat)}`;
    div.onclick = function() { selectCategory(cleanCat, this); };
    chatList.insertBefore(div, chatList.firstChild);
    
    closeSidebar();
    loadMessages(true);
  }
}

/* ════════════════════════════════════════
   MESSAGES RENDERING
════════════════════════════════════════ */
function renderMessagesList() {
  const messagesDiv = document.getElementById('messages');
  const loadBtn = document.getElementById('loadOlderBtn');
  
  // Remove existing bubbles (leave only load older button and msgEnd)
  const bubbles = messagesDiv.querySelectorAll('.msg-group');
  bubbles.forEach(b => b.remove());

  // Filter messages locally for Search and To-Do mode
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

  if (isTodoFilterActive) {
    filtered = filtered.filter(m => m.category === 'TO-DO' || (m.status && m.status !== ''));
  }

  const end = document.getElementById('msgEnd');

  filtered.forEach(msg => {
    const msgGroup = document.createElement('div');
    msgGroup.className = 'msg-group self'; // Admin messages always on right (self)
    msgGroup.id = `bubble-${msg.id}`;

    let contentHtml = '';
    
    // 1. LINK CARD RENDERING
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
            ${msg.pubTag === 'public' ? '<div class="anon-tag"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a2 2 0 110 4 2 2 0 010-4zm0 9.2a6.1 6.1 0 01-4.3-1.8A5 5 0 018 9.5c1.8 0 3.3.9 4.3 2A6.1 6.1 0 018 13.2z"/></svg>PUBLIC</div>' : ''}
          </div>
        </div>`;
    } 
    // 2. DOCUMENT CARD RENDERING
    else if (msg.type === 'doc') {
      const wordCount = (msg.text || '').trim().split(/\s+/).filter(Boolean).length;
      const snippet = msg.text.substring(0, 150) + (msg.text.length > 150 ? '…' : '');
      contentHtml = `
        <div class="doc-card" id="card-${msg.id}">
          <div class="doc-head">
            <div class="doc-icon"><svg viewBox="0 0 16 16"><path d="M9.5 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V5.5L9.5 1zM9 2.5V5h2.5M5 8h6M5 10h6M5 6h3"/></svg></div>
            <div class="doc-title-wrap" onclick="openDetailsModal('${msg.id}')">
              <div class="doc-title">${escapeHtml(msg.title || "Untitled Document")}</div>
              <div class="doc-subtitle">${wordCount} words · Click details</div>
            </div>
            <div class="doc-acts">
              <button class="doc-btn" onclick="toggleDocCardExpand('${msg.id}')" id="expBtn-${msg.id}">Expand</button>
              <button class="doc-btn accent" onclick="toggleDocCardEditInline('${msg.id}')" id="editBtn-${msg.id}">Edit</button>
            </div>
          </div>
          <div class="doc-body collapsed" id="body-${msg.id}">
            <div class="doc-snippet" id="snip-${msg.id}">${escapeHtml(snippet)}</div>
            <div class="doc-full" id="full-${msg.id}">${escapeHtml(msg.text)}</div>
            <textarea class="doc-edit" id="ta-${msg.id}" oninput="onInlineTextareaInput('${msg.id}')">${escapeHtml(msg.text)}</textarea>
          </div>
          <div class="doc-foot">
            <div class="doc-stats">
              <span id="wc-${msg.id}">${wordCount} words</span>
              <span>● Synced</span>
            </div>
            <button class="copy-btn" onclick="copyCardShareLink('${msg.id}')">
              <svg viewBox="0 0 16 16"><path d="M4 4a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 1h8a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M6 2h4a1 1 0 011 1v1H5V3a1 1 0 011-1z"/></svg>
              Copy Share Link
            </button>
          </div>
        </div>`;
    } 
    // 3. STANDARD BUBBLE RENDERING
    else {
      contentHtml = `
        <div class="bubble" onclick="openDetailsModal('${msg.id}')" style="cursor:pointer;">
          ${escapeHtml(msg.text)}
        </div>`;
    }

    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Status and visibility badge row
    let badgeHtml = '';
    if (msg.category && msg.category !== 'General') {
      badgeHtml += `<span class="msg-cat-badge">${escapeHtml(msg.category)}</span>`;
    }
    if (msg.status) {
      badgeHtml += `<span class="msg-status-badge ${msg.status}">${msg.status}</span>`;
    }

    // Globe icon indicator for public assets
    const globeSvg = msg.pubTag === 'public' 
      ? `<svg viewBox="0 0 16 16" class="icon" style="width:11px; height:11px; fill:var(--oppo); cursor:pointer;" onclick="togglePublicVisibility('${msg.id}', event)" title="Public Broadcast (Click to toggle)"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM4.882 3.125a6.969 6.969 0 015.65-.008L8 6.5 4.882 3.125zM1.077 7.5c.168-1.579.866-3.003 1.93-4.068L5.5 6 1.077 7.5zm.006 1l4.417 1.5-2.499 2.568A6.974 6.974 0 011.083 8.5zm3.799 4.375L8 9.5l3.118 3.375a6.97 6.97 0 01-6.236 0zM14.917 8.5c-.168 1.579-.866 3.003-1.93 4.068L10.5 10l4.417-1.5zm.006-1L10.5 6l2.499-2.568a6.974 6.974 0 011.924 4.068zM8 9.5L4.882 12.875a6.97 6.97 0 016.236 0L8 9.5z"/></svg>`
      : `<svg viewBox="0 0 16 16" class="icon" style="width:11px; height:11px; fill:var(--text-3); cursor:pointer;" onclick="togglePublicVisibility('${msg.id}', event)" title="Private Card (Click to toggle)"><path d="M8 15A7 7 0 108 1v14zm0 1A8 8 0 118 0a8 8 0 010 16z"/></svg>`;

    msgGroup.innerHTML = `
      <div class="msg-av me">EF</div>
      <div class="msg-col">
        <div class="msg-meta">
          <span class="msg-sender">You</span>
          <span class="msg-time">${timeStr}</span>
          ${globeSvg}
        </div>
        
        ${contentHtml}

        <div class="msg-badge-row">
          ${badgeHtml}
        </div>

        <!-- Hover Quick Actions for Tasks -->
        <div class="msg-admin-acts">
          <button class="msg-act-btn" onclick="quickSetStatus('${msg.id}', 'Started', event)" title="Mark Active"><svg viewBox="0 0 16 16" style="width:10px;height:10px;fill:currentColor;"><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm3-8.5a.5.5 0 010 1H5a.5.5 0 010-1h6z"/></svg> Active</button>
          <button class="msg-act-btn" onclick="quickSetStatus('${msg.id}', 'Completed', event)" title="Mark Verified"><svg viewBox="0 0 16 16" style="width:10px;height:10px;fill:currentColor;"><path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z"/></svg> Verify</button>
          <button class="msg-act-btn" onclick="quickSetStatus('${msg.id}', 'Pending', event)" title="Standby"><svg viewBox="0 0 16 16" style="width:10px;height:10px;fill:currentColor;"><path d="M8 15A7 7 0 108 1v14zm0 1A8 8 0 118 0a8 8 0 010 16z"/></svg> Standby</button>
          <button class="msg-act-btn danger" onclick="confirmPurge('${msg.id}', event)" title="Purge Card"><svg viewBox="0 0 16 16" style="width:10px;height:10px;fill:currentColor;"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" clip-rule="evenodd"/></svg> Purge</button>
        </div>
      </div>`;

    messagesDiv.insertBefore(msgGroup, end);
  });

  // Handle load older visibility
  loadBtn.style.display = hasMoreMessages ? 'block' : 'none';
}

/* ════════════════════════════════════════
   DOCUMENT CARD CARD INTERACTIONS
════════════════════════════════════════ */
function toggleDocCardExpand(id) {
  const body = document.getElementById(`body-${id}`);
  const btn = document.getElementById(`expBtn-${id}`);
  
  if (body.classList.contains('collapsed')) {
    body.classList.remove('collapsed');
    body.classList.add('expanded');
    btn.innerText = "Collapse";
  } else {
    body.classList.remove('expanded');
    body.classList.add('collapsed');
    btn.innerText = "Expand";
  }
}

function toggleDocCardEditInline(id) {
  const card = document.getElementById(`card-${id}`);
  const btn = document.getElementById(`editBtn-${id}`);
  const body = document.getElementById(`body-${id}`);
  const ta = document.getElementById(`ta-${id}`);
  
  // Make sure body is expanded
  body.classList.remove('collapsed');
  body.classList.add('expanded');
  document.getElementById(`expBtn-${id}`).innerText = "Collapse";

  if (card.classList.contains('editing')) {
    // Save state
    const newText = ta.value;
    saveDocInlineContent(id, newText);
    card.classList.remove('editing');
    btn.innerText = "Edit";
    btn.classList.remove('save-mode');
  } else {
    // Edit state
    card.classList.add('editing');
    btn.innerText = "Save";
    btn.classList.add('save-mode');
    ta.focus();
  }
}

async function saveDocInlineContent(id, newText) {
  const msg = currentMessages.find(m => m.id === id);
  if (!msg || msg.text === newText) return;

  msg.text = newText;
  
  try {
    const response = await fetch('/api/private', {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text: newText })
    });
    if (response.ok) {
      showToast("Document saved inline");
      renderMessagesList();
    } else {
      showToast("Save inline failed");
    }
  } catch (e) {
    showToast("Save inline error");
  }
}

function onInlineTextareaInput(id) {
  const ta = document.getElementById(`ta-${id}`);
  const wc = document.getElementById(`wc-${id}`);
  const wordCount = ta.value.trim().split(/\s+/).filter(Boolean).length;
  wc.innerText = `${wordCount} words`;
}

/* ════════════════════════════════════════
   SEND CARD
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
  
  // URL check
  if (/^https?:\/\//i.test(text.trim())) {
    e.preventDefault();
    document.getElementById('msgInput').value = text.trim();
    onInput(document.getElementById('msgInput'));
    showToast("URL detected");
    return;
  }

  // Large doc check (>= 600 characters)
  if (text.length >= 600) {
    e.preventDefault();
    const title = prompt("Large text detected. Enter document designation title:", "Pasted Document");
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

  // Add ripple effect to send button
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
    const userTitle = prompt("Large text block. Enter document designation title:", "Text Document");
    if (userTitle === null) return; // Abort
    title = userTitle || "Text Document";
  }

  const newMsg = {
    id: 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5),
    text: text,
    type: type,
    title: title,
    timestamp: Date.now(),
    pubTag: '', // default to private
    status: 'Pending',
    category: activeCategory === 'all' ? 'General' : activeCategory,
    notes: '',
    ty: type === 'link' ? 'LNK' : (type === 'doc' ? 'DOC' : 'TXT')
  };

  try {
    const response = await fetch('/api/private', {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg)
    });
    if (response.ok) {
      el.value = '';
      el.style.height = 'auto';
      document.getElementById('sendBtn').disabled = true;
      document.getElementById('charCount').style.display = 'none';
      loadMessages(true);
      showToast("Card Synced");
    } else {
      showToast("Failed to sync card");
    }
  } catch (err) {
    showToast("Transmission Error");
  }
}

async function sendLargeDocument(text, title) {
  const newMsg = {
    id: 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5),
    text: text,
    type: 'doc',
    title: title,
    timestamp: Date.now(),
    pubTag: '',
    status: 'Pending',
    category: activeCategory === 'all' ? 'General' : activeCategory,
    notes: '',
    ty: 'DOC'
  };

  try {
    const response = await fetch('/api/private', {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg)
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
    const content = e.target.result;
    const title = prompt("Attach file text content. Enter designation:", file.name);
    if (title !== null) {
      sendLargeDocument(content, title || file.name);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

/* ════════════════════════════════════════
   QUICK CARD ACTIONS
════════════════════════════════════════ */
async function quickSetStatus(msgId, newStatus, event) {
  if (event) event.stopPropagation();

  const msg = currentMessages.find(m => m.id === msgId);
  if (!msg || msg.status === newStatus) return;

  msg.status = newStatus;

  try {
    const response = await fetch('/api/private', {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: msgId, status: newStatus })
    });
    
    if (response.ok) {
      showToast(`Status: ${newStatus}`);
      if (newStatus === 'Completed') {
        playConfettiCelebration();
      }
      renderMessagesList();
    } else {
      showToast("Status update failed");
    }
  } catch (e) {
    showToast("Server Sync Error");
  }
}

async function togglePublicVisibility(msgId, event) {
  if (event) event.stopPropagation();

  const msg = currentMessages.find(m => m.id === msgId);
  if (!msg) return;

  const newTag = msg.pubTag === 'public' ? '' : 'public';
  msg.pubTag = newTag;

  try {
    const response = await fetch('/api/private', {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: msgId, pubTag: newTag })
    });
    
    if (response.ok) {
      showToast(newTag === 'public' ? "Public Broadcast Enabled" : "Private Node Secured");
      renderMessagesList();
    } else {
      showToast("Visibility update failed");
    }
  } catch (e) {
    showToast("Visibility Server Error");
  }
}

function playConfettiCelebration() {
  if (window.confetti) {
    window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 10000 });
  }
  const overlay = document.getElementById('confettiOverlay');
  overlay.style.display = 'flex';
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 1800);
}

/* ════════════════════════════════════════
   DETAILS / EDIT MODAL
════════════════════════════════════════ */
function openDetailsModal(id) {
  currentEditingMsgId = id;
  const msg = currentMessages.find(m => m.id === id);
  if (!msg) return;

  // View Mode values
  document.getElementById('mTitle').innerText = msg.title || msg.text;
  document.getElementById('mUrl').value = msg.text || '';
  document.getElementById('mCategory').innerText = msg.category || 'General';
  document.getElementById('mArchType').innerText = msg.ty || 'TXT';
  document.getElementById('mPubTagBadge').innerText = msg.pubTag === 'public' ? 'Public' : 'Private';
  document.getElementById('mNotes').innerText = msg.notes || 'NO ADDITIONAL PARAMETERS RECORDED.';
  document.getElementById('mStamp').innerText = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '-';

  if (msg.type === 'link') {
    document.getElementById('mUrlGroup').style.display = 'flex';
    document.getElementById('mLaunchBtn').style.display = 'block';
  } else {
    document.getElementById('mUrlGroup').style.display = 'none';
    document.getElementById('mLaunchBtn').style.display = 'none';
  }

  // Edit Mode inputs
  document.getElementById('eMsgId').value = msg.id;
  document.getElementById('eTitle').value = msg.title || msg.text || '';
  document.getElementById('eUrl').value = msg.text || '';
  document.getElementById('eStatus').value = msg.status || 'Pending';
  document.getElementById('ePubTag').value = msg.pubTag || '';
  document.getElementById('eNotes').value = msg.notes || '';

  if (msg.type === 'link') {
    document.getElementById('eUrlGroup').style.display = 'flex';
  } else {
    document.getElementById('eUrlGroup').style.display = 'none';
  }

  // Populate dropdowns
  populateModalDropdowns(msg.category, msg.ty);

  // Set initial view state
  cancelModalEditMode();
  document.getElementById('detailsModal').style.display = 'flex';
}

function closeDetailsModal() {
  document.getElementById('detailsModal').style.display = 'none';
  currentEditingMsgId = null;
}

function toggleModalEditMode() {
  const v = document.getElementById('mViewMode');
  const e = document.getElementById('mEditMode');
  const vf = document.getElementById('mViewFoot');
  const ef = document.getElementById('mEditFoot');
  const editToggleBtn = document.getElementById('mEditToggleBtn');

  if (editModeActive) {
    cancelModalEditMode();
  } else {
    v.style.display = 'none';
    e.style.display = 'flex';
    vf.style.display = 'none';
    ef.style.display = 'flex';
    editToggleBtn.innerText = "View Details";
    editModeActive = true;
  }
}

function cancelModalEditMode() {
  document.getElementById('mViewMode').style.display = 'flex';
  document.getElementById('mEditMode').style.display = 'none';
  document.getElementById('mViewFoot').style.display = 'flex';
  document.getElementById('mEditFoot').style.display = 'none';
  document.getElementById('mEditToggleBtn').innerText = "Edit Card";
  editModeActive = false;
}

function populateModalDropdowns(activeCat, activeType) {
  const catSelect = document.getElementById('eCategorySelect');
  const tySelect = document.getElementById('eArchTypeSelect');
  
  // Retrieve unique categories and types in memory
  const cats = [...new Set(currentMessages.map(m => m.category).filter(Boolean))];
  if (!cats.includes('General')) cats.unshift('General');
  if (!cats.includes('TO-DO')) cats.push('TO-DO');
  
  let catOptions = '';
  cats.forEach(c => {
    catOptions += `<option value="${c}">${c}</option>`;
  });
  catOptions += `<option value="Other">OTHER (CUSTOM CHANNEL)</option>`;
  catSelect.innerHTML = catOptions;

  if (cats.includes(activeCat)) {
    catSelect.value = activeCat;
    document.getElementById('eCategoryOther').style.display = 'none';
  } else {
    catSelect.value = 'Other';
    const otherInp = document.getElementById('eCategoryOther');
    otherInp.value = activeCat || '';
    otherInp.style.display = 'block';
  }

  const types = [...new Set(currentMessages.map(m => m.ty).filter(Boolean))];
  if (!types.includes('LNK')) types.push('LNK');
  if (!types.includes('DOC')) types.push('DOC');
  if (!types.includes('TXT')) types.push('TXT');

  let tyOptions = '';
  types.forEach(t => {
    tyOptions += `<option value="${t}">${t}</option>`;
  });
  tyOptions += `<option value="Other">OTHER (CUSTOM ARCH)</option>`;
  tySelect.innerHTML = tyOptions;

  if (types.includes(activeType)) {
    tySelect.value = activeType;
    document.getElementById('eArchTypeOther').style.display = 'none';
  } else {
    tySelect.value = 'Other';
    const otherInp = document.getElementById('eArchTypeOther');
    otherInp.value = activeType || '';
    otherInp.style.display = 'block';
  }
}

function onCategorySelectChange(val) {
  document.getElementById('eCategoryOther').style.display = val === 'Other' ? 'block' : 'none';
}

function onArchTypeSelectChange(val) {
  document.getElementById('eArchTypeOther').style.display = val === 'Other' ? 'block' : 'none';
}

async function saveCardEdits() {
  const msgId = document.getElementById('eMsgId').value;
  const msg = currentMessages.find(m => m.id === msgId);
  if (!msg) return;

  const title = document.getElementById('eTitle').value.trim();
  const urlVal = document.getElementById('eUrl').value.trim();
  const status = document.getElementById('eStatus').value;
  const pubTag = document.getElementById('ePubTag').value;
  const notes = document.getElementById('eNotes').value;

  let category = document.getElementById('eCategorySelect').value;
  if (category === 'Other') {
    category = document.getElementById('eCategoryOther').value.trim() || 'General';
  }

  let ty = document.getElementById('eArchTypeSelect').value;
  if (ty === 'Other') {
    ty = document.getElementById('eArchTypeOther').value.trim() || 'TXT';
  }

  const oldStatus = msg.status;

  const updatePayload = {
    id: msgId,
    title,
    text: msg.type === 'link' ? urlVal : msg.text,
    status,
    pubTag,
    notes,
    category,
    ty
  };

  try {
    const response = await fetch('/api/private', {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });

    if (response.ok) {
      showToast("Card parameters compiled");
      closeDetailsModal();
      if (status === 'Completed' && oldStatus !== 'Completed') {
        playConfettiCelebration();
      }
      loadMessages(true);
    } else {
      showToast("Failed to compile edits");
    }
  } catch (e) {
    showToast("Server Update Error");
  }
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
   PURGE CARD
════════════════════════════════════════ */
function triggerCardDelete() {
  currentDeleteMsgId = currentEditingMsgId;
  document.getElementById('purgeModal').style.display = 'flex';
}

function closePurgeModal() {
  document.getElementById('purgeModal').style.display = 'none';
  currentDeleteMsgId = null;
}

async function executeCardDelete() {
  if (!currentDeleteMsgId) return;

  try {
    const response = await fetch(`/api/private?id=${currentDeleteMsgId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });

    if (response.ok) {
      showToast("Card purged from database");
      closePurgeModal();
      closeDetailsModal();
      loadMessages(true);
    } else {
      showToast("Failed to delete card");
    }
  } catch (e) {
    showToast("Delete request failed");
  }
}

/* ════════════════════════════════════════
   ADMIN MASTER SWITCH SETTINGS
════════════════════════════════════════ */
async function toggleMasterSwitch(isChecked) {
  try {
    const response = await fetch('/api/private', {
      method: 'PATCH',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublicEnabled: isChecked })
    });
    
    if (response.ok) {
      isPublicEnabled = isChecked;
      showToast(isChecked ? "Public Broadcast Enabled" : "Public Broadcast Disabled");
    } else {
      showToast("Master switch toggle failed");
      document.getElementById('masterSwitch').checked = !isChecked;
    }
  } catch (e) {
    showToast("Server Settings Error");
    document.getElementById('masterSwitch').checked = !isChecked;
  }
}

/* ════════════════════════════════════════
   IMPORT / RESTORE
════════════════════════════════════════ */
function triggerImport() {
  document.getElementById('importFileInput').click();
}

function onImportFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && Array.isArray(parsed.messages)) {
        // Send PUT overwrite request
        const response = await fetch('/api/private', {
          method: 'PUT',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        if (response.ok) {
          showToast("Backup Payload Ingested");
          loadMessages(true);
        } else {
          showToast("Failed to ingest backup");
        }
      } else {
        showToast("Invalid JSON Schema: messages array missing");
      }
    } catch (err) {
      showToast("JSON Parsing Failure");
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

/* ════════════════════════════════════════
   EXPORT BACKUP
════════════════════════════════════════ */
function triggerExport() {
  document.getElementById('exportPassInput').value = '';
  document.getElementById('exportPassModal').style.display = 'flex';
  document.getElementById('exportPassInput').focus();
}

function closeExportPassModal() {
  document.getElementById('exportPassModal').style.display = 'none';
}

async function executeBackupExport() {
  const passInp = document.getElementById('exportPassInput');
  const pass = passInp.value.trim();
  if (!pass) return;

  const currentPass = sessionStorage.getItem('vs_pass');
  if (pass !== currentPass) {
    showToast("Authorization Denied");
    passInp.value = '';
    passInp.focus();
    return;
  }

  try {
    // Fetch full dataset without pagination limit
    const response = await fetch('/api/private', {
      headers: { 'X-Ven-Pass': pass }
    });
    if (response.ok) {
      const data = await response.json();
      closeExportPassModal();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vensync_backup_${Date.now()}.json`;
      a.click();
      showToast("Backup payload extracted");
    } else {
      showToast("Export payload failed");
    }
  } catch (err) {
    showToast("Export error");
  }
}

/* ════════════════════════════════════════
   SEARCH & FILTERS
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

function toggleTodoMode() {
  const btn = document.getElementById('todoBtn');
  isTodoFilterActive = !isTodoFilterActive;
  if (isTodoFilterActive) {
    btn.classList.add('on');
    showToast("To-Do Filter Active");
  } else {
    btn.classList.remove('on');
    showToast("Showing All Cards");
  }
  renderMessagesList();
}

/* ════════════════════════════════════════
   SIDEBAR & UI DECORATIONS
════════════════════════════════════════ */
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
  // Simple check to ensure we only close when leaving the window
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
    const title = prompt("Drop file detected. Enter designation title:", file.name);
    if (title !== null) {
      sendLargeDocument(evt.target.result, title || file.name);
    }
  };
  reader.readAsText(file);
});
