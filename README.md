# VenSync | Industrial-Grade Serverless PWA Synchronization Pad

VenSync is a highly secure, real-time synchronization pad architected for zero-latency data broadcasting and cooperative task tracking across public and private channels. Built on a **Hard-Decoupled Serverless Architecture** running on Vercel's Edge Network, VenSync leverages Progressive Web App (PWA) standards to deliver a fully functional offline-first user experience. 

---

## Architectural Principles

### 1. Zero-Trust Serverless Isolation
To prevent client-side JavaScript bypasses and DOM inspection vulnerabilities, VenSync physically decouples administrative capabilities:
- **Public Mode (`/public` or `/`)**: Served dynamically by `/api/public_page`. It returns a fully self-contained HTML document (exceeding 1,500 lines of code) containing all essential styles and scripts inline. Public users can browse public-tagged cards, filter by category channels, search, and submit new public cards. Administrative elements, editing functions, and private messages are completely absent from the served markup, ensuring that private data is never exposed over the wire.
- **Private Mode (`/private`)**: Served from `/private.html`. It acts as the secure "Sudo Mode" dashboard. Access requires authentication against the master passphrase. Once unlocked, the owner has full read/write controls, including classification categorization, task status updates, editing, purging, public visibility toggles, and database import/export backups.

### 2. Hard-Decoupled Serverless APIs
The Node.js serverless functions in the `/api` directory serve as the secure gatekeeper:
- `/api/private.js`: Mandates the `X-Ven-Pass` validation matching the secret `MASTER_PASSWORD` environment variable. It processes paginated card reads, category-channel filtering, individual card updates (PATCH), deletions (DELETE), and full database backup restores (PUT).
- `/api/public.js`: First validates if the public access switch is enabled. If allowed, it serves *only* messages tagged with `pubTag = 'public'` (GET) and processes append-only message submissions (POST), forcing public tags.

### 3. PWA Offline-First & Stagnant Queueing
VenSync operates seamlessly in disconnected environments by utilizing standard web service worker caching and local storage queues:
- **Service Worker (`sw.js`)**: Implements a network-first strategy for HTML pages (ensuring master access switches are evaluated live) and cache-first strategies for static assets (favicon, manifest, stylesheets). Bypasses caching for all dynamic API endpoints (`/api/*`).
- **Offline UI States**: When the browser is offline (`navigator.onLine === false`), the user is not blocked from typing or sending messages. Messages are queued immediately in the local store (`vs_offline_queue` for private, `vs_public_offline_queue` for public).
- **Stagnant Grey Styling**: Queued messages are rendered immediately into the chat timeline using a customized WhatsApp-like pending style. These bubbles are styled in a muted, stagnant "cemented" grey (`.offline-pending`) with italicized text and an "Offline Queue" badge to visually denote that the transmission is pending sync.
- **Automatic Online Sync**: The client listens to the native browser `online` event. As soon as connectivity is restored, the queue is processed in chronological order. Each message is uploaded to Vercel, removed from the local queue, and seamlessly transitioned to "Synced" state with a success toast notification.

---

## Technology Stack

- **Cloud Platform**: Vercel Serverless & Edge Network
- **Frontend Core**: HTML5, CSS3, ES6 JavaScript (Inlined for maximum self-containment and offline reliability)
- **Database Engine**: JSONBin.io (Unified datastore for configuration state and encrypted message array)
- **Design System**: Mobile-First design, glassmorphism UI elements, dark/light theme tokens, and CSS safe-area handling for mobile viewport fits.

---

## Repository Cleanliness
To maintain pristine code hygiene and prevent duplicate asset sync errors, all client-side JavaScript controllers have been compiled and inline-engineered into the main HTML nodes (`private.html` and `api/public_page.js`). The redundant `/js` directory has been removed.

---

## Deployment Prerequisites

To deploy your own VenSync terminal, register the project on Vercel and define the following Vercel Environment Variables:

1. `MASTER_PASSWORD`: Your alphanumeric passphrase required to authenticate Sudo mode.
2. `JSONBIN_ID`: The target database Bin ID on JSONBin.io.
3. `JSONBIN_KEY`: Your secret API master key on JSONBin.io (`X-Master-Key`).

Once configured, pushes to the GitHub repository automatically trigger Vercel CDN builds.
