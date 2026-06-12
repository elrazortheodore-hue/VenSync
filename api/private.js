export default async function handler(req, res) {
  const MASTER_PASSWORD = process.env.MASTER_PASSWORD;
  const clientPass = req.headers['x-ven-pass'];

  if (clientPass !== MASTER_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized: Invalid master password.' });
  }

  const BIN_KEY = process.env.JSONBIN_KEY;
  const BIN_ID = process.env.JSONBIN_ID;
  const url = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

  try {
    // 1. GET: Fetch paginated messages, filter by category, or export full database
    if (req.method === 'GET') {
      const r = await fetch(`${url}/latest`, { headers: { 'X-Master-Key': BIN_KEY } });
      const data = await r.json();
      const record = data.record || {};
      const allMessages = record.messages || [];

      const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
      const category = req.query.category || null;

      // Filter by category if requested
      let filtered = allMessages;
      if (category && category !== 'all') {
        filtered = allMessages.filter(m => m.category === category);
      }

      // Sort newest-first
      filtered.sort((a, b) => b.timestamp - a.timestamp);

      if (limit !== null) {
        const sliced = filtered.slice(offset, offset + limit);
        return res.status(200).json({
          messages: sliced,
          hasMore: offset + limit < filtered.length,
          isPublicEnabled: record.isPublicEnabled !== undefined ? record.isPublicEnabled : true,
          categories: [...new Set(allMessages.map(m => m.category).filter(Boolean))].sort()
        });
      } else {
        // Return full database for exports
        return res.status(200).json(record);
      }
    } 
    
    // 2. POST: Append a new message card to JSONBin
    else if (req.method === 'POST') {
      const newMessage = req.body;
      if (!newMessage.id) {
        return res.status(400).json({ error: 'Message ID required' });
      }

      // Fetch latest database
      const rGet = await fetch(`${url}/latest`, { headers: { 'X-Master-Key': BIN_KEY } });
      const db = await rGet.json();
      const record = db.record || { messages: [], isPublicEnabled: true };
      if (!record.messages) record.messages = [];

      record.messages.unshift(newMessage);

      // Save updated database
      const rPut = await fetch(url, {
        method: 'PUT',
        headers: { 'X-Master-Key': BIN_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      await rPut.json();
      return res.status(200).json({ success: true, message: newMessage });
    } 
    
    // 3. PATCH: Update a specific card's values or public switch setting
    else if (req.method === 'PATCH') {
      const { id, isPublicEnabled, ...fieldsToUpdate } = req.body;

      // Fetch latest database
      const rGet = await fetch(`${url}/latest`, { headers: { 'X-Master-Key': BIN_KEY } });
      const db = await rGet.json();
      const record = db.record || { messages: [], isPublicEnabled: true };
      if (!record.messages) record.messages = [];

      let updatedFields = {};

      if (id) {
        // Update specific card
        const idx = record.messages.findIndex(m => m.id === id);
        if (idx !== -1) {
          record.messages[idx] = { ...record.messages[idx], ...fieldsToUpdate };
          updatedFields = record.messages[idx];
        } else {
          return res.status(404).json({ error: 'Message card not found' });
        }
      }

      if (isPublicEnabled !== undefined) {
        record.isPublicEnabled = isPublicEnabled;
        updatedFields.isPublicEnabled = isPublicEnabled;
      }

      // Save database
      await fetch(url, {
        method: 'PUT',
        headers: { 'X-Master-Key': BIN_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });

      return res.status(200).json({ success: true, updated: updatedFields });
    } 
    
    // 4. DELETE: Remove a message card by ID
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'ID parameter required' });
      }

      // Fetch latest database
      const rGet = await fetch(`${url}/latest`, { headers: { 'X-Master-Key': BIN_KEY } });
      const db = await rGet.json();
      const record = db.record || { messages: [], isPublicEnabled: true };
      if (!record.messages) record.messages = [];

      record.messages = record.messages.filter(m => m.id !== id);

      // Save database
      await fetch(url, {
        method: 'PUT',
        headers: { 'X-Master-Key': BIN_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });

      return res.status(200).json({ success: true, deletedId: id });
    } 
    
    // 5. PUT: Full database import / restore from backup
    else if (req.method === 'PUT') {
      const record = req.body;
      if (!record.messages) {
        return res.status(400).json({ error: 'Invalid database structure: messages array required.' });
      }

      const rPut = await fetch(url, {
        method: 'PUT',
        headers: { 'X-Master-Key': BIN_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      const data = await rPut.json();
      return res.status(200).json(data.record);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
