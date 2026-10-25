const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');

// GET /api/cart
// Fetch all cart items for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.id, c.product_id, c.quantity, p.name, p.category, p.price, p.unit, p.image_url, p.stock_quantity 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch cart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart items' });
  }
});

// POST /api/cart
// Add item to cart or update quantity if it exists
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id || quantity === undefined || quantity <= 0) {
      return res.status(400).json({ error: 'Valid product_id and quantity > 0 are required' });
    }

    // Check if product exists and is available
    const productCheck = await db.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productCheck.rows[0];
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: `Only ${product.stock_quantity} item(s) available in stock` });
    }

    // Check if item already exists in user's cart
    const cartCheck = await db.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );

    if (cartCheck.rowCount > 0) {
      // Update quantity
      await db.query(
        'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
        [quantity, req.user.id, product_id]
      );
    } else {
      // Insert new item
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.id, product_id, quantity]
      );
    }

    // Return the updated cart items
    const updatedCart = await db.query(
      `SELECT c.id, c.product_id, c.quantity, p.name, p.category, p.price, p.unit, p.image_url, p.stock_quantity 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    res.json({ message: 'Cart updated successfully', cart: updatedCart.rows });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:productId
// Remove specific product from user's cart
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const check = await db.query('SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.user.id, productId]);
    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Item not in cart' });
    }

    await db.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.user.id, productId]);

    // Return updated cart
    const updatedCart = await db.query(
      `SELECT c.id, c.product_id, c.quantity, p.name, p.category, p.price, p.unit, p.image_url, p.stock_quantity 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    res.json({ message: 'Item removed from cart', cart: updatedCart.rows });
  } catch (err) {
    console.error('Remove cart item error:', err);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// DELETE /api/cart
// Clear all items in user's cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Cart cleared successfully', cart: [] });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
