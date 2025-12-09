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

// --- NEW HANDLERS FOR PRODUCTION & IMPORT DATA ---

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
    // Log production
    db.prepare('INSERT INTO today_production (subcategory_id, quantity) VALUES (?, ?)').run(subcategoryId, quantity);
    // OPTIONAL: Update available stock (Assuming production ADDS to stock, same as Import Data, or distinct?)
    // Based on python code, today_production is separate from Available_Stock. 
    // We will just log it for now.
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('production:addShoe', (_, { shoeId, quantity }) => {
  try {
    // Log shoe production
    db.prepare('INSERT INTO shoes_production (shoe_id, quantity) VALUES (?, ?)').run(shoeId, quantity);
    // Update Shoe Stock
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