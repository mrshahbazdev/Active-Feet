import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Setup
const dbPath = app.isPackaged 
  ? path.join(process.resourcesPath, 'nexus.db') 
  : path.join(__dirname, 'nexus.db');

let db;

function initDatabase() {
  try {
    db = new Database(dbPath);
    console.log('Connected to SQLite database at:', dbPath);

    // 1. Users Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Shoes Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS Shoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        quantity INTEGER DEFAULT 0
      )
    `);

    // 3. Subcategory Table (Materials)
    db.exec(`
      CREATE TABLE IF NOT EXISTS subcategory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE
      )
    `);

    // 4. Subshoes Table (Linking Shoes to Materials)
    db.exec(`
      CREATE TABLE IF NOT EXISTS Subshoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shoes_id INTEGER NOT NULL,
        subcategory_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        UNIQUE(shoes_id, subcategory_id), 
        FOREIGN KEY (shoes_id) REFERENCES Shoes(id),
        FOREIGN KEY (subcategory_id) REFERENCES subcategory(id)
      )
    `);

    // 5. Available Stock (Raw Material Stock)
    db.exec(`
      CREATE TABLE IF NOT EXISTS Available_Stock (
        subcategory_id INTEGER PRIMARY KEY, 
        quantity INTEGER DEFAULT 0,
        FOREIGN KEY (subcategory_id) REFERENCES subcategory(id)
      )
    `);

    // 6. Today Production (Components)
    db.exec(`
      CREATE TABLE IF NOT EXISTS today_production (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subcategory_id INTEGER,
        quantity INTEGER,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subcategory_id) REFERENCES subcategory (id)
      )
    `);

    // 7. Shoes Production (Finished Goods)
    db.exec(`
      CREATE TABLE IF NOT EXISTS shoes_production (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shoe_id INTEGER,
        quantity INTEGER,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shoe_id) REFERENCES Shoes (id)
      )
    `);

    // 8. Orders Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        customer_name TEXT,
        status TEXT DEFAULT 'Completed',
        date TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Today Dispatch (Sales)
    db.exec(`
      CREATE TABLE IF NOT EXISTS today_dispatch (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shoes_id INTEGER,
        quantity INTEGER,
        price REAL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        order_id TEXT,
        FOREIGN KEY (shoes_id) REFERENCES Shoes (id),
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
      )
    `);

    // 10. Employees Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        contact TEXT,
        daily_rate REAL DEFAULT 0
      )
    `);

    // 11. Work Logs (Attendance/Work Record)
    db.exec(`
      CREATE TABLE IF NOT EXISTS work_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        amount REAL,
        FOREIGN KEY(employee_id) REFERENCES employees(id)
      )
    `);

    // 12. Payments (Salaries Given)
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        amount REAL,
        note TEXT,
        FOREIGN KEY(employee_id) REFERENCES employees(id)
      )
    `);

    // Seed Admin User
    const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!adminUser) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('password', salt); 
      const stmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
      stmt.run('admin', hash, 'admin');
      console.log('Default admin user created.');
    }

    // Seed Subcategories (Materials) if empty
    const subCount = db.prepare('SELECT COUNT(*) as count FROM subcategory').get();
    if (subCount.count === 0) {
      const insertSub = db.prepare('INSERT INTO subcategory (name) VALUES (?)');
      const defaults = ['Leather', 'Rubber', 'Laces', 'Sole', 'Fabric', 'Glue'];
      defaults.forEach(name => insertSub.run(name));
      console.log('Default subcategories seeded.');
    }

  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "Nexus Inventory AI",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false 
    },
    titleBarStyle: 'hiddenInset', 
  });

  if (!app.isPackaged) {
    const loadDevServer = () => {
      win.loadURL('http://localhost:5173').catch(() => {
        console.log('Waiting for Vite server to start...');
        setTimeout(loadDevServer, 1000);
      });
    };
    loadDevServer();
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC Handlers ---

// Auth
ipcMain.handle('auth:login', async (_, { username, password }) => {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    if (!user) return { success: false, message: 'User not found' };
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return { success: false, message: 'Invalid password' };
    return { success: true, user: { id: user.id, username: user.username, role: user.role } };
  } catch (error) {
    return { success: false, message: 'Internal server error' };
  }
});

// Shoes Management
ipcMain.handle('shoes:getAll', () => {
  return db.prepare('SELECT * FROM Shoes ORDER BY name ASC').all();
});
ipcMain.handle('shoes:add', (_, name) => {
  try {
    const stmt = db.prepare('INSERT INTO Shoes (name, quantity) VALUES (?, 0)');
    const info = stmt.run(name);
    return { success: true, id: info.lastInsertRowid };
  } catch (err) {
    return { success: false, message: err.message };
  }
});
ipcMain.handle('shoes:update', (_, { id, name }) => {
  try {
    const stmt = db.prepare('UPDATE Shoes SET name = ? WHERE id = ?');
    stmt.run(name, id);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Subcategories & Subshoes
ipcMain.handle('subcategories:getAll', () => {
  return db.prepare('SELECT * FROM subcategory ORDER BY name ASC').all();
});
ipcMain.handle('subshoes:getByShoeId', (_, shoeId) => {
  const sql = `
    SELECT ss.id, ss.shoes_id, ss.subcategory_id, ss.quantity, sc.name as subcategory_name 
    FROM Subshoes ss
    JOIN subcategory sc ON ss.subcategory_id = sc.id
    WHERE ss.shoes_id = ?
    ORDER BY sc.name ASC
  `;
  return db.prepare(sql).all(shoeId);
});
ipcMain.handle('subshoes:add', (_, { shoeId, subcategoryId, quantity }) => {
  try {
    const stmt = db.prepare('INSERT INTO Subshoes (shoes_id, subcategory_id, quantity) VALUES (?, ?, ?)');
    stmt.run(shoeId, subcategoryId, quantity);
    return { success: true };
  } catch (err) {
    return { success: false, message: 'Duplicate or Invalid Entry' };
  }
});
ipcMain.handle('subshoes:update', (_, { id, subcategoryId, quantity }) => {
  try {
    const stmt = db.prepare('UPDATE Subshoes SET subcategory_id = ?, quantity = ? WHERE id = ?');
    stmt.run(subcategoryId, quantity, id);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});
ipcMain.handle('subshoes:delete', (_, id) => {
  try {
    db.prepare('DELETE FROM Subshoes WHERE id = ?').run(id);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Import Data (Available Stock)
ipcMain.handle('stock:getAll', () => {
  const sql = `
    SELECT s.id, s.name, COALESCE(av.quantity, 0) as quantity 
    FROM subcategory s
    LEFT JOIN Available_Stock av ON s.id = av.subcategory_id
    ORDER BY s.name ASC
  `;
  return db.prepare(sql).all();
});

ipcMain.handle('stock:add', (_, { subcategoryId, quantity }) => {
  try {
    const check = db.prepare('SELECT * FROM Available_Stock WHERE subcategory_id = ?').get(subcategoryId);
    if (check) {
      db.prepare('UPDATE Available_Stock SET quantity = quantity + ? WHERE subcategory_id = ?').run(quantity, subcategoryId);
    } else {
      db.prepare('INSERT INTO Available_Stock (subcategory_id, quantity) VALUES (?, ?)').run(subcategoryId, quantity);
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Production
ipcMain.handle('production:addComponent', (_, { subcategoryId, quantity }) => {
  try {
    db.prepare('INSERT INTO today_production (subcategory_id, quantity) VALUES (?, ?)').run(subcategoryId, quantity);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('production:addShoe', (_, { shoeId, quantity }) => {
  try {
    db.prepare('INSERT INTO shoes_production (shoe_id, quantity) VALUES (?, ?)').run(shoeId, quantity);
    // Update Shoe Stock (Increase)
    db.prepare('UPDATE Shoes SET quantity = quantity + ? WHERE id = ?').run(quantity, shoeId);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('production:getTodayComponent', () => {
  const sql = `
    SELECT s.name AS subcategory_name, SUM(tp.quantity) AS total_quantity
    FROM today_production tp
    JOIN subcategory s ON tp.subcategory_id = s.id
    WHERE DATE(tp.timestamp) = DATE('now')
    GROUP BY s.name
  `;
  return db.prepare(sql).all();
});

ipcMain.handle('production:getTodayShoe', () => {
  const sql = `
    SELECT s.name AS shoe_name, SUM(sp.quantity) AS total_quantity
    FROM shoes_production sp
    JOIN Shoes s ON sp.shoe_id = s.id
    WHERE DATE(sp.timestamp) = DATE('now')
    GROUP BY s.name
  `;
  return db.prepare(sql).all();
});

// Dispatch (Sales)
ipcMain.handle('dispatch:create', (_, { orderId, customerName, items }) => {
  // items: [{ shoeId, quantity, price }]
  const createOrder = db.transaction((orderItems) => {
    db.prepare('INSERT INTO orders (order_id, customer_name) VALUES (?, ?)').run(orderId, customerName);
    
    const insertItem = db.prepare('INSERT INTO today_dispatch (order_id, shoes_id, quantity, price) VALUES (?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE Shoes SET quantity = quantity - ? WHERE id = ?');
    
    for (const item of orderItems) {
      insertItem.run(orderId, item.shoeId, item.quantity, item.price);
      updateStock.run(item.quantity, item.shoeId);
    }
  });

  try {
    createOrder(items);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('dispatch:getToday', () => {
  const sql = `
    SELECT d.id, d.order_id, s.name as shoe_name, d.quantity, d.price, o.customer_name, d.date
    FROM today_dispatch d
    JOIN Shoes s ON d.shoes_id = s.id
    JOIN orders o ON d.order_id = o.order_id
    WHERE DATE(d.date) = DATE('now')
    ORDER BY d.date DESC
  `;
  return db.prepare(sql).all();
});

// --- EMPLOYEES & PAYROLL ---

ipcMain.handle('employees:create', (_, { name, role, contact, dailyRate }) => {
  try {
    const stmt = db.prepare('INSERT INTO employees (name, role, contact, daily_rate) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, role, contact, dailyRate || 0);
    return { success: true, id: info.lastInsertRowid };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('employees:getAll', () => {
  // Calculate balance = (Total Work Amount) - (Total Payments)
  const sql = `
    SELECT e.*, 
    (SELECT COALESCE(SUM(amount), 0) FROM work_logs WHERE employee_id = e.id) as total_work,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE employee_id = e.id) as total_paid
    FROM employees e
    ORDER BY e.name ASC
  `;
  const employees = db.prepare(sql).all();
  return employees.map(e => ({
    ...e,
    balance: (e.total_work || 0) - (e.total_paid || 0)
  }));
});

ipcMain.handle('employees:getHistory', (_, employeeId) => {
  const workLogs = db.prepare('SELECT * FROM work_logs WHERE employee_id = ? ORDER BY date DESC').all(employeeId);
  const payments = db.prepare('SELECT * FROM payments WHERE employee_id = ? ORDER BY date DESC').all(employeeId);
  return { workLogs, payments };
});

ipcMain.handle('work:add', (_, { employeeId, description, amount }) => {
  try {
    db.prepare('INSERT INTO work_logs (employee_id, description, amount) VALUES (?, ?, ?)').run(employeeId, description, amount);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('payments:add', (_, { employeeId, amount, note }) => {
  try {
    db.prepare('INSERT INTO payments (employee_id, amount, note) VALUES (?, ?, ?)').run(employeeId, amount, note);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});