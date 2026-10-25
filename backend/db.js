const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL;

let dbType = 'sqlite';
let pgPool = null;
let sqliteDb = null;

// Initialize connection
if (dbUrl) {
  try {
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    });
    dbType = 'postgres';
    console.log('Database: Attempting to connect to PostgreSQL...');
  } catch (err) {
    console.warn('PostgreSQL connection setup failed. Falling back to SQLite.', err.message);
    dbType = 'sqlite';
  }
} else {
  console.log('DATABASE_URL not set. Using SQLite fallback.');
  dbType = 'sqlite';
}

if (dbType === 'sqlite') {
  const dbFile = path.resolve(__dirname, 'exmart.db');
  sqliteDb = new sqlite3.Database(dbFile, (err) => {
    if (err) {
      console.error('Failed to open SQLite database:', err.message);
    } else {
      console.log(`Database: Connected to SQLite database at ${dbFile}`);
    }
  });
  // Enable foreign key constraints in SQLite
  sqliteDb.run('PRAGMA foreign_keys = ON');
}

// Database query wrapper
async function query(sql, params = []) {
  if (dbType === 'postgres') {
    try {
      const res = await pgPool.query(sql, params);
      return { rows: res.rows, rowCount: res.rowCount };
    } catch (err) {
      console.error('PostgreSQL Query Error:', err.message, '\nSQL:', sql, '\nParams:', params);
      throw err;
    }
  } else {
    // SQLite: map PG-style $1, $2 placeholders to ?
    // Replace all $N with ?
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    return new Promise((resolve, reject) => {
      // Determine if it is a SELECT query
      const isSelect = sqliteSql.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        sqliteDb.all(sqliteSql, params, (err, rows) => {
          if (err) {
            console.error('SQLite Select Error:', err.message, '\nSQL:', sqliteSql, '\nParams:', params);
            reject(err);
          } else {
            resolve({ rows, rowCount: rows.length });
          }
        });
      } else {
        sqliteDb.run(sqliteSql, params, function (err) {
          if (err) {
            console.error('SQLite Run Error:', err.message, '\nSQL:', sqliteSql, '\nParams:', params);
            reject(err);
          } else {
            // For insert queries, we might want to return lastID as part of rows if requested
            resolve({
              rows: [{ id: this.lastID }],
              rowCount: this.changes,
              lastID: this.lastID
            });
          }
        });
      }
    });
  }
}

// Setup tables and seed data
async function setupDatabase() {
  const createTablesPG = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock_quantity INTEGER NOT NULL,
      unit VARCHAR(50) NOT NULL,
      image_url TEXT,
      is_available BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      total_amount DECIMAL(10,2) NOT NULL,
      payment_mode VARCHAR(50) NOT NULL,
      payment_status VARCHAR(50) NOT NULL,
      order_status VARCHAR(50) NOT NULL,
      delivery_address TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price_at_order DECIMAL(10,2) NOT NULL
    )`
  ];

  const createTablesSQLite = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      address TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL,
      unit TEXT NOT NULL,
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      total_amount REAL NOT NULL,
      payment_mode TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      order_status TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price_at_order REAL NOT NULL
    )`
  ];

  const schemas = dbType === 'postgres' ? createTablesPG : createTablesSQLite;

  console.log(`Running migrations for ${dbType}...`);
  for (const sql of schemas) {
    await query(sql);
  }
  console.log('Database tables verified/created successfully.');

  // Seed Admin user and products if database is empty
  await seedDatabase();
}

