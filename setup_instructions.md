# VenSync Exhaustive Setup Instructions

Follow these exact steps to configure your project on Firebase and Vercel.

## PART 1: Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click on your project: **upbox-6ae1c**
3. In the left sidebar, click **Build** → **Realtime Database**
4. If you haven't created it yet, click **Create Database**. Choose your region (e.g., `us-central1`), and start in **Locked mode**.
5. Click the **Rules** tab, delete everything, and paste this exactly:
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
6. Click the blue **Publish** button.
7. Go to **Build** → **Authentication**. Click **Get started**.
8. Go to the **Sign-in method** tab. Click **Google**. Enable it, set your Project support email, and click **Save**.
9. In the **Authentication** section, click the **Settings** tab. Click **Authorized domains**. Click **Add domain**. Type `vensync.vercel.app` and click Add. Add `localhost` as well.

## PART 2: Vercel Dashboard Setup
Since your code is now pushed to GitHub, Vercel will seamlessly deploy it.
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New → Project**
3. Import your GitHub repository: **VenSync**
4. **Framework Preset:** Select **Other** (do NOT select Next.js, this is a pure HTML app).
5. **Build Command:** Leave empty.
6. **Output Directory:** Leave as `./` or blank.
7. Click **Deploy**.

Once deployment finishes, you can visit `vensync.vercel.app` and your fractured, obfuscated application will boot seamlessly.
