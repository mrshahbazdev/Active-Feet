import React, { useState, useEffect } from 'react';
import { Employee, WorkLog, Payment } from '../types';
import { Users, UserPlus, Briefcase, CreditCard, ChevronRight, RefreshCcw } from 'lucide-react';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<{ workLogs: WorkLog[], payments: Payment[] }>({ workLogs: [], payments: [] });
  
  // Forms
  const [isAddingEmp, setIsAddingEmp] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', role: '', contact: '', dailyRate: '' });

  const [workForm, setWorkForm] = useState({ description: '', amount: '' });
  const [payForm, setPayForm] = useState({ amount: '', note: '' });

  const fetchEmployees = async () => {
    // @ts-ignore
    const data = await window.electron.employees.getAll();
    setEmployees(data);
    // Refresh selected employee if exists
    if (selectedEmployee) {
      const updated = data.find((e: Employee) => e.id === selectedEmployee.id);
      if (updated) {
          setSelectedEmployee(updated);
          // @ts-ignore
          const h = await window.electron.employees.getHistory(updated.id);
          setHistory(h);
      }
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSelectEmployee = async (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsAddingEmp(false);
    // @ts-ignore
    const h = await window.electron.employees.getHistory(emp.id);
    setHistory(h);
    // Reset forms
    setWorkForm({ description: 'Daily Wage', amount: emp.daily_rate.toString() });
    setPayForm({ amount: '', note: 'Salary' });
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name) return;
    
    // @ts-ignore
    const res = await window.electron.employees.create({
      ...newEmp,
      dailyRate: parseFloat(newEmp.dailyRate) || 0
    });

    if (res.success) {
      setIsAddingEmp(false);
      setNewEmp({ name: '', role: '', contact: '', dailyRate: '' });
      fetchEmployees();
    } else {
      alert("Error creating employee");
    }
  };

  const handleAddWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !workForm.amount) return;

    // @ts-ignore
    const res = await window.electron.work.add({
      employeeId: selectedEmployee.id,
      description: workForm.description,
      amount: parseFloat(workForm.amount)
    });

    if (res.success) {
      fetchEmployees();
      setWorkForm({ ...workForm, description: 'Daily Wage' }); // keep amount?
    } else {
      alert("Error adding work log");
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !payForm.amount) return;

    // @ts-ignore
    const res = await window.electron.payments.add({
      employeeId: selectedEmployee.id,
      amount: parseFloat(payForm.amount),
      note: payForm.note
    });

    if (res.success) {
      fetchEmployees();
      setPayForm({ amount: '', note: 'Salary' });
    } else {
      alert("Error adding payment");
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Employees & Payroll
          </h2>
          <p className="text-slate-500">Manage staff, track work, and pay salaries.</p>
        </div>
        <button onClick={fetchEmployees} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
          <RefreshCcw size={20} />
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 h-full overflow-hidden">
        
        {/* LEFT: Employee List */}
        <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-700">Staff List</h3>
            <button 
              onClick={() => { setSelectedEmployee(null); setIsAddingEmp(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
            >
              <UserPlus size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {employees.length === 0 && !isAddingEmp && (
               <div className="p-8 text-center text-slate-400">No employees found.</div>
             )}
             
             {employees.map(emp => (
               <div 
                 key={emp.id}
                 onClick={() => handleSelectEmployee(emp)}
                 className={`p-4 border-b border-slate-100 cursor-pointer transition-colors flex justify-between items-center ${selectedEmployee?.id === emp.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'}`}
               >
                 <div>
                   <h4 className="font-bold text-slate-800">{emp.name}</h4>
                   <p className="text-xs text-slate-500">{emp.role} • Rate: {emp.daily_rate}</p>
                 </div>
                 <div className="text-right">
                   <p className={`text-sm font-bold ${ (emp.balance || 0) > 0 ? 'text-red-500' : 'text-green-600' }`}>
                     {((emp.balance || 0) > 0 ? 'Due: ' : 'Paid: ')} 
                     ${Math.abs(emp.balance || 0).toFixed(2)}
                   </p>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* RIGHT: Details & Forms */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6 overflow-y-auto">
          
          {/* CREATE FORM */}
          {isAddingEmp && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Employee</h3>
              <form onSubmit={handleCreateEmployee} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                  <input required type="text" className="w-full p-2 border rounded" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                  <input type="text" className="w-full p-2 border rounded" placeholder="e.g. Cutter" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Contact</label>
                  <input type="text" className="w-full p-2 border rounded" value={newEmp.contact} onChange={e => setNewEmp({...newEmp, contact: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Daily Rate</label>
                  <input type="number" className="w-full p-2 border rounded" placeholder="0.00" value={newEmp.dailyRate} onChange={e => setNewEmp({...newEmp, dailyRate: e.target.value})} />
                </div>
                <div className="col-span-2 flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setIsAddingEmp(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save Employee</button>
                </div>
              </form>
            </div>
          )}

          {/* EMPLOYEE DETAILS DASHBOARD */}
          {selectedEmployee && !isAddingEmp && (
            <>
              {/* Stats Header */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedEmployee.name}</h2>
                  <p className="text-slate-500">{selectedEmployee.role} • {selectedEmployee.contact}</p>
                </div>
                <div className="text-right">
                   <p className="text-sm text-slate-400">Current Balance</p>
                   <p className={`text-3xl font-bold ${ (selectedEmployee.balance || 0) > 0 ? 'text-red-500' : 'text-green-500' }`}>
                     ${(selectedEmployee.balance || 0).toFixed(2)}
                   </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                 {/* WORK FORM */}
                 <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Briefcase size={18} className="text-blue-500"/> Record Work
                    </h4>
                    <form onSubmit={handleAddWork} className="space-y-3">
                       <input 
                         type="text" 
                         placeholder="Description (e.g. 10 Pairs)" 
                         className="w-full p-2 border rounded text-sm"
                         value={workForm.description}
                         onChange={e => setWorkForm({...workForm, description: e.target.value})}
                       />
                       <input 
                         type="number" 
                         placeholder="Amount Earned" 
                         className="w-full p-2 border rounded text-sm"
                         value={workForm.amount}
                         onChange={e => setWorkForm({...workForm, amount: e.target.value})}
                       />
                       <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium">
                         Add to Ledger
                       </button>
                    </form>
                 </div>

                 {/* PAY FORM */}
                 <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <CreditCard size={18} className="text-green-500"/> Pay Salary
                    </h4>
                    <form onSubmit={handleAddPayment} className="space-y-3">
                       <input 
                         type="number" 
                         placeholder="Amount Paid" 
                         className="w-full p-2 border rounded text-sm"
                         value={payForm.amount}
                         onChange={e => setPayForm({...payForm, amount: e.target.value})}
                       />
                       <input 
                         type="text" 
                         placeholder="Note (e.g. Cash/Transfer)" 
                         className="w-full p-2 border rounded text-sm"
                         value={payForm.note}
                         onChange={e => setPayForm({...payForm, note: e.target.value})}
                       />
                       <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium">
                         Record Payment
                       </button>
                    </form>
                 </div>
              </div>

              {/* HISTORY TABLE */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
                 <div className="bg-slate-50 p-3 border-b border-slate-200 font-semibold text-slate-700">Transaction History</div>
                 <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 text-slate-500">
                         <tr>
                           <th className="p-3">Date</th>
                           <th className="p-3">Description</th>
                           <th className="p-3 text-right">Earned (+)</th>
                           <th className="p-3 text-right">Paid (-)</th>
                         </tr>
                       </thead>
                       <tbody>
                          {/* Merge and sort history for display */}
                          {[
                            ...history.workLogs.map(w => ({ ...w, type: 'work', dateObj: new Date(w.date) })),
                            ...history.payments.map(p => ({ ...p, type: 'pay', dateObj: new Date(p.date) }))
                          ].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime()).map((item: any, idx) => (
                             <tr key={`${item.type}-${item.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <td className="p-3 text-slate-500">{new Date(item.date).toLocaleDateString()}</td>
                                <td className="p-3 text-slate-700">
                                  {item.type === 'work' ? (item.description || 'Work') : (item.note || 'Payment')}
                                </td>
                                <td className="p-3 text-right font-medium text-blue-600">
                                   {item.type === 'work' ? `$${item.amount}` : '-'}
                                </td>
                                <td className="p-3 text-right font-medium text-green-600">
                                   {item.type === 'pay' ? `$${item.amount}` : '-'}
                                </td>
                             </tr>
                          ))}
                          {history.workLogs.length === 0 && history.payments.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-400">No transactions recorded.</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Employees;