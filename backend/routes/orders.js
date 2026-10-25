const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('./auth');

// POST /api/orders
// Create a new order from user's cart
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { payment_mode, delivery_address } = req.body;

    if (!payment_mode || !delivery_address) {
      return res.status(400).json({ error: 'Payment mode and delivery address are required' });
    }

    // 1. Fetch user's cart items
    const cartResult = await db.query(
      `SELECT c.product_id, c.quantity, p.name, p.price, p.stock_quantity, p.is_available 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rowCount === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartItems = cartResult.rows;
    let totalAmount = 0;

    // 2. Validate stock and availability
    for (const item of cartItems) {
      if (!item.is_available) {
        return res.status(400).json({ error: `Product "${item.name}" is no longer available` });
      }
      if (item.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${item.name}". Available: ${item.stock_quantity}, Requested: ${item.quantity}` });
      }
      totalAmount += parseFloat(item.price) * item.quantity;
    }

    // 3. Create order record
    const paymentStatus = payment_mode === 'ONLINE' ? 'PENDING' : 'PENDING'; // ONLINE starts as PENDING until verified, COD as PENDING
    const orderStatus = 'PLACED';

    const orderResult = await db.query(
      `INSERT INTO orders (user_id, total_amount, payment_mode, payment_status, order_status, delivery_address) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.user.id, totalAmount, payment_mode, paymentStatus, orderStatus, delivery_address]
    );

    let orderId;
    if (orderResult.rows && orderResult.rows[0] && orderResult.rows[0].id) {
      orderId = orderResult.rows[0].id;
    } else {
      orderId = orderResult.lastID;
    }

    // 4. Create order items & Decrement stock
    for (const item of cartItems) {
      // Insert order item
      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_order) 
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      // Decrement product stock
      const newStock = item.stock_quantity - item.quantity;
      await db.query(
        `UPDATE products SET stock_quantity = $1 WHERE id = $2`,
        [newStock, item.product_id]
      );
    }

    // 5. Clear user's cart
    await db.query(`DELETE FROM cart_items WHERE user_id = $1`, [req.user.id]);

    res.status(201).json({
      message: 'Order placed successfully',
      orderId,
      totalAmount,
      orderStatus
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  }
});

// GET /api/orders/my
// Get current customer's order history
router.get('/my', authenticateToken, async (req, res) => {
  try {
    // Get orders
    const ordersResult = await db.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC`,
      [req.user.id]
    );

    const orders = ordersResult.rows;

    // For each order, fetch items
    const ordersWithItems = [];
    for (const order of orders) {
      const itemsResult = await db.query(
        `SELECT o.*, p.name, p.unit, p.image_url, p.category 
         FROM order_items o 
         JOIN products p ON o.product_id = p.id 
         WHERE o.order_id = $1`,
        [order.id]
      );
      ordersWithItems.push({
        ...order,
        items: itemsResult.rows
      });
    }

    res.json(ordersWithItems);
  } catch (err) {
    console.error('Fetch customer orders error:', err);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// GET /api/admin/orders (Admin only: view all orders)
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const ordersResult = await db.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.id DESC`
    );

    const orders = ordersResult.rows;
    const ordersWithItems = [];

    for (const order of orders) {
      const itemsResult = await db.query(
        `SELECT o.*, p.name, p.unit, p.image_url, p.category 
         FROM order_items o 
         JOIN products p ON o.product_id = p.id 
         WHERE o.order_id = $1`,
        [order.id]
      );
      ordersWithItems.push({
        ...order,
        items: itemsResult.rows
      });
    }

    res.json(ordersWithItems);
  } catch (err) {
    console.error('Admin fetch orders error:', err);
    res.status(500).json({ error: 'Failed to fetch all orders' });
  }
});

// PUT /api/admin/orders/:id/status (Admin only: update order status)
router.put('/admin/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    if (!order_status && !payment_status) {
      return res.status(400).json({ error: 'Order status or payment status is required' });
    }

    const checkOrder = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (checkOrder.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = checkOrder.rows[0];
    const newOrderStatus = order_status || currentOrder.order_status;
    const newPaymentStatus = payment_status || currentOrder.payment_status;

    await db.query(
      `UPDATE orders SET order_status = $1, payment_status = $2 WHERE id = $3`,
      [newOrderStatus.toUpperCase(), newPaymentStatus.toUpperCase(), id]
    );

    res.json({
      message: 'Order updated successfully',
      orderId: id,
      order_status: newOrderStatus.toUpperCase(),
      payment_status: newPaymentStatus.toUpperCase()
    });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
