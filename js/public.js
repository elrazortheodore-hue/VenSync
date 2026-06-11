if (window.lucide) window.lucide.createIcons();

let currentData = { messages: [] };
let msgInterval;

function triggerToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.style.opacity = '1';
  setTimeout(() => toast.style.opacity = '0', 3000);
}

async function fetchChannelData() {
  try {
    const r = await fetch('/api/public');
    if(!r.ok) {
        if(r.status === 403) {
            triggerToast("PUBLIC MODE LOCKED");
        }
        throw new Error("API Error");
    }
    let data = await r.json();
    if(!data.messages) data.messages = [];
    return data;
  } catch(e) {
    return null;
  }
}

async function saveChannelData(data) {
  try {
    await fetch('/api/public', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch(e) { console.error("Save Error", e); }
}

function initUI() {
  document.getElementById('screen-loading').style.display = 'none';
  document.getElementById('screen-main').style.display = 'flex';

  if (!document.getElementById('clock').hasAttribute('data-initialized')) {
    document.getElementById('clock').setAttribute('data-initialized', 'true');
    setInterval(() => {
      document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }, 1000);

    setupPinnedLinks();
    setupMessages();
    
    // Initial fetch
    fetchChannelData().then(data => {
        if(data && data.messages) {
            currentData = data;
            renderMessages();
        }
    });
  }
}

function setupPinnedLinks() {
  const PINNED_LINKS = [
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'Notion', url: 'https://notion.so' },
    { label: 'Figma', url: 'https://figma.com' },
    { label: 'LinkedIn', url: 'https://linkedin.com' }
  ];
  const pinnedPanel = document.getElementById('pinned-panel');
  const pinnedIcon = document.getElementById('pinned-icon');
  document.getElementById('pinned-toggle').addEventListener('click', () => {
    pinnedPanel.classList.toggle('expanded');
    pinnedIcon.style.transform = pinnedPanel.classList.contains('expanded') ? 'rotate(180deg)' : 'rotate(0deg)';
  });
  if (window.innerWidth >= 640) pinnedPanel.classList.add('expanded');

  const pinnedGrid = document.getElementById('pinned-grid');
  PINNED_LINKS.forEach(link => {
    const a = document.createElement('a');
    a.href = link.url; a.target = "_blank"; a.className = "pinned-chip";
    const domain = new URL(link.url).hostname;
    a.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="${link.label}"> ${link.label}`;
    pinnedGrid.appendChild(a);
  });
}

function setupMessages() {
  const msgInput = document.getElementById('msg-input');
  const btnSend = document.getElementById('btn-send');

  msgInput.addEventListener('input', () => {
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 100) + 'px';
    btnSend.disabled = msgInput.value.trim() === '';
  });

  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendMessage(); }
  });

  btnSend.addEventListener('click', () => {
    btnSend.style.transform = "scale(0.85)";
    setTimeout(()=> btnSend.style.transform = "", 150);
    sendMessage();
  });

  async function sendMessage() {
    const text = msgInput.value.trim();
    if(!text) return;
    const isUrl = /^https?:\/\/.+/i.test(text);
    
    const newMsg = {
      id: 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5),
      text,
      type: isUrl ? 'link' : 'text',
      timestamp: Date.now()
    };

    currentData.messages.push(newMsg);
    renderMessages();
    
    msgInput.value = ''; msgInput.style.height = 'auto'; btnSend.disabled = true; msgInput.focus();
    
    document.getElementById('connection-dot').classList.remove('live');
    await saveChannelData(currentData);
    document.getElementById('connection-dot').classList.add('live');
  }

  const syncLoop = async () => {
    const data = await fetchChannelData();
    if(data && data.messages) {
      document.getElementById('connection-dot').classList.add('live');
      if(JSON.stringify(data.messages) !== JSON.stringify(currentData.messages)) {
        currentData = data;
        renderMessages();
      }
    } else {
      document.getElementById('connection-dot').classList.remove('live');
    }
  };

  msgInterval = setInterval(syncLoop, 3000);
}

function renderMessages() {
  const syncPad = document.getElementById('sync-pad');
  const emptyState = document.getElementById('empty-state');
  
  const existingNodes = new Set(Array.from(syncPad.querySelectorAll('.bubble')).map(n => n.id));
  const currentNodes = new Set();
  
  if(currentData.messages && currentData.messages.length > 0) {
    emptyState.style.display = 'none';
    currentData.messages.forEach(msg => {
      currentNodes.add(msg.id);
      if(!existingNodes.has(msg.id)) {
        const div = document.createElement('div');
        div.className = 'bubble';
        div.id = msg.id;
        
        let contentHtml = '';
        if (msg.type === 'link') {
          let safeUrl = msg.text;
          if (!/^https?:\/\//i.test(safeUrl)) safeUrl = 'https://' + safeUrl;
          contentHtml = `<a href="${escapeHtml(safeUrl)}" target="_blank" class="bubble-link"><i data-lucide="link" width="12" height="12" style="display:inline; vertical-align:text-bottom; margin-right:6px; color: var(--accent-primary);"></i>${escapeHtml(msg.text.length > 52 ? msg.text.substring(0,52)+'…' : msg.text)}</a>`;
        } else {
          contentHtml = `<div class="bubble-text">${escapeHtml(msg.text)}</div>`;
        }

        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        div.innerHTML = `
          ${contentHtml}
          <div class="bubble-footer">
            <div class="bubble-timestamp">${timeStr}</div>
            <div class="bubble-actions">
              <button class="action-btn" id="copy-${msg.id}"><i data-lucide="copy" width="12" height="12"></i> Copy</button>
              ${msg.type === 'link' ? `<a href="${escapeHtml(safeUrl)}" target="_blank" class="action-btn" style="text-decoration:none;"><i data-lucide="external-link" width="12" height="12"></i> Open</a>` : ''}
              <button class="action-btn danger" id="del-${msg.id}"><i data-lucide="trash-2" width="12" height="12"></i> Del</button>
            </div>
          </div>
        `;
        syncPad.appendChild(div);

        document.getElementById(`copy-${msg.id}`).onclick = function() {
          navigator.clipboard.writeText(msg.text);
          triggerToast("COPIED TO CLIPBOARD");
        };

        document.getElementById(`del-${msg.id}`).onclick = async () => {
          document.getElementById(msg.id).style.animation = 'collapseOut 200ms forwards';
          setTimeout(() => document.getElementById(msg.id).remove(), 200);
          currentData.messages = currentData.messages.filter(m => m.id !== msg.id);
          await saveChannelData(currentData);
          if(currentData.messages.length===0) emptyState.style.display = 'flex';
        };
      }
    });

    existingNodes.forEach(id => {
      if(!currentNodes.has(id)) {
        const el = document.getElementById(id);
        if(el) {
          el.style.animation = 'collapseOut 200ms forwards';
          setTimeout(() => el.remove(), 200);
        }
      }
    });
    
    if(syncPad.scrollHeight - syncPad.scrollTop - syncPad.clientHeight < 150) {
        syncPad.scrollTo({ top: syncPad.scrollHeight, behavior: 'smooth' });
    }
  } else {
    syncPad.querySelectorAll('.bubble').forEach(b => b.remove());
    emptyState.style.display = 'flex';
  }
  if(window.lucide) window.lucide.createIcons();
}

function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

// Start sequence
initUI();
