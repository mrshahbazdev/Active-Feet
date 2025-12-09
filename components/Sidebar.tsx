import React from 'react';
import { LayoutDashboard, Package, Sparkles, Settings, Box, Footprints, Factory, Import, ShoppingCart, Users } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: AppView.IMPORT_DATA, label: 'Import Data', icon: <Import size={20} /> },
    { id: AppView.PRODUCTION, label: 'Production', icon: <Factory size={20} /> },
    { id: AppView.DISPATCH, label: 'Dispatch / Sales', icon: <ShoppingCart size={20} /> },
    { id: AppView.EMPLOYEES, label: 'Employees & Payroll', icon: <Users size={20} /> },
    { id: AppView.SHOES_MANAGEMENT, label: 'Shoes Management', icon: <Footprints size={20} /> },
    { id: AppView.INVENTORY, label: 'Inventory', icon: <Package size={20} /> },
    { id: AppView.AI_INSIGHTS, label: 'AI Insights', icon: <Sparkles size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-full flex flex-col shadow-xl z-20">
      {/* Draggable header for Electron frameless window */}
      <div className="p-6 flex items-center space-x-3 border-b border-slate-700 draggable cursor-default">
        <div className="bg-blue-600 p-2 rounded-lg non-draggable">
          <Box size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wide">Nexus IMS</h1>
          <p className="text-xs text-slate-400">v1.0.0 (Electron)</p>
        </div>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 non-draggable ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
            onClick={() => onChangeView(AppView.SETTINGS)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors non-draggable ${
              currentView === AppView.SETTINGS 
              ? 'bg-slate-800 text-white' 
              : 'text-slate-400 hover:text-white'
            }`}
        >
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;