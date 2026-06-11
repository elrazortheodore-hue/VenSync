import { ref, onValue, push, remove, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAppInstances } from "./core-auth.js";

const PINNED_LINKS = [
  { label: 'GitHub', url: 'https://github.com' },
  { label: 'Notion', url: 'https://notion.so' },
  { label: 'Figma', url: 'https://figma.com' },
  { label: 'LinkedIn', url: 'https://linkedin.com' },
  { label: 'ChatGPT', url: 'https://chatgpt.com' },
  { label: 'Claude', url: 'https://claude.ai' }
];

export function initUI(isOwner) {
  const { db } = getAppInstances();
  
  const screenLoading = document.getElementById('screen-loading');
  const screenMain = document.getElementById('screen-main');
  
  screenLoading.style.opacity = '0';
  setTimeout(() => { 
    screenLoading.style.display = 'none'; 
    screenMain.style.display = 'flex';
    if(window.lucide) window.lucide.createIcons();
  }, 300);

  setInterval(() => {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  }, 1000);

  onValue(ref(db, '.info/connected'), (snap) => {
    const dot = document.getElementById('connection-dot');
    const text = document.getElementById('connection-text');
    if (snap.val() === true) {
      dot.classList.add('live'); text.textContent = 'Live';
    } else {
      dot.classList.remove('live'); text.textContent = 'Offline';
    }
  });

  if (isOwner) {
    import('./guest-engine.js').then(({ generateGuestCode, revokeGuestSession }) => {
      document.getElementById('btn-generate-guest').addEventListener('click', generateGuestCode);
      document.getElementById('btn-revoke-guest').addEventListener('click', (e) => { e.stopPropagation(); revokeGuestSession(); });
    });

    onValue(ref(db, 'upbox/guestSession'), (snapshot) => {
      if (snapshot.exists() && snapshot.val().active && Date.now() < snapshot.val().expiresAt) {
        document.getElementById('guest-badge').style.display = 'flex';
        document.getElementById('btn-generate-guest').style.display = 'none';
      } else {
        document.getElementById('guest-badge').style.display = 'none';
        document.getElementById('btn-generate-guest').style.display = 'flex';
        if(snapshot.exists()) {
           remove(ref(db, 'upbox/guestSession'));
        }
      }
    });

  } else {
    document.getElementById('btn-generate-guest').style.display = 'none';
    document.getElementById('guest-badge').style.display = 'flex';
    document.getElementById('btn-revoke-guest').style.display = 'none';
  }

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

  setupMessages(db);
}

function setupMessages(db) {
  const msgInput = document.getElementById('msg-input');
  const btnSend = document.getElementById('btn-send');
  const syncPad = document.getElementById('sync-pad');
  const emptyState = document.getElementById('empty-state');

  msgInput.addEventListener('input', () => {
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 84) + 'px';
    btnSend.disabled = msgInput.value.trim() === '';
  });

  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault(); sendMessage();
    }
  });

  btnSend.addEventListener('click', sendMessage);

  async function sendMessage() {
    const text = msgInput.value.trim();
    if(!text) return;
    const isUrl = /^https?:\/\/.+/i.test(text);
    await push(ref(db, 'upbox/messages'), { text, type: isUrl ? 'link' : 'text', timestamp: Date.now() });
    msgInput.value = ''; msgInput.style.height = 'auto'; btnSend.disabled = true; msgInput.focus();
  }

  onValue(ref(db, 'upbox/messages'), (snapshot) => {
    syncPad.querySelectorAll('.bubble').forEach(b => b.remove());
    if (snapshot.exists()) {
      emptyState.style.display = 'none';
      snapshot.forEach(child => renderBubble(child.key, child.val(), syncPad, db));
      syncPad.scrollTo({ top: syncPad.scrollHeight, behavior: 'smooth' });
    } else {
      emptyState.style.display = 'flex';
    }
    if(window.lucide) window.lucide.createIcons();
  });
}

function renderBubble(id, data, syncPad, db) {
  const div = document.createElement('div');
  div.className = 'bubble';
  div.id = `msg-${id}`;
  
  let contentHtml = '';
  if (data.type === 'link') {
    let safeUrl = data.text;
    if (!/^https?:\/\//i.test(safeUrl)) safeUrl = 'https://' + safeUrl;
    contentHtml = `<a href="${escapeHtml(safeUrl)}" target="_blank" class="bubble-link" title="${escapeHtml(data.text)}"><i data-lucide="link" width="12" height="12" style="display:inline; vertical-align:middle; margin-right:4px;"></i>${escapeHtml(data.text.length > 52 ? data.text.substring(0,52)+'…' : data.text)}</a>`;
  } else {
    contentHtml = `<div class="bubble-text">${escapeHtml(data.text)}</div>`;
  }

  const timeStr = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  div.innerHTML = `
    ${contentHtml}
    <div class="bubble-footer">
      <div class="bubble-timestamp">${timeStr}</div>
      <div class="bubble-actions">
        <button class="action-btn" id="copy-${id}"><i data-lucide="copy" width="14" height="14"></i> Copy</button>
        ${data.type === 'link' ? `<a href="${escapeHtml(safeUrl)}" target="_blank" class="action-btn"><i data-lucide="external-link" width="14" height="14"></i> Open</a>` : ''}
        <button class="action-btn danger" id="del-${id}"><i data-lucide="trash-2" width="14" height="14"></i> Del</button>
      </div>
    </div>
  `;
  syncPad.appendChild(div);

  document.getElementById(`copy-${id}`).addEventListener('click', function() {
    navigator.clipboard.writeText(data.text).then(() => {
      const originalHtml = this.innerHTML;
      this.innerHTML = `<i data-lucide="check" width="14" height="14"></i> Copied`;
      this.classList.add('success');
      if(window.lucide) window.lucide.createIcons();
      setTimeout(() => { this.innerHTML = originalHtml; this.classList.remove('success'); if(window.lucide) window.lucide.createIcons(); }, 1500);
    });
  });

  document.getElementById(`del-${id}`).addEventListener('click', () => {
    div.style.animation = 'collapseOut 200ms ease forwards';
    setTimeout(() => remove(ref(db, `upbox/messages/${id}`)), 200);
  });
}

function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
