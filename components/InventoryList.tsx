import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { Search, Plus, Filter, Edit2, Trash2, ArrowUpDown } from 'lucide-react';
import ItemFormModal from './ItemModal';

interface InventoryListProps {
  items: InventoryItem[];
  onAddItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  onUpdateItem: (id: string, item: Partial<InventoryItem>) => void;
  onDeleteItem: (id: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, onAddItem, onUpdateItem, onDeleteItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
  const [sortField, setSortField] = useState<keyof InventoryItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredItems = useMemo(() => {
    return items
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
  }, [items, searchTerm, sortField, sortDirection]);

  const openAddModal = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Inventory</h2>
          <p className="text-slate-500">Manage your products and stock levels</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Item
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-t-xl border border-b-0 border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
           <span className="text-sm text-slate-500">{filteredItems.length} items found</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 shadow-sm flex-1 overflow-hidden rounded-b-xl flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th 
                  className="p-4 border-b border-slate-200 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">Product Name <ArrowUpDown size={14} className="ml-1 opacity-50"/></div>
                </th>
                <th 
                  className="p-4 border-b border-slate-200 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('sku')}
                >
                   <div className="flex items-center">SKU <ArrowUpDown size={14} className="ml-1 opacity-50"/></div>
                </th>
                <th 
                  className="p-4 border-b border-slate-200 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('category')}
                >
                   <div className="flex items-center">Category <ArrowUpDown size={14} className="ml-1 opacity-50"/></div>
                </th>
                <th 
                  className="p-4 border-b border-slate-200 font-semibold text-slate-600 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('price')}
                >
                   <div className="flex items-center justify-end">Price <ArrowUpDown size={14} className="ml-1 opacity-50"/></div>
                </th>
                <th 
                  className="p-4 border-b border-slate-200 font-semibold text-slate-600 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('quantity')}
                >
                   <div className="flex items-center justify-center">Stock <ArrowUpDown size={14} className="ml-1 opacity-50"/></div>
                </th>
                <th className="p-4 border-b border-slate-200 font-semibold text-slate-600 text-center">Status</th>
                <th className="p-4 border-b border-slate-200 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                  <td className="p-4 text-slate-800 font-medium">
                    {item.name}
                    <div className="text-xs text-slate-400 font-normal truncate max-w-[200px]">{item.description}</div>
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-sm">{item.sku}</td>
                  <td className="p-4 text-slate-600">
                    <span className="bg-slate-100 text-slate-700 py-1 px-3 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-800 text-right font-medium">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="p-4 text-slate-800 text-center">
                    {item.quantity}
                  </td>
                  <td className="p-4 text-center">
                    {item.quantity <= item.minStockLevel ? (
                      <span className="inline-flex items-center text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteItem(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No items found. Add some inventory to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ItemFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            if (editingItem) {
              onUpdateItem(editingItem.id, data);
            } else {
              onAddItem(data as Omit<InventoryItem, 'id' | 'lastUpdated'>);
            }
            setIsModalOpen(false);
          }}
          initialData={editingItem}
        />
      )}
    </div>
  );
};

export default InventoryList;