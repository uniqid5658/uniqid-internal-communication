import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Material, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, AlertCircle } from 'lucide-react';

export const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Partial<Material>>({});

  useEffect(() => {
    setMaterials(DataService.getMaterials());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial.name) return;

    const newMaterial: Material = {
      id: editingMaterial.id || Date.now().toString(),
      name: editingMaterial.name!,
      category: editingMaterial.category || 'General',
      unit: editingMaterial.unit || 'pcs',
      currentStock: Number(editingMaterial.currentStock) || 0,
      minStockLevel: Number(editingMaterial.minStockLevel) || 0,
      notes: editingMaterial.notes || ''
    };

    DataService.saveMaterial(newMaterial);
    setMaterials(DataService.getMaterials());
    setIsModalOpen(false);
    setEditingMaterial({});
  };

  const filtered = materials.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Materials Inventory</h1>
        {user?.role === Role.ADMIN && (
          <Button onClick={() => { setEditingMaterial({}); setIsModalOpen(true); }}>
            <Plus size={16} className="mr-2" /> Add Material
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
             <input 
                type="text" 
                placeholder="Search materials..." 
                className="pl-10 w-full sm:w-64 border border-gray-300 rounded-md py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {user?.role === Role.ADMIN && <th className="px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((m) => {
                const isLow = m.currentStock <= m.minStockLevel;
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {m.currentStock} <span className="text-gray-400 text-xs">{m.unit}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       {isLow ? (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                           <AlertCircle size={12} className="mr-1" /> Low Stock
                         </span>
                       ) : (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           OK
                         </span>
                       )}
                    </td>
                    {user?.role === Role.ADMIN && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => { setEditingMaterial(m); setIsModalOpen(true); }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingMaterial.id ? "Edit Material" : "Add Material"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
              value={editingMaterial.name || ''}
              onChange={e => setEditingMaterial({...editingMaterial, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={editingMaterial.category || ''}
                onChange={e => setEditingMaterial({...editingMaterial, category: e.target.value})}
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <input 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={editingMaterial.unit || ''}
                onChange={e => setEditingMaterial({...editingMaterial, unit: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Stock</label>
              <input 
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={editingMaterial.currentStock || ''}
                onChange={e => setEditingMaterial({...editingMaterial, currentStock: Number(e.target.value)})}
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Min Stock Alert</label>
              <input 
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={editingMaterial.minStockLevel || ''}
                onChange={e => setEditingMaterial({...editingMaterial, minStockLevel: Number(e.target.value)})}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="button" variant="secondary" className="mr-2" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
