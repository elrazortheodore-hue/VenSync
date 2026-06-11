export default async function handler(req, res) {
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
