import React, { useState, useEffect } from 'react';
import { Shoe, Subcategory, SubShoe } from '../types';
import { Plus, Edit2, Trash2, Save, X, Footprints, Layers, RefreshCcw } from 'lucide-react';

const ShoesManagement: React.FC = () => {
  // State for data
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subShoes, setSubShoes] = useState<SubShoe[]>([]);

  // State for selections
  const [selectedShoeId, setSelectedShoeId] = useState<number | null>(null);
  const [selectedSubShoe, setSelectedSubShoe] = useState<SubShoe | null>(null);

  // State for forms
  const [newShoeName, setNewShoeName] = useState('');
  const [editShoeName, setEditShoeName] = useState('');
  const [isEditingShoe, setIsEditingShoe] = useState(false);

  const [subForm, setSubForm] = useState({
    subcategoryId: '',
    quantity: ''
  });

  // Load initial data
  const fetchData = async () => {
    // @ts-ignore
    const shoesData = await window.electron.shoes.getAll();
    setShoes(shoesData);
    // @ts-ignore
    const subData = await window.electron.subcategories.getAll();
    setSubcategories(subData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load sub-materials when a shoe is selected
  useEffect(() => {
    if (selectedShoeId) {
        loadSubShoes(selectedShoeId);
        const shoe = shoes.find(s => s.id === selectedShoeId);
        if (shoe) setEditShoeName(shoe.name);
    } else {
        setSubShoes([]);
        setEditShoeName('');
    }
  }, [selectedShoeId, shoes]);

  const loadSubShoes = async (id: number) => {
    // @ts-ignore
    const data = await window.electron.subshoes.getByShoeId(id);
    setSubShoes(data);
  };

  // --- Shoe Handlers ---

  const handleAddShoe = async () => {
    if (!newShoeName.trim()) return;
    // @ts-ignore
    const result = await window.electron.shoes.add(newShoeName);
    if (result.success) {
      setNewShoeName('');
      fetchData();
    } else {
      alert('Error adding shoe: ' + result.message);
    }
  };

  const handleUpdateShoe = async () => {
    if (!selectedShoeId || !editShoeName.trim()) return;
    // @ts-ignore
    const result = await window.electron.shoes.update({ id: selectedShoeId, name: editShoeName });
    if (result.success) {
      fetchData();
      setIsEditingShoe(false);
    } else {
      alert('Error updating shoe');
    }
  };

  // --- Sub-Material Handlers ---

  const handleAddSubShoe = async () => {
    if (!selectedShoeId || !subForm.subcategoryId || !subForm.quantity) {
        alert("Please select a shoe, a sub-material and quantity.");
        return;
    }

    // @ts-ignore
    const result = await window.electron.subshoes.add({
      shoeId: selectedShoeId,
      subcategoryId: parseInt(subForm.subcategoryId),
      quantity: parseFloat(subForm.quantity)
    });

    if (result.success) {
      loadSubShoes(selectedShoeId);
      setSubForm({ ...subForm, quantity: '' }); // Keep subcategory selected for convenience
    } else {
      alert('Error adding sub-material: ' + result.message);
    }
  };

  const handleUpdateSubShoe = async () => {
    if (!selectedSubShoe || !subForm.quantity || !subForm.subcategoryId) return;
    
    // @ts-ignore
    const result = await window.electron.subshoes.update({
        id: selectedSubShoe.id,
        subcategoryId: parseInt(subForm.subcategoryId),
        quantity: parseFloat(subForm.quantity)
    });

    if (result.success) {
        loadSubShoes(selectedShoeId!);
        setSelectedSubShoe(null);
        setSubForm({ subcategoryId: '', quantity: '' });
    } else {
        alert('Error updating sub-material');
    }
  };

  const handleDeleteSubShoe = async (id: number) => {
    if (!confirm('Are you sure you want to remove this material?')) return;
    // @ts-ignore
    const result = await window.electron.subshoes.delete(id);
    if (result.success && selectedShoeId) {
      loadSubShoes(selectedShoeId);
    }
  };

  const startEditSubShoe = (item: SubShoe) => {
      setSelectedSubShoe(item);
      setSubForm({
          subcategoryId: item.subcategory_id.toString(),
          quantity: item.quantity.toString()
      });
  };

  const cancelEditSubShoe = () => {
      setSelectedSubShoe(null);
      setSubForm({ subcategoryId: '', quantity: '' });
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <header className="mb-6 flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Footprints className="text-blue-600" size={32} />
            Shoes Management
            </h2>
            <p className="text-slate-500">Manage shoe definitions and their material requirements.</p>
        </div>
        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Refresh Data">
            <RefreshCcw size={20} />
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 h-full overflow-hidden">
        
        {/* LEFT COLUMN: Controls */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
            
            {/* 1. Add/Edit Shoe */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <Footprints size={18} /> Shoe Definition
                </h3>
                
                {/* Add New */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Add New Shoe</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Running Shoes - Red"
                            value={newShoeName}
                            onChange={(e) => setNewShoeName(e.target.value)}
                        />
                        <button 
                            onClick={handleAddShoe}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Edit Existing */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Select Shoe to Edit/Manage</label>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                        value={selectedShoeId || ''}
                        onChange={(e) => {
                            setSelectedShoeId(Number(e.target.value) || null);
                            setIsEditingShoe(false);
                        }}
                    >
                        <option value="">-- Select a Shoe --</option>
                        {shoes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    {selectedShoeId && (
                        <div className="flex gap-2">
                            {isEditingShoe ? (
                                <>
                                    <input 
                                        type="text" 
                                        className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editShoeName}
                                        onChange={(e) => setEditShoeName(e.target.value)}
                                    />
                                    <button onClick={handleUpdateShoe} className="bg-blue-600 text-white p-2 rounded-lg"><Save size={18} /></button>
                                    <button onClick={() => setIsEditingShoe(false)} className="bg-slate-200 text-slate-600 p-2 rounded-lg"><X size={18} /></button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setIsEditingShoe(true)}
                                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex justify-center items-center gap-2 transition-colors border border-slate-300"
                                >
                                    <Edit2 size={16} /> Edit Shoe Name
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Add Sub-Material */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-opacity ${!selectedShoeId ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <Layers size={18} /> 
                    {selectedSubShoe ? 'Edit Material' : 'Add Material'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Material (Subcategory)</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={subForm.subcategoryId}
                            onChange={(e) => setSubForm({...subForm, subcategoryId: e.target.value})}
                        >
                            <option value="">-- Select Material --</option>
                            {subcategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Quantity Needed</label>
                        <input 
                            type="number"
                            step="0.01"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 2.5"
                            value={subForm.quantity}
                            onChange={(e) => setSubForm({...subForm, quantity: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        {selectedSubShoe ? (
                            <>
                                <button 
                                    onClick={handleUpdateSubShoe}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> Update
                                </button>
                                <button 
                                    onClick={cancelEditSubShoe}
                                    className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={handleAddSubShoe}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Add to Shoe
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Table */}
        <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-700">
                    Materials for: <span className="text-blue-600">{editShoeName || "Select a shoe"}</span>
                </h3>
            </div>
            
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="p-4 border-b border-slate-200 font-semibold text-slate-600">Material Name</th>
                            <th className="p-4 border-b border-slate-200 font-semibold text-slate-600 text-center">Quantity</th>
                            <th className="p-4 border-b border-slate-200 font-semibold text-slate-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subShoes.length > 0 ? (
                            subShoes.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                    <td className="p-4 text-slate-800 font-medium">{item.subcategory_name}</td>
                                    <td className="p-4 text-slate-600 text-center">{item.quantity}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => startEditSubShoe(item)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteSubShoe(item.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="p-12 text-center text-slate-400">
                                    {selectedShoeId ? "No materials added for this shoe yet." : "Please select a shoe from the left to view materials."}
                                </td>
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

export default ShoesManagement;