import React, { useState, useEffect } from 'react';
import { StockItem, Subcategory } from '../types';
import { Import, Search, RefreshCcw, Plus } from 'lucide-react';

const ImportData: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [selectedSub, setSelectedSub] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    // @ts-ignore
    const stockData = await window.electron.stock.getAll();
    setStock(stockData);
    // @ts-ignore
    const subData = await window.electron.subcategories.getAll();
    setSubcategories(subData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !quantity) return;

    setLoading(true);
    // @ts-ignore
    const result = await window.electron.stock.add({
      subcategoryId: parseInt(selectedSub),
      quantity: parseInt(quantity)
    });

    if (result.success) {
      fetchData();
      setQuantity('');
    } else {
      alert("Failed to add stock");
    }
    setLoading(false);
  };

  const filteredStock = stock.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Import className="text-blue-600" size={32} />
            Import Data
          </h2>
          <p className="text-slate-500">Manage Raw Material Stock (Leather, Soles, etc.)</p>
        </div>
        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
          <RefreshCcw size={20} />
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 h-full overflow-hidden">
        
        {/* ADD STOCK FORM */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Add Stock</h3>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Select Material</label>
                <select
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                  required
                >
                  <option value="">-- Choose Material --</option>
                  {subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                  placeholder="0"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Adding...' : <><Plus size={20} /> Update Stock</>}
              </button>
            </form>
          </div>
        </div>

        {/* STOCK TABLE */}
        <div className="w-full lg:w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Available Stock</h3>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="p-4 border-b font-semibold text-slate-600">Material Name</th>
                  <th className="p-4 border-b font-semibold text-slate-600 text-center">Available Quantity</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length > 0 ? (
                  filteredStock.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <td className="p-4 text-slate-800 font-medium">{item.name}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${item.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.quantity}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-400">No materials found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImportData;