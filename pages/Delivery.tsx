import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { MaterialTransaction, Role, MaterialTransactionType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export const DeliveryPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [groupBy, setGroupBy] = useState<'date' | 'project'>('date');
  const [editingTx, setEditingTx] = useState<Partial<MaterialTransaction>>({});
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [origQty, setOrigQty] = useState(0);

  useEffect(() => { refreshData(); }, []);
  const refreshData = async () => { 
      setTransactions(await DataService.getTransactions()); 
      setMaterials(await DataService.getMaterials()); 
      setProjects(await DataService.getProjects()); 
  };

  const updateStatus = async (tx: MaterialTransaction, status: any) => { await DataService.saveTransaction({ ...tx, deliveryStatus: status }, true); refreshData(); };
  const handleDelete = async (id: string) => { if (confirm("Delete?")) { await DataService.deleteTransaction(id, false); refreshData(); } };
  const saveEdit = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!editingTx.id) return; 
      const diff = (editingTx.quantity || 0) - origQty; 
      await DataService.saveTransaction(editingTx as MaterialTransaction, true); 
      if (diff !== 0) { 
          const m = materials.find(x => x.id === editingTx.materialId); 
          if (m) { m.currentStock -= diff; await DataService.saveMaterial(m); } 
      } 
      setIsEditOpen(false); refreshData(); 
  };

  const list = transactions.filter(t => t.type === MaterialTransactionType.OUT && t.projectId);
  const filtered = list.filter(t => viewMode === 'active' ? t.deliveryStatus !== 'DELIVERED' : t.deliveryStatus === 'DELIVERED');
  const grouped: Record<string, MaterialTransaction[]> = {};
  filtered.forEach(t => { const key = groupBy === 'date' ? new Date(t.createdAt).toLocaleDateString() : projects.find(p => p.id === t.projectId)?.name || 'Unknown'; if (!grouped[key]) grouped[key] = []; grouped[key].push(t); });

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Delivery</h1><div className="flex bg-gray-200 rounded p-1"><button onClick={() => setViewMode('active')} className={`px-3 py-1 ${viewMode==='active'?'bg-white shadow':''}`}>Active</button><button onClick={() => setViewMode('history')} className={`px-3 py-1 ${viewMode==='history'?'bg-white shadow':''}`}>History</button></div></div>
       <div className="flex gap-2"><button onClick={() => setGroupBy('date')} className={`text-sm ${groupBy==='date'?'font-bold':''}`}>By Date</button> | <button onClick={() => setGroupBy('project')} className={`text-sm ${groupBy==='project'?'font-bold':''}`}>By Project</button></div>
       {Object.keys(grouped).map(key => (<div key={key}><h3 className="bg-gray-100 p-2 font-bold">{key}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">{grouped[key].map(t => { const m = materials.find(x => x.id === t.materialId); const p = projects.find(x => x.id === t.projectId); return (<div key={t.id} className="bg-white p-4 border rounded shadow-sm relative group"><div className="flex justify-between"><span className="font-bold">{m?.name}</span><span className="text-xs bg-gray-100 p-1 rounded">{t.deliveryStatus}</span></div><div className="text-sm text-gray-500">{m?.brand} • {m?.location}</div><div className="text-sm mt-1">Qty: {t.quantity} {m?.unit}</div><div className="text-xs text-gray-400 mt-1">{p?.name}</div><div className="mt-3 flex gap-2 justify-end"><button onClick={() => { setEditingTx(t); setOrigQty(t.quantity); setIsEditOpen(true); }} className="text-blue-500 opacity-0 group-hover:opacity-100"><Edit2 size={16}/></button>{user?.role === Role.ADMIN && <button onClick={() => handleDelete(t.id)} className="text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>}{viewMode === 'active' && (<>{t.deliveryStatus === 'PENDING' && <button onClick={() => updateStatus(t, 'IN_TRANSIT')} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Transit</button>}{t.deliveryStatus === 'IN_TRANSIT' && <button onClick={() => updateStatus(t, 'DELIVERED')} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">Deliver</button>}</>)}</div></div>); })}</div></div>))}
       <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Delivery"><form onSubmit={saveEdit} className="space-y-4"><input type="number" className="w-full border p-2" value={editingTx.quantity} onChange={e => setEditingTx({...editingTx, quantity: Number(e.target.value)})} /><select className="w-full border p-2" value={editingTx.deliveryStatus} onChange={e => setEditingTx({...editingTx, deliveryStatus: e.target.value as any})} ><option value="PENDING">PENDING</option><option value="IN_TRANSIT">IN TRANSIT</option><option value="DELIVERED">DELIVERED</option></select><input className="w-full border p-2" value={editingTx.memo} onChange={e => setEditingTx({...editingTx, memo: e.target.value})} /><Button type="submit">Save</Button></form></Modal>
    </div>
  );
};
