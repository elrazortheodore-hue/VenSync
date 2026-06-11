export default async function handler(req, res) {
  const BIN_KEY = process.env.JSONBIN_KEY;
  const BIN_ID = process.env.JSONBIN_ID;
  const url = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

  try {
    if (req.method === 'GET') {
      const r = await fetch(url, { headers: { 'X-Master-Key': BIN_KEY } });
      const data = await r.json();
      return res.status(200).json(data.record);
    } else if (req.method === 'PUT') {
      const r = await fetch(url, {
        method: 'PUT',
        headers: { 'X-Master-Key': BIN_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await r.json();
      return res.status(200).json(data.record);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
