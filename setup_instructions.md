# VenSync Firebase Setup Instructions

Follow these exact steps to configure your Firebase project. This must be done manually in the Firebase Console.

## Step 1: Initialize the Database
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click on your project: **upbox-6ae1c**
3. In the left sidebar menu, click **Build** → **Realtime Database**
4. If you haven't created it yet, click **Create Database**. 
5. Choose your region (e.g., `us-central1`).
6. Start in **Locked mode**.

## Step 2: Apply the Security Rules
1. In the Realtime Database page, click the **Rules** tab at the top.
2. Delete everything in the text box.
3. Paste this exactly:
```json
{
  "rules": {
    "upbox": {
      "messages": {
        ".read": "auth != null || root.child('upbox/guestSession/active').val() === true",
        ".write": "auth != null || root.child('upbox/guestSession/active').val() === true"
      },
      "guestSession": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```
4. Click the blue **Publish** button.

## Step 3: Enable Google Authentication
1. On the left sidebar menu, click **Build** → **Authentication**.
2. Click the **Get started** button.
3. Click on the **Sign-in method** tab.
4. Under "Additional providers", click **Google**.
5. Toggle the **Enable** switch in the top right.
6. Select a **Project support email** from the dropdown (your email).
7. Click **Save**.

## Step 4: Whitelist Your Vercel Domain
Firebase will block login attempts from unknown websites. We must tell it to trust Vercel.
1. Still in the **Authentication** section, click the **Settings** tab.
2. Click on **Authorized domains** in the left sub-menu.
3. Click **Add domain**.
4. Type `vensync.vercel.app` and click **Add**.
5. Click **Add domain** again and type `localhost` (for local testing).
