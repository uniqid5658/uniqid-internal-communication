import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Material, Role, Project, MaterialTransaction, MaterialTransactionType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, PackageCheck, ClipboardCheck, Trash2 } from 'lucide-react';

export const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [viewMode, setViewMode] = useState<'global' | 'active' | 'history'>('global');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [isGlobalEditModalOpen, setIsGlobalEditModalOpen] = useState(false);
  
  const [targetMaterial, setTargetMaterial] = useState<Material | null>(null);
  const [editingGlobalMaterial, setEditingGlobalMaterial] = useState<Partial<Material>>({});
  const [checkStockValue, setCheckStockValue] = useState<number>(0); 
  const [allocating, setAllocating] = useState({ materialId: '', quantity: 1, memo: '' });

  useEffect(() => { refreshData(); }, []);
  const refreshData = async () => {
    const [m, p, t] = await Promise.all([
        DataService.getMaterials(),
        DataService.getProjects(),
        DataService.getTransactions()
    ]);
    setMaterials(m);
    setProjects(p);
    setTransactions(t);
  };

  const handleGlobalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await DataService.saveMaterial({
      id: editingGlobalMaterial.id || Date.now().toString(),
      name: editingGlobalMaterial.name!,
      category: editingGlobalMaterial.category || 'General',
      brand: editingGlobalMaterial.brand || '',
      location: editingGlobalMaterial.location || '',
      unit: editingGlobalMaterial.unit || 'pcs',
      currentStock: Number(editingGlobalMaterial.currentStock) || 0,
      minStockLevel: Number(editingGlobalMaterial.minStockLevel) || 0,
      notes: editingGlobalMaterial.notes || ''
    });
    refreshData(); setIsGlobalEditModalOpen(false);
  };

  const handleStockCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMaterial || !selectedProjectId) return;
    await DataService.saveTransaction({
        id: Date.now().toString(),
        materialId: targetMaterial.id,
        projectId: selectedProjectId,
        type: MaterialTransactionType.CHECK,
        quantity: checkStockValue,
        performedBy: user?.id || 'sys',
        memo: 'Stock Check',
        createdAt: new Date().toISOString(),
        deliveryStatus: 'DELIVERED'
    });
    refreshData(); setIsStockModalOpen(false);
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    await DataService.saveTransaction({
      id: Date.now().toString(),
      materialId: allocating.materialId,
      projectId: selectedProjectId,
      type: MaterialTransactionType.OUT,
      quantity: Number(allocating.quantity),
      performedBy: user?.id || 'sys',
      memo: allocating.memo,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'PENDING'
    });
    refreshData(); setIsAllocModalOpen(false);
  };

  const getProjectStats = (pid: string) => {
      const projectTx = transactions.filter(t => t.projectId === pid).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const statsMap: Record<string, { allocated: number, current: number }> = {};
      projectTx.forEach(t => {
          if (!statsMap[t.materialId]) statsMap[t.materialId] = { allocated: 0, current: 0 };
          const rec = statsMap[t.materialId];
          if (t.type === MaterialTransactionType.OUT) {
              rec.allocated += t.quantity;
              if (t.deliveryStatus === 'DELIVERED') rec.current += t.quantity;   
          } else if (t.type === MaterialTransactionType.IN) {
              rec.current -= t.quantity;
          } else if (t.type === MaterialTransactionType.CHECK) {
              rec.current = t.quantity;
          }
      });
      return statsMap;
  };

  const projectStats = selectedProjectId ? getProjectStats(selectedProjectId) : {};
  const projectMaterialList = selectedProjectId ? Object.keys(projectStats).map(matId => ({
      material: materials.find(m => m.id === matId)!,
      stats: projectStats[matId]
  })).filter(i => i.material) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Materials</h1><div className="bg-gray-200 p-1 rounded-lg flex">{['global', 'active', 'history'].map(m => (<button key={m} onClick={() => { setViewMode(m as any); setSelectedProjectId(''); }} className={`px-4 py-2 text-sm uppercase ${viewMode === m ? 'bg-white shadow' : ''}`}>{m}</button>))}</div></div>
      {viewMode === 'global' && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 flex justify-between"><span className="font-bold">Global Inventory</span>{user?.role === Role.ADMIN && <Button onClick={() => { setEditingGlobalMaterial({}); setIsGlobalEditModalOpen(true); }}><Plus size={16} /> New</Button>}</div>
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs uppercase">Name</th><th className="px-6 py-3 text-left text-xs uppercase">Brand</th><th className="px-6 py-3 text-left text-xs uppercase">Loc</th><th className="px-6 py-3 text-left text-xs uppercase">Stock</th><th></th></tr></thead>
              <tbody>{materials.map(m => (<tr key={m.id}><td className="px-6 py-4">{m.name}</td><td className="px-6 py-4">{m.brand}</td><td className="px-6 py-4">{m.location}</td><td className="px-6 py-4">{m.currentStock} {m.unit}</td><td className="px-6 py-4 text-right">{user?.role === Role.ADMIN && <div className="flex justify-end gap-2"><button onClick={() => { setEditingGlobalMaterial(m); setIsGlobalEditModalOpen(true); }} className="text-blue-600">Edit</button><button onClick={async () => { if(confirm('Delete?')) { await DataService.deleteMaterial(m.id); refreshData(); }}} className="text-red-600"><Trash2 size={16} /></button></div>}</td></tr>))}</tbody>
          </table>
        </div>
      )}
      {viewMode !== 'global' && (
        <div className="space-y-6">
            <select className="w-full border p-2 rounded" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}><option value="">-- Select Project --</option>{(viewMode === 'active' ? projects.filter(p => p.status !== 'COMPLETED') : projects.filter(p => p.status === 'COMPLETED')).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            {selectedProjectId && (
                <div className="bg-white rounded-lg border shadow-sm">
                     <div className="p-4 flex justify-between"><span className="font-bold">Site Inventory</span>{user?.role === Role.ADMIN && viewMode === 'active' && <Button size="sm" onClick={() => setIsAllocModalOpen(true)}><PackageCheck size={16} /> Add Material</Button>}</div>
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead><tr><th className="px-6 py-3 text-left">Material</th><th className="px-6 py-3">On Site</th><th className="px-6 py-3">Allocated</th><th></th></tr></thead>
                        <tbody>{projectMaterialList.map(item => (<tr key={item.material.id}><td className="px-6 py-4">{item.material.name} <div className="text-xs text-gray-500">{item.material.brand}</div></td><td className="px-6 py-4 font-bold text-blue-700">{item.stats.current} {item.material.unit}</td><td className="px-6 py-4">{item.stats.allocated}</td><td className="px-6 py-4 text-right">{user?.role === Role.ADMIN && viewMode === 'active' && <button onClick={() => { setTargetMaterial(item.material); setCheckStockValue(item.stats.current); setIsStockModalOpen(true); }} className="text-blue-600 flex items-center float-right"><ClipboardCheck size={14} /> Check</button>}</td></tr>))}</tbody>
                     </table>
                </div>
            )}
        </div>
      )}
      {/* Modals are kept same, just calling async handlers */}
      <Modal isOpen={isGlobalEditModalOpen} onClose={() => setIsGlobalEditModalOpen(false)} title="Material"><form onSubmit={handleGlobalSave} className="space-y-4"><input required placeholder="Name" className="w-full border p-2" value={editingGlobalMaterial.name || ''} onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, name: e.target.value})} /><input placeholder="Brand" className="w-full border p-2" value={editingGlobalMaterial.brand || ''} onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, brand: e.target.value})} /><input placeholder="Location" className="w-full border p-2" value={editingGlobalMaterial.location || ''} onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, location: e.target.value})} /><div className="flex gap-2"><input placeholder="Stock" type="number" className="w-1/2 border p-2" value={editingGlobalMaterial.currentStock || ''} onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, currentStock: Number(e.target.value)})} /><input placeholder="Unit" className="w-1/2 border p-2" value={editingGlobalMaterial.unit || ''} onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, unit: e.target.value})} /></div><div className="flex justify-end"><Button type="submit">Save</Button></div></form></Modal>
      <Modal isOpen={isAllocModalOpen} onClose={() => setIsAllocModalOpen(false)} title="Add to Site"><form onSubmit={handleAllocate} className="space-y-4"><select className="w-full border p-2" value={allocating.materialId} onChange={e => setAllocating({...allocating, materialId: e.target.value})}><option value="">Select Material</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.currentStock})</option>)}</select><input type="number" className="w-full border p-2" placeholder="Qty" value={allocating.quantity} onChange={e => setAllocating({...allocating, quantity: Number(e.target.value)})} /><Button type="submit">Allocate</Button></form></Modal>
      <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title="Check Stock"><form onSubmit={handleStockCheck} className="space-y-4"><p className="text-sm">Enter actual count on site:</p><input type="number" className="w-full border p-2 font-bold" value={checkStockValue} onChange={e => setCheckStockValue(Number(e.target.value))} /><Button type="submit">Update</Button></form></Modal>
    </div>
  );
};
