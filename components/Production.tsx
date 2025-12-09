import React, { useState, useEffect } from 'react';
import { Factory, Printer, RefreshCcw, Save } from 'lucide-react';
import { ProductionRecord, Subcategory, Shoe } from '../types';

const Production: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'components' | 'shoes'>('components');
  
  // Data State
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [shoesList, setShoesList] = useState<Shoe[]>([]);
  const [todayComponents, setTodayComponents] = useState<ProductionRecord[]>([]);
  const [todayShoes, setTodayShoes] = useState<ProductionRecord[]>([]);

  // Form State
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    // @ts-ignore
    const subs = await window.electron.subcategories.getAll();
    setSubcategories(subs);
    // @ts-ignore
    const shoes = await window.electron.shoes.getAll();
    setShoesList(shoes);
    
    // Fetch Today's reports
    // @ts-ignore
    const compReport = await window.electron.production.getTodayComponent();
    setTodayComponents(compReport);
    // @ts-ignore
    const shoeReport = await window.electron.production.getTodayShoe();
    setTodayShoes(shoeReport);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !quantity) return;

    setLoading(true);
    let result;
    
    if (activeTab === 'components') {
      // @ts-ignore
      result = await window.electron.production.addComponent({
        subcategoryId: parseInt(selectedItem),
        quantity: parseInt(quantity)
      });
    } else {
       // @ts-ignore
       result = await window.electron.production.addShoe({
        shoeId: parseInt(selectedItem),
        quantity: parseInt(quantity)
      });
    }

    if (result.success) {
      fetchData();
      setQuantity('');
    } else {
      alert("Failed to record production: " + result.message);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentRecords = activeTab === 'components' ? todayComponents : todayShoes;

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-6 flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Factory className="text-blue-600" size={32} />
            Daily Production
          </h2>
          <p className="text-slate-500">Record and monitor daily factory output.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handlePrint} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
             <Printer size={18} /> Export / Print
           </button>
           <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
            <RefreshCcw size={20} />
           </button>
        </div>
      </header>

      {/* TABS */}
      <div className="flex space-x-1 bg-slate-200 p-1 rounded-xl mb-6 w-fit print:hidden">
        <button
          onClick={() => { setActiveTab('components'); setSelectedItem(''); setQuantity(''); }}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'components' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Components (Raw)
        </button>
        <button
          onClick={() => { setActiveTab('shoes'); setSelectedItem(''); setQuantity(''); }}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'shoes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Finished Shoes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-full overflow-hidden">
        
        {/* INPUT FORM (Hidden in Print) */}
        <div className="w-full lg:w-1/3 print:hidden">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
              Record {activeTab === 'components' ? 'Component' : 'Shoe'} Output
            </h3>
            <form onSubmit={handleAddProduction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Select {activeTab === 'components' ? 'Material/Component' : 'Shoe Model'}
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                  required
                >
                  <option value="">-- Select Item --</option>
                  {activeTab === 'components' 
                    ? subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    : shoesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Quantity Produced</label>
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
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Recording...' : <><Save size={20} /> Record Production</>}
              </button>
            </form>
          </div>
        </div>

        {/* REPORT TABLE */}
        <div className="w-full lg:w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
          <div className="p-4 border-b border-slate-200 bg-slate-50 print:bg-white">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              Today's Production Report <span className="text-xs font-normal text-slate-400">({new Date().toLocaleDateString()})</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 print:bg-white print:border-b-2">
                <tr>
                  <th className="p-4 border-b font-semibold text-slate-600">
                    {activeTab === 'components' ? 'Material Name' : 'Shoe Model'}
                  </th>
                  <th className="p-4 border-b font-semibold text-slate-600 text-center">Total Quantity</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length > 0 ? (
                  currentRecords.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <td className="p-4 text-slate-800 font-medium">
                        {activeTab === 'components' ? (item as any).subcategory_name : (item as any).shoe_name}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-blue-700">
                        {item.total_quantity}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-400">No production records for today.</td>
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

export default Production;