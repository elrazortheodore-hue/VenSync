export default async function handler(req, res) {
  if (req.query.ping === 'true') {
    return res.status(200).json({ success: true, status: 'online' });
  }

  const BIN_KEY = process.env.JSONBIN_KEY;
  const BIN_ID = process.env.JSONBIN_ID;
  const url = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

  try {
    // 1. Fetch latest database to check configuration
    const rGet = await fetch(`${url}/latest`, { headers: { 'X-Master-Key': BIN_KEY } });
    const db = await rGet.json();
    const record = db.record || { messages: [], isPublicEnabled: true };

    const isPublicEnabled = record.isPublicEnabled !== undefined ? record.isPublicEnabled : true;
    if (!isPublicEnabled) {
      return res.status(403).json({ error: 'Forbidden: Public channel is currently locked.' });
    }

    // 2. GET: Load public messages paginated, filter by category
    if (req.method === 'GET') {
      const allMessages = record.messages || [];
      const publicCategories = record.publicCategories || ['General'];

      const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
      const category = req.query.category || null;

      // Strict query verification block: if they ask for a private category, block them
      if (category && category !== 'all' && !publicCategories.includes(category)) {
        return res.status(403).json({ error: 'Access Denied: Private Channel' });
      }

      // Server-side filter to only allow public tagged items in public categories
      const publicMessages = allMessages.filter(m => m.pubTag === 'public' && publicCategories.includes(m.category || 'General'));

      // Filter by category if requested
      let filtered = publicMessages;
      if (category && category !== 'all') {
        filtered = publicMessages.filter(m => m.category === category);
      }

      // Sort newest-first
      filtered.sort((a, b) => b.timestamp - a.timestamp);

      if (limit !== null) {
        const sliced = filtered.slice(offset, offset + limit);
        return res.status(200).json({
          messages: sliced,
          hasMore: offset + limit < filtered.length,
          categories: publicCategories
        });
      } else {
        return res.status(200).json({ messages: filtered });
      }
    } 
    
    // 3. POST: Append-only posting for public users
    else if (req.method === 'POST') {
      const { text, type, title, category } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Message text content is required.' });
      }

      // Construct a safe public-tagged message card
      const newMsg = {
        id: 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5),
        text: text,
        type: type || 'text',
        title: title || '',
        timestamp: Date.now(),
        pubTag: 'public', // force public tag status
        status: 'Pending',
        category: category || 'General'
      };

      if (!record.messages) record.messages = [];
      record.messages.unshift(newMsg);

      // Save database
      await fetch(url, {
        method: 'PUT',
        headers: { 'X-Master-Key': BIN_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });

      return res.status(200).json({ success: true, message: newMsg });
    } 
    
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
