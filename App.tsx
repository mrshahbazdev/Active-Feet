import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import ShoesManagement from './components/ShoesManagement';
import ImportData from './components/ImportData';
import Production from './components/Production';
import Dispatch from './components/Dispatch';
import Employees from './components/Employees';
import AIInsights from './components/AIInsights';
import Login from './components/Login';
import { AppView, InventoryItem, User } from './types';
import { Package } from 'lucide-react';

const MOCK_DATA: InventoryItem[] = [
  { id: '1', name: 'Ergonomic Office Chair', sku: 'FUR-001', category: 'Furniture', quantity: 12, minStockLevel: 5, price: 199.99, description: 'Comfortable mesh chair with lumbar support.', lastUpdated: new Date().toISOString() },
  { id: '2', name: '27" 4K Monitor', sku: 'ELEC-102', category: 'Electronics', quantity: 4, minStockLevel: 8, price: 349.50, description: 'High resolution display for professionals.', lastUpdated: new Date().toISOString() },
  { id: '3', name: 'Mechanical Keyboard', sku: 'ELEC-205', category: 'Electronics', quantity: 25, minStockLevel: 10, price: 89.99, description: 'RGB backlit mechanical keyboard with blue switches.', lastUpdated: new Date().toISOString() },
  { id: '4', name: 'USB-C Docking Station', sku: 'ACC-003', category: 'Accessories', quantity: 2, minStockLevel: 5, price: 129.00, description: '12-in-1 docking station for laptops.', lastUpdated: new Date().toISOString() },
  { id: '5', name: 'Standing Desk Frame', sku: 'FUR-009', category: 'Furniture', quantity: 7, minStockLevel: 3, price: 299.00, description: 'Dual motor electric standing desk frame.', lastUpdated: new Date().toISOString() },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [items, setItems] = useState<InventoryItem[]>(() => {
    // Load from local storage or use mock data
    const saved = localStorage.getItem('nexus_inventory_data');
    return saved ? JSON.parse(saved) : MOCK_DATA;
  });

  useEffect(() => {
    localStorage.setItem('nexus_inventory_data', JSON.stringify(items));
  }, [items]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleAddItem = (newItem: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const item: InventoryItem = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString(),
    };
    setItems(prev => [...prev, item]);
  };

  const handleUpdateItem = (id: string, updatedFields: Partial<InventoryItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updatedFields, lastUpdated: new Date().toISOString() } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard items={items} />;
      case AppView.IMPORT_DATA:
        return <ImportData />;
      case AppView.PRODUCTION:
        return <Production />;
      case AppView.DISPATCH:
        return <Dispatch />;
      case AppView.EMPLOYEES:
        return <Employees />;
      case AppView.SHOES_MANAGEMENT:
        return <ShoesManagement />;
      case AppView.INVENTORY:
        return (
          <InventoryList 
            items={items} 
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        );
      case AppView.AI_INSIGHTS:
        return <AIInsights items={items} />;
      case AppView.SETTINGS:
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-slate-400">
                <Package size={64} className="mb-4 opacity-20" />
                <h2 className="text-xl font-semibold">Settings</h2>
                <p>App configuration would go here.</p>
                <div className="mt-6 bg-white p-4 rounded shadow-sm">
                   <p className="text-sm font-medium text-slate-600">Current User: {user?.username}</p>
                   <p className="text-xs text-slate-400">Role: {user?.role}</p>
                   <button 
                     onClick={() => setUser(null)}
                     className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition"
                   >
                     Logout
                   </button>
                </div>
            </div>
        )
      default:
        return <Dashboard items={items} />;
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;