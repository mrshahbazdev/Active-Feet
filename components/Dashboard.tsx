import React, { useMemo } from 'react';
import { InventoryItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, AlertTriangle, PackageCheck, Archive } from 'lucide-react';

interface DashboardProps {
  items: InventoryItem[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ items }) => {
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalStock = items.reduce((acc, item) => acc + item.quantity, 0);
    const lowStockItems = items.filter((item) => item.quantity <= item.minStockLevel).length;
    const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

    return { totalItems, totalStock, lowStockItems, totalValue };
  }, [items]);

  const categoryData = useMemo(() => {
    const groups: Record<string, number> = {};
    items.forEach(item => {
      groups[item.category] = (groups[item.category] || 0) + item.quantity;
    });
    return Object.keys(groups).map(key => ({ name: key, value: groups[key] }));
  }, [items]);

  const lowStockData = useMemo(() => {
    return items
      .filter(i => i.quantity <= i.minStockLevel)
      .map(i => ({ name: i.name, quantity: i.quantity, min: i.minStockLevel }))
      .slice(0, 5);
  }, [items]);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500">Overview of your inventory status</p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Value</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Products</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalItems}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Archive size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Units</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalStock}</h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <PackageCheck size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Low Stock Alerts</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.lowStockItems > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {stats.lowStockItems}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${stats.lowStockItems > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Stock by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center text-sm text-slate-600">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Low Stock Items</h3>
          {lowStockData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lowStockData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="quantity" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} name="Current Stock" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-slate-400 mt-2">Items below minimum threshold</p>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center flex-col text-slate-400">
              <PackageCheck size={48} className="mb-2 text-green-400" />
              <p>All stock levels healthy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;