export default async function handler(req, res) {
  const SILO_ID = '09ac781c-24e0-4e89-893a-9b09fc03fe70';
  const API_KEY = process.env.JSON_SILO_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Missing JSON_SILO_KEY in environment variables' });
  }

  const headers = {
    'X-SILO-KEY': API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (req.method === 'GET') {
    try {
      const response = await fetch(`https://api.jsonsilo.com/public/${SILO_ID}`, { headers });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const response = await fetch(`https://api.jsonsilo.com/public/${SILO_ID}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
