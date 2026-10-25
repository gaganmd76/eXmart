const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('./auth');

// GET /api/products
// Fetch all products (supports category and search filtering)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM products WHERE is_available = 1 OR is_available = true';
    const params = [];

    // Simple dynamic SQL builder
    if (category && search) {
      sql += ' AND category = $1 AND name LIKE $2';
      params.push(category, `%${search}%`);
    } else if (category) {
      sql += ' AND category = $1';
      params.push(category);
    } else if (search) {
      sql += ' AND name LIKE $1';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY id DESC';

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/admin/products (Admin view including unavailable items)
router.get('/admin-all', requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Admin fetch products error:', err);
    res.status(500).json({ error: 'Failed to fetch products for admin' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch single product error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/admin/products (Admin only)
router.post('/admin', requireAdmin, async (req, res) => {
  try {
    const { name, category, price, stock_quantity, unit, image_url, is_available } = req.body;

    if (!name || !category || price === undefined || stock_quantity === undefined || !unit) {
      return res.status(400).json({ error: 'Name, category, price, stock, and unit are required' });
    }

    const availableVal = is_available === false ? 0 : 1;

    const result = await db.query(
      `INSERT INTO products (name, category, price, stock_quantity, unit, image_url, is_available) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, category, price, stock_quantity, unit, image_url || null, availableVal]
    );

    let newProduct;
    if (result.rows && result.rows[0] && result.rows[0].id) {
      newProduct = result.rows[0];
    } else {
      const lastID = result.lastID;
      const fetchNewProd = await db.query('SELECT * FROM products WHERE id = $1', [lastID]);
      newProduct = fetchNewProd.rows[0];
    }

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id (Admin only)
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, stock_quantity, unit, image_url, is_available } = req.body;

    // Check if product exists
    const checkProduct = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (checkProduct.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentProd = checkProduct.rows[0];
    const availableVal = is_available === undefined ? currentProd.is_available : (is_available ? 1 : 0);

    await db.query(
      `UPDATE products 
       SET name = $1, category = $2, price = $3, stock_quantity = $4, unit = $5, image_url = $6, is_available = $7 
       WHERE id = $8`,
      [
        name || currentProd.name,
        category || currentProd.category,
        price !== undefined ? price : currentProd.price,
        stock_quantity !== undefined ? stock_quantity : currentProd.stock_quantity,
        unit || currentProd.unit,
        image_url !== undefined ? image_url : currentProd.image_url,
        availableVal,
        id
      ]
    );

    const updatedResult = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product updated successfully', product: updatedResult.rows[0] });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id (Admin only)
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const checkProduct = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (checkProduct.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully', id });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
