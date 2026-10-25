require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const { router: authRouter } = require('./routes/auth');
const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow any origin for local dev
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin/dashboard', dashboardRouter);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: db.dbType, timestamp: new Date() });
});

// Serve static frontend in production (optional, we will run separately for development)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Start database migrations/seeding and start server
db.setupDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` eXmart Backend listening on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Database Provider: ${db.dbType}`);
      console.log(`=================================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to database setup failure:', err);
    process.exit(1);
  });
