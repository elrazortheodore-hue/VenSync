import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { initUI } from "./ui-controller.js";

const CONFIG = {
  ALLOWED_EMAIL: 'your@gmail.com', // YOU MUST CHANGE THIS
  FIREBASE: {
    apiKey: "AIzaSyCXucunQzPCIMgsp0Y2TS9jaUy7Hs7spps",
    authDomain: "upbox-6ae1c.firebaseapp.com",
    projectId: "upbox-6ae1c",
    storageBucket: "upbox-6ae1c.firebasestorage.app",
    messagingSenderId: "550686984100",
    appId: "1:550686984100:web:cf45f0bf4768e5591da331",
    measurementId: "G-VNP7R4LNNR",
    databaseURL: "https://upbox-6ae1c-default-rtdb.firebaseio.com"
  }
};

const app = initializeApp(CONFIG.FIREBASE);
const auth = getAuth(app);
const db = getDatabase(app);
setPersistence(auth, browserLocalPersistence);

export const getAppInstances = () => ({ app, auth, db, CONFIG });

async function loadFragments() {
  const container = document.getElementById('app-container');
  const [authHtml, mainHtml] = await Promise.all([
    fetch('/auth-screens.html').then(r => r.text()),
    fetch('/main-app.html').then(r => r.text())
  ]);
  container.innerHTML = authHtml + mainHtml;
  
  if (window.lucide) window.lucide.createIcons();
  bootstrapAuth();
}

function bootstrapAuth() {
  const screenLoading = document.getElementById('screen-loading');
  const screenAuth = document.getElementById('screen-auth');
  const screenGuest = document.getElementById('screen-guest');
  const authError = document.getElementById('auth-error');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (user.email === CONFIG.ALLOWED_EMAIL) {
        initUI(true); // isOwner = true
      } else {
        await signOut(auth);
        authError.textContent = "This account is not authorized.";
        screenAuth.style.display = 'flex';
        screenLoading.style.opacity = '0';
        setTimeout(() => { screenLoading.style.display = 'none'; }, 300);
      }
    } else {
      if (sessionStorage.getItem('vs_guest_valid')) {
        import('./guest-engine.js').then(m => m.startGuestSession());
      } else {
        const snapshot = await get(ref(db, 'upbox/guestSession'));
        if (snapshot.exists() && snapshot.val().active) {
          screenGuest.style.display = 'flex';
          import('./guest-engine.js').then(m => m.setupGuestLogin());
        } else {
          screenAuth.style.display = 'flex';
        }
        screenLoading.style.opacity = '0';
        setTimeout(() => { screenLoading.style.display = 'none'; }, 300);
      }
    }
  });

  document.getElementById('btn-google-auth').addEventListener('click', () => {
    signInWithPopup(auth, new GoogleAuthProvider()).catch(err => {
      authError.textContent = err.message;
      setTimeout(() => authError.textContent = '', 3000);
    });
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}

loadFragments();
