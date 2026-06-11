export default async function handler(req, res) {
  // DOUBLE-LOCK MECHANISM
  // Check the private Master Switch before serving or accepting any public data
  const BIN_ID = process.env.JSONBIN_ID;
  const BIN_KEY = process.env.JSONBIN_KEY;

  try {
    const configCheck = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': BIN_KEY }
    });
    
    if (configCheck.ok) {
      const configData = await configCheck.json();
      if (configData.record.isPublicEnabled === false) {
        return res.status(403).json({ error: 'Forbidden: Public Mode is locked by the administrator.' });
      }
    }
  } catch (err) {
    // If the config check fails, fail closed for security
    return res.status(500).json({ error: 'Failed to verify global config' });
  }

  // If public is enabled, proceed with normal JSonSilo proxying
  const SILO_KEY = process.env.SILO_KEY;
  const SILO_ID = process.env.SILO_ID;
  const url = `https://api.jsonsilo.com/${SILO_ID}`;

  try {
    if (req.method === 'GET') {
      const r = await fetch(url, { headers: { 'X-SILO-KEY': SILO_KEY } });
      const data = await r.json();
      return res.status(200).json(data);
    } else if (req.method === 'PUT') {
      const r = await fetch(url, {
        method: 'PUT',
        headers: { 'X-SILO-KEY': SILO_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await r.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
