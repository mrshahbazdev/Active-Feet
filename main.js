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

    // Create Users Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Admin User (if not exists)
    const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!adminUser) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('password', salt); // Default password: 'password'
      const stmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
      stmt.run('admin', hash, 'admin');
      console.log('Default admin user created.');
    }

  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
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

// Login Handler
ipcMain.handle('auth:login', async (_, { username, password }) => {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return { success: false, message: 'Invalid password' };
    }

    // Return user info (excluding password)
    return { 
      success: true, 
      user: { id: user.id, username: user.username, role: user.role } 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Internal server error' };
  }
});