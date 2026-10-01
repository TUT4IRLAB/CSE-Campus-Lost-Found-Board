const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/authMiddleware'); // Import our guard middleware

// 1. POST A LOST OR FOUND ITEM (Protected Route)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, type, location, date_recorded, image_url } = req.body;
    const userId = req.user.id; // Automatically grabbed from the verified JWT token

    const newItem = await db.query(
      `INSERT INTO items (title, description, type, location, date_recorded, image_url, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, description, type, location, date_recorded, image_url, userId]
    );

    res.status(201).json({ message: 'Notice posted successfully!', item: newItem.rows[0] });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error while posting item.');
  }
});

// 2. BROWSE, SEARCH, AND FILTER ITEMS (Public Route)
router.get('/', async (req, res) => {
  try {
    const { search, type } = req.query;
    let queryText = 'SELECT * FROM items WHERE status = \'active\'';
    let queryParams = [];
    let paramIndex = 1;

    // Filter by Lost or Found type if provided
    if (type) {
      queryText += ` AND type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    // Filter by Search string (matching title or description) if provided
    if (search) {
      queryText += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`); // The % allows partial matches
      paramIndex++;
    }

    // Sort by newest postings first
    queryText += ' ORDER BY created_at DESC';

    const itemsResult = await db.query(queryText, queryParams);
    res.json(itemsResult.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error while fetching notices.');
  }
});

// 3. MARK AN ITEM AS RESOLVED (Protected Route)
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id;

    // First check if the item exists and belongs to the logged-in student
    const itemCheck = await db.query('SELECT * FROM items WHERE id = $1', [itemId]);
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Item posting not found.' });
    }

    if (itemCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized. You can only resolve your own postings.' });
    }

    // Update status to resolved
    await db.query('UPDATE items SET status = \'resolved\' WHERE id = $1', [itemId]);

    res.json({ message: 'Item status updated to resolved successfully!' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error while updating item status.');
  }
});

module.exports = router;