async function seedDatabase() {
  // 1. Check if admin exists, seed if not
  const adminCheck = await query(`SELECT * FROM users WHERE email = $1`, ['admin@exmart.com']);
  if (adminCheck.rowCount === 0) {
    const bcrypt = require('bcryptjs');
    const adminHash = await bcrypt.hash('admin123', 10);
    await query(
      `INSERT INTO users (name, email, phone, password_hash, address, role) VALUES ($1, $2, $3, $4, $5, $6)`,
      ['eXmart Admin', 'admin@exmart.com', '9876543210', adminHash, 'eXmart HQ, Bangalore', 'admin']
    );
    console.log('Admin user seeded (admin@exmart.com / admin123)');

    // Seed a standard customer too
    const customerHash = await bcrypt.hash('user123', 10);
    await query(
      `INSERT INTO users (name, email, phone, password_hash, address, role) VALUES ($1, $2, $3, $4, $5, $6)`,
      ['John Doe', 'john@gmail.com', '9999988888', customerHash, '123 Green Lane, Indiranagar, Bangalore', 'customer']
    );
    console.log('Customer user seeded (john@gmail.com / user123)');
  }

  // 2. Check if products exist, seed if not
  const productCheck = await query(`SELECT COUNT(*) as count FROM products`);
  const count = parseInt(productCheck.rows[0].count || productCheck.rows[0].COUNT || 0, 10);
  if (count === 0) {
    console.log('Seeding dummy products...');
    const dummyProducts = [
      // 1. Grains & Staples
      { name: 'Premium Basmati Rice', category: 'Grains & Staples', price: 110.00, stock_quantity: 45, unit: '1kg', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Organic Ashirvaad Atta', category: 'Grains & Staples', price: 260.00, stock_quantity: 30, unit: '5kg', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Premium Toor Dal', category: 'Grains & Staples', price: 145.00, stock_quantity: 50, unit: '1kg', image_url: 'https://images.unsplash.com/photo-1547058881-aa0edd92aab3?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Organic Moong Dal', category: 'Grains & Staples', price: 130.00, stock_quantity: 8, unit: '1kg', image_url: 'https://images.unsplash.com/photo-1547058881-aa0edd92aab3?auto=format&fit=crop&q=80&w=400', is_available: 1 }, // Low stock
      { name: 'Tata Salt Lite', category: 'Grains & Staples', price: 28.00, stock_quantity: 80, unit: '1kg', image_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Madhur Refined Sugar', category: 'Grains & Staples', price: 48.00, stock_quantity: 75, unit: '1kg', image_url: 'https://images.unsplash.com/photo-1581781868512-88f11ca804e6?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Kabuli Chana (Chickpeas)', category: 'Grains & Staples', price: 120.00, stock_quantity: 25, unit: '1kg', image_url: 'https://images.unsplash.com/photo-1585996388964-c2c31c6bd2bd?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Organic Poha (Flattened Rice)', category: 'Grains & Staples', price: 55.00, stock_quantity: 40, unit: '500g', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400', is_available: 1 },

      // 2. Packaged Foods
      { name: 'Oreo Chocolate Biscuits', category: 'Packaged Foods', price: 30.00, stock_quantity: 120, unit: '120g', image_url: 'https://images.unsplash.com/photo-1558961309-dbdf71799aba?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Maggi 2-Minute Masala Noodles', category: 'Packaged Foods', price: 96.00, stock_quantity: 110, unit: '8-Pack', image_url: 'https://images.unsplash.com/photo-1612966608997-300f617300c6?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Lay\'s Classic Salted Chips', category: 'Packaged Foods', price: 20.00, stock_quantity: 90, unit: '50g', image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Kellogg\'s Corn Flakes', category: 'Packaged Foods', price: 185.00, stock_quantity: 22, unit: '475g', image_url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Kissan Mixed Fruit Jam', category: 'Packaged Foods', price: 140.00, stock_quantity: 5, unit: '500g', image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=400', is_available: 1 }, // Low stock
      { name: 'Act II Golden Sizzle Popcorn', category: 'Packaged Foods', price: 45.00, stock_quantity: 60, unit: '150g', image_url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Heinz Tomato Ketchup', category: 'Packaged Foods', price: 130.00, stock_quantity: 35, unit: '950g', image_url: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd46f?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Hide & Seek Chocolate Chip Cookies', category: 'Packaged Foods', price: 40.00, stock_quantity: 80, unit: '200g', image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=400', is_available: 1 },

      // 3. Beverages
      { name: 'Tata Tea Gold Premium', category: 'Beverages', price: 340.00, stock_quantity: 40, unit: '1kg', image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Nescafe Classic Instant Coffee', category: 'Beverages', price: 175.00, stock_quantity: 55, unit: '100g', image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Tropicana 100% Orange Juice', category: 'Beverages', price: 110.00, stock_quantity: 28, unit: '1L', image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Coca-Cola Zero Sugar Soda', category: 'Beverages', price: 40.00, stock_quantity: 150, unit: '300ml Can', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Sprite Lemon-Lime Drink', category: 'Beverages', price: 90.00, stock_quantity: 4, unit: '2L', image_url: 'https://images.unsplash.com/photo-1625772290748-160b240f952f?auto=format&fit=crop&q=80&w=400', is_available: 1 }, // Low stock
      { name: 'Paper Boat Aamras Mango Juice', category: 'Beverages', price: 35.00, stock_quantity: 85, unit: '250ml', image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Monster Energy Drink Original', category: 'Beverages', price: 120.00, stock_quantity: 45, unit: '350ml Can', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Bisleri Mineral Water Bottle', category: 'Beverages', price: 20.00, stock_quantity: 200, unit: '1L', image_url: 'https://images.unsplash.com/photo-1608889174637-3c44f6326f2a?auto=format&fit=crop&q=80&w=400', is_available: 1 },

      // 4. Personal Care
      { name: 'Dettol Liquid Handwash Refill', category: 'Personal Care', price: 99.00, stock_quantity: 65, unit: '750ml', image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Dove Cream Beauty Bar Soap', category: 'Personal Care', price: 165.00, stock_quantity: 35, unit: '3x100g Pack', image_url: 'https://images.unsplash.com/photo-1607006342411-9a336f668f4c?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Head & Shoulders Shampoo Cool Menthol', category: 'Personal Care', price: 180.00, stock_quantity: 40, unit: '340ml', image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Colgate MaxFresh Toothpaste', category: 'Personal Care', price: 92.00, stock_quantity: 8, unit: '150g', image_url: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&q=80&w=400', is_available: 1 }, // Low stock
      { name: 'Nivea Aloe Hydration Body Lotion', category: 'Personal Care', price: 299.00, stock_quantity: 20, unit: '400ml', image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Gillette Mach 3 Shaving Razor', category: 'Personal Care', price: 249.00, stock_quantity: 15, unit: '1 Unit', image_url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Pears Pure Gentle Bathing Soap', category: 'Personal Care', price: 45.00, stock_quantity: 70, unit: '100g', image_url: 'https://images.unsplash.com/photo-1607006342411-9a336f668f4c?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Sensodyne Rapid Relief Toothpaste', category: 'Personal Care', price: 190.00, stock_quantity: 22, unit: '80g', image_url: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&q=80&w=400', is_available: 1 },

      // 5. Household Essentials
      { name: 'Surf Excel Easy Wash Detergent Powder', category: 'Household Essentials', price: 140.00, stock_quantity: 50, unit: '1kg', image_url: 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Vim Dishwash Liquid Gel Gel', category: 'Household Essentials', price: 105.00, stock_quantity: 45, unit: '500ml', image_url: 'https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Lizol Disinfectant Surface Cleaner Citrus', category: 'Household Essentials', price: 195.00, stock_quantity: 35, unit: '975ml', image_url: 'https://images.unsplash.com/photo-1584813539806-2538b8d918c6?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Harpic Power Plus Toilet Cleaner Liquid', category: 'Household Essentials', price: 95.00, stock_quantity: 42, unit: '500ml', image_url: 'https://images.unsplash.com/photo-1584813539806-2538b8d918c6?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Aer Pocket Bathroom Air Freshener', category: 'Household Essentials', price: 55.00, stock_quantity: 7, unit: '10g', image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400', is_available: 1 }, // Low stock
      { name: 'Premier Soft Face Tissue Box', category: 'Household Essentials', price: 75.00, stock_quantity: 80, unit: '200 pulls', image_url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Comfort After Wash Fabric Conditioner', category: 'Household Essentials', price: 210.00, stock_quantity: 25, unit: '860ml', image_url: 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Hit Flying Insect Killer Spray', category: 'Household Essentials', price: 199.00, stock_quantity: 30, unit: '400ml', image_url: 'https://images.unsplash.com/photo-1584813539806-2538b8d918c6?auto=format&fit=crop&q=80&w=400', is_available: 1 },

      // 6. Dairy & Bakery
      { name: 'Amul Taaza Toned Fresh Milk', category: 'Dairy & Bakery', price: 27.00, stock_quantity: 150, unit: '500ml', image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Britannia Atta Whole Wheat Bread', category: 'Dairy & Bakery', price: 45.00, stock_quantity: 35, unit: '400g', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Amul Salted Butter Block', category: 'Dairy & Bakery', price: 54.00, stock_quantity: 85, unit: '100g', image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Amul Processed Cheese Slices', category: 'Dairy & Bakery', price: 140.00, stock_quantity: 6, unit: '200g (10 Slices)', image_url: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&q=80&w=400', is_available: 1 }, // Low stock
      { name: 'Mother Dairy Fresh Paneer Block', category: 'Dairy & Bakery', price: 85.00, stock_quantity: 40, unit: '200g', image_url: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Epigamia Greek Yogurt Blueberries', category: 'Dairy & Bakery', price: 60.00, stock_quantity: 30, unit: '90g', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Britannia Fruit Cake Bar', category: 'Dairy & Bakery', price: 20.00, stock_quantity: 90, unit: '65g', image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400', is_available: 1 },
      { name: 'Nandini Pure Cow Ghee', category: 'Dairy & Bakery', price: 320.00, stock_quantity: 28, unit: '500ml', image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400', is_available: 1 }
    ];

    for (const prod of dummyProducts) {
      await query(
        `INSERT INTO products (name, category, price, stock_quantity, unit, image_url, is_available) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [prod.name, prod.category, prod.price, prod.stock_quantity, prod.unit, prod.image_url, prod.is_available]
      );
    }
    console.log('Seeded 48 dummy products successfully across 6 categories.');
  }
}

module.exports = {
  query,
  setupDatabase,
  dbType
};
