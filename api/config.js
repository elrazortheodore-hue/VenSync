export default async function handler(req, res) {
  // This endpoint is completely unauthenticated and read-only.
  // It fetches the private JSONBin but STRIPS all messages,
  // exposing ONLY the global configuration state (isPublicEnabled) 
  // so the frontend knows whether to show the public mode.

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const BIN_ID = process.env.JSONBIN_ID;
  const API_KEY = process.env.JSONBIN_KEY;

  if (!BIN_ID || !API_KEY) {
    return res.status(500).json({ error: 'Server Configuration Error' });
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': API_KEY
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Upstream Error' });
    }

    const json = await response.json();
    
    // Default to true if the property doesn't exist yet for backwards compatibility
    const isPublicEnabled = json.record.isPublicEnabled !== undefined ? json.record.isPublicEnabled : true;

    // NEVER return the messages array here!
    return res.status(200).json({ isPublicEnabled });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch config' });
  }
}
