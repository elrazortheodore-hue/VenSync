export const config = {
  matcher: ['/', '/public', '/public.html'],
};

export default async function middleware(request) {
  const url = new URL(request.url);

  try {
    // We cannot easily use process.env here if it's Edge Middleware and depends on JSONBin,
    // but we can just fetch from our own /api/config endpoint!
    // Since Edge Middleware runs on the same domain, we can construct the absolute URL:
    const configUrl = new URL('/api/config', request.url);
    const r = await fetch(configUrl.toString());
    
    if (r.ok) {
      const configData = await r.json();
      if (configData.isPublicEnabled === false) {
        // Intercept and redirect immediately to the private Sudo mode
        return Response.redirect(new URL('/private', request.url), 307);
      }
    }
  } catch (error) {
    // If the config fetch fails, default to strict mode (redirect to private)
    return Response.redirect(new URL('/private', request.url), 307);
  }

  // If public is enabled or we couldn't determine (failsafe), proceed as normal
  return Response.next();
}
