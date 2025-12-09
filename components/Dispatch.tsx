import React, { useState, useEffect } from 'react';
import { Shoe, DispatchRecord } from '../types';
import { ShoppingCart, User, RefreshCcw, Plus, Trash, Printer } from 'lucide-react';

interface CartItem {
  shoeId: number;
  shoeName: string;
  quantity: number;
  price: number;
}

const Dispatch: React.FC = () => {
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [history, setHistory] = useState<DispatchRecord[]>([]);
  
  // Order Form
  const [customer, setCustomer] = useState('');
  const [orderId, setOrderId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Add Item Form
  const [selectedShoeId, setSelectedShoeId] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const fetchData = async () => {
    // @ts-ignore
    const shoesData = await window.electron.shoes.getAll();
    setShoes(shoesData);
    // @ts-ignore
    const historyData = await window.electron.dispatch.getToday();
    setHistory(historyData);
  };

  useEffect(() => {
    fetchData();
    // Generate random Order ID
    setOrderId(`ORD-${Date.now().toString().slice(-6)}`);
  }, []);

  const addToCart = () => {
    if (!selectedShoeId || !itemQty || !itemPrice) return;
    
    const shoe = shoes.find(s => s.id === parseInt(selectedShoeId));
    if (!shoe) return;

    if (parseInt(itemQty) > shoe.quantity) {
      alert(`Insufficient stock! Available: ${shoe.quantity}`);
      return;
    }

    const newItem: CartItem = {
      shoeId: shoe.id,
      shoeName: shoe.name,
      quantity: parseInt(itemQty),
      price: parseFloat(itemPrice)
    };

    setCart([...cart, newItem]);
    setSelectedShoeId('');
    setItemQty('');
    setItemPrice('');
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!customer) {
      alert("Please enter customer name.");
      return;
    }

    // @ts-ignore
    const result = await window.electron.dispatch.create({
      orderId,
      customerName: customer,
      items: cart
    });

    if (result.success) {
      alert("Order Dispatched Successfully!");
      setCart([]);
      setCustomer('');
      setOrderId(`ORD-${Date.now().toString().slice(-6)}`);
      fetchData();
    } else {
      alert("Error dispatching order: " + result.message);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-6 flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <ShoppingCart className="text-blue-600" size={32} />
            Dispatch / Sales
          </h2>
          <p className="text-slate-500">Create orders and reduce finished goods stock.</p>
        </div>
        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
          <RefreshCcw size={20} />
        </button>
      </header>

      <div className="flex flex-col xl:flex-row gap-8 h-full overflow-hidden">
        
        {/* NEW ORDER FORM */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6 print:hidden">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <User size={18} /> Customer Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-xs text-slate-500 font-bold uppercase">Order ID</label>
                        <input type="text" readOnly value={orderId} className="w-full p-2 bg-slate-100 border border-slate-300 rounded text-slate-600 font-mono" />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs text-slate-500 font-bold uppercase">Customer Name</label>
                        <input 
                            type="text" 
                            value={customer} 
                            onChange={e => setCustomer(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="e.g. Retail Store A"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                    Add Items
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Select Shoe</label>
                        <select 
                            value={selectedShoeId}
                            onChange={e => setSelectedShoeId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Select Shoe --</option>
                            {shoes.map(s => <option key={s.id} value={s.id}>{s.name} (Stock: {s.quantity})</option>)}
                        </select>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-600 mb-1">Quantity</label>
                            <input 
                                type="number" 
                                value={itemQty}
                                onChange={e => setItemQty(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-600 mb-1">Price/Unit</label>
                            <input 
                                type="number" 
                                value={itemPrice}
                                onChange={e => setItemPrice(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={addToCart}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Add to Cart
                    </button>
                </div>

                {/* Mini Cart Preview */}
                <div className="mt-6 border-t pt-4">
                    <h4 className="font-semibold text-slate-700 mb-2">Current Cart ({cart.length})</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm">
                                <div>
                                    <p className="font-medium text-slate-800">{item.shoeName}</p>
                                    <p className="text-slate-500">{item.quantity} x ${item.price}</p>
                                </div>
                                <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-700"><Trash size={14} /></button>
                            </div>
                        ))}
                    </div>
                    {cart.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center text-lg font-bold text-slate-800 mb-4">
                                <span>Total:</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={handleCheckout}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg"
                            >
                                Dispatch Order
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* ORDER HISTORY TABLE */}
        <div className="w-full xl:w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-700">Today's Dispatch History</h3>
                <button onClick={() => window.print()} className="text-slate-500 hover:text-slate-800 print:hidden">
                    <Printer size={20} />
                </button>
            </div>
            
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 print:bg-white print:border-b">
                        <tr>
                            <th className="p-4 border-b font-semibold text-slate-600">Order ID</th>
                            <th className="p-4 border-b font-semibold text-slate-600">Customer</th>
                            <th className="p-4 border-b font-semibold text-slate-600">Shoe</th>
                            <th className="p-4 border-b font-semibold text-slate-600 text-center">Qty</th>
                            <th className="p-4 border-b font-semibold text-slate-600 text-right">Price</th>
                            <th className="p-4 border-b font-semibold text-slate-600 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length > 0 ? (
                            history.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                    <td className="p-4 text-slate-600 font-mono text-sm">{record.order_id}</td>
                                    <td className="p-4 text-slate-800 font-medium">{record.customer_name}</td>
                                    <td className="p-4 text-slate-800">{record.shoe_name}</td>
                                    <td className="p-4 text-center">{record.quantity}</td>
                                    <td className="p-4 text-right">${record.price.toFixed(2)}</td>
                                    <td className="p-4 text-right font-bold text-green-700">${(record.quantity * record.price).toFixed(2)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-400">No dispatches recorded today.</td>
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

export default Dispatch;