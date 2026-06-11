# VenSync | Industrial-Grade Serverless Synchronization Terminal

## Architecture and Overview

VenSync is a highly secure, dual-node synchronization terminal architected for zero-latency data broadcasting across isolated public and private networks. Moving away from monolithic client-side applications, VenSync utilizes a **Hard-Decoupled Serverless Architecture** running on Vercel's Edge Network. 

By enforcing strict separation of concerns, the application operates with pure, un-bypassable server-side interception mechanisms to ensure maximum security, scalability, and code hygiene.

## Architectural Paradigm

### 1. Hard Decoupling (UI Separation)
To prevent JavaScript circumvention and DOM manipulation exploits, the application interface is physically segregated into two distinct shells:
- `/public` (`public.html`): A completely logic-less, unauthenticated broadcast viewer. It contains zero authentication code or master switches, guaranteeing that public users can never reverse-engineer the private protocols.
- `/private` (`private.html`): The heavily fortified "Sudo Mode" terminal. This interface requires the Master Passphrase to initialize and grants the owner absolute read/write control over both the Private Node and the Public Broadcast Node.

### 2. Vercel Edge Middleware (The Interceptor)
Client-side UI hiding is insecure. VenSync solves this by deploying a root-level **Vercel Edge Middleware** (`middleware.js`). 
- The middleware acts as a network-level firewall. Before the Vercel CDN ever serves `public.html`, the middleware securely queries the Master Configuration Node (`/api/config`).
- If the "Public Broadcast" switch is disabled by the owner, the middleware issues a `307 Temporary Redirect` pushing the visitor to the `/private` authentication trap. 
- **Result**: The public HTML code physically does not reach the client browser when the system is locked down.

### 3. Double-Locked API Layer
The Node.js serverless proxies (`/api/private.js` and `/api/public.js`) act as the absolute source of truth.
- The `api/private` node exclusively authenticates against the `MASTER_PASSWORD` Vercel Environment Variable.
- The `api/public` node is double-locked. Before processing any public data synchronization, it pings the Master Configuration. If the system is in lockdown, it violently rejects all requests with a `403 Forbidden` status. 

## Technology Stack

- **Edge Infrastructure**: Vercel Edge Middleware for network interception and routing.
- **Backend Proxies**: Node.js Serverless Functions for secure API masking and credential injection.
- **Frontend Core**: Vanilla HTML5, Vanilla CSS3 (Extracted to `css/style.css`), Vanilla ES6 Modules (`js/public.js`, `js/private.js`).
- **Datastores**: `jsonbin.io` (Secure Private Node & Config Matrix), `jsonsilo.com` (Volatile Public Broadcast Node).
- **Design System**: Mobile-first glassmorphism, fluid typography (Inter & JetBrains Mono), CSS `env(safe-area-inset)` handling for native-app feeling.

## Deployment Prerequisites

To initialize the Vercel deployment instance, the following strict Environment Variables MUST be defined in the cloud console:

1. `MASTER_PASSWORD` - Your alphanumeric security key for Sudo Mode access.
2. `JSONBIN_ID` - The Bin ID of your private JSONbin.io node.
3. `JSONBIN_KEY` - The `X-Master-Key` required to unlock the JSONbin.io node.
4. `SILO_ID` - The unique ID of your public JSONSilo broadcast node.
5. `SILO_KEY` - The `X-SILO-KEY` required to write to the JSONSilo.

> **Security Note:** The previously utilized Web Crypto API local hashing mechanism has been entirely deprecated in favor of this highly superior, zero-trust server-side Vercel validation architecture.
