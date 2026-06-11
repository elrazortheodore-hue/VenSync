import { ref, get, set, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getAppInstances } from "./core-auth.js";
import { initUI } from "./ui-controller.js";

const GUEST_PASSPHRASE = 'migwo123';
const SESSION_DURATION = 300000;

export function setupGuestLogin() {
  const btnGuestSubmit = document.getElementById('btn-guest-submit');
  const guestInput = document.getElementById('guest-input');
  
  btnGuestSubmit.addEventListener('click', validateGuestCode);
  guestInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') validateGuestCode(); });
}

async function validateGuestCode() {
  const { db, auth } = getAppInstances();
  const guestInput = document.getElementById('guest-input');
  const guestError = document.getElementById('guest-error');
  const code = guestInput.value.trim();
  if (!code) return;

  const snapshot = await get(ref(db, 'upbox/guestSession'));
  const session = snapshot.val();
  
  if (!session || !session.active || Date.now() > session.expiresAt) {
    showError(guestError, guestInput, 'Code expired or invalid.');
    return;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(code + session.salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
  
  if (hashHex !== session.hash) {
    showError(guestError, guestInput, 'Invalid code.');
    return;
  }

  // VALID CODE -> Sign in anonymously and request approval
  try {
    const userCredential = await signInAnonymously(auth);
    const uid = userCredential.user.uid;
    
    await set(ref(db, `upbox/guestRequests/${uid}`), {
      hash: hashHex,
      timestamp: Date.now()
    });
    
    guestInput.value = 'Awaiting Approval...';
    guestInput.disabled = true;
    
    onValue(ref(db, `upbox/approvedGuests/${uid}`), (snap) => {
      if (snap.val() === true) {
        sessionStorage.setItem('vs_guest_valid', 'true');
        document.getElementById('screen-guest').style.display = 'none';
        startGuestSession();
      }
    });
  } catch (err) {
    showError(guestError, guestInput, 'Auth Error. Please enable Anonymous Sign-in in Firebase Console.');
  }
}

function showError(errEl, inputEl, msg) {
  errEl.textContent = msg;
  inputEl.classList.add('error');
  setTimeout(() => {
    errEl.textContent = '';
    inputEl.classList.remove('error');
  }, 3000);
}

export function startGuestSession() {
  const { db, auth } = getAppInstances();
  initUI(false); 
  
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') endGuestSession();
  });
  window.addEventListener('blur', endGuestSession);
  
  onValue(ref(db, 'upbox/guestSession'), (snapshot) => {
    if (!snapshot.exists() || !snapshot.val().active || Date.now() > snapshot.val().expiresAt) {
      endGuestSession();
    }
  });
}

function endGuestSession() {
  const { auth } = getAppInstances();
  sessionStorage.removeItem('vs_guest_valid');
  if (auth.currentUser) auth.signOut();
  window.location.replace('https://www.google.com');
}

export async function generateGuestCode() {
  const { db } = getAppInstances();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2,'0')).join('');
  const encoder = new TextEncoder();
  const data = encoder.encode(GUEST_PASSPHRASE + saltHex);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');

  await set(ref(db, 'upbox/guestSession'), {
    hash: hashHex,
    salt: saltHex,
    expiresAt: Date.now() + SESSION_DURATION,
    active: true
  });
  alert(`Guest code generated. It is: ${GUEST_PASSPHRASE}\nTell the other device to type this.`);
}

export async function revokeGuestSession() {
  const { db } = getAppInstances();
  await remove(ref(db, 'upbox/guestSession'));
  await remove(ref(db, 'upbox/approvedGuests'));
}
