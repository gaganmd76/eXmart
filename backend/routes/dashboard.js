const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('./auth');

// GET /api/admin/dashboard/sales-summary
router.get('/sales-summary', requireAdmin, async (req, res) => {
  try {
    // 1. Calculate today's date range (in local date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Since we store timestamps, we can query orders created today
    const todayStr = today.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const startOfToday = `${todayStr} 00:00:00`;

    // 2. Fetch total orders today
    // We count orders placed today
    const totalOrdersTodayResult = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE created_at >= $1`,
      [startOfToday]
    );
    const totalOrdersToday = parseInt(totalOrdersTodayResult.rows[0].count || totalOrdersTodayResult.rows[0].COUNT || 0, 10);

    // 3. Fetch total revenue today
    // We sum total_amount of orders placed today (that are not cancelled/failed)
    const totalRevenueTodayResult = await db.query(
      `SELECT SUM(total_amount) as revenue FROM orders WHERE created_at >= $1 AND payment_status != 'FAILED'`,
      [startOfToday]
    );
    const totalRevenueToday = parseFloat(totalRevenueTodayResult.rows[0].revenue || totalRevenueTodayResult.rows[0].REVENUE || 0);

    // 4. Fetch overall total orders and total revenue (for dashboard context)
    const overallStatsResult = await db.query(
      `SELECT COUNT(*) as count, SUM(total_amount) as revenue FROM orders WHERE payment_status != 'FAILED'`
    );
    const overallOrders = parseInt(overallStatsResult.rows[0].count || overallStatsResult.rows[0].COUNT || 0, 10);
    const overallRevenue = parseFloat(overallStatsResult.rows[0].revenue || overallStatsResult.rows[0].REVENUE || 0);

    // 5. Fetch best-selling products
    // Group by product, order by quantity sum descending
    const bestSellersResult = await db.query(
      `SELECT p.name, p.category, p.unit, p.price, SUM(oi.quantity) as total_qty_sold, SUM(oi.quantity * oi.price_at_order) as total_sales
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.payment_status != 'FAILED'
       GROUP BY p.id, p.name, p.category, p.unit, p.price
       ORDER BY total_qty_sold DESC
       LIMIT 5`
    );

    // 6. Fetch low stock items count
    const lowStockResult = await db.query(
      `SELECT COUNT(*) as count FROM products WHERE stock_quantity < 10 AND is_available = 1`
    );
    const lowStockCount = parseInt(lowStockResult.rows[0].count || lowStockResult.rows[0].COUNT || 0, 10);

    res.json({
      today: {
        orders: totalOrdersToday,
        revenue: totalRevenueToday
      },
      overall: {
        orders: overallOrders,
        revenue: overallRevenue
      },
      bestSellers: bestSellersResult.rows,
      lowStockCount
    });
  } catch (err) {
    console.error('Fetch sales summary error:', err);
    res.status(500).json({ error: 'Failed to fetch sales summary data' });
  }
});

module.exports = router;
