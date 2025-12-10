
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Material, Role, Project, MaterialTransaction, MaterialTransactionType, ProjectStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, AlertCircle, PackageCheck, Layers, ClipboardCheck, History, Globe, Pencil, Trash2 } from 'lucide-react';

export const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  
  // View Mode: 'global' | 'active' | 'history'
  const [viewMode, setViewMode] = useState<'global' | 'active' | 'history'>('global');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [search, setSearch] = useState('');
  
  // Modals
  const [isStockModalOpen, setIsStockModalOpen] = useState(false); // For "Check Stock"
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false); // For "Add Material"
  const [isGlobalEditModalOpen, setIsGlobalEditModalOpen] = useState(false); // For "Global Edit"
  
  // State for Editing/Actions
  const [targetMaterial, setTargetMaterial] = useState<Material | null>(null);
  
  // 1. Global Edit State
  const [editingGlobalMaterial, setEditingGlobalMaterial] = useState<Partial<Material>>({});

  // 2. Stock Check State
  const [checkStockValue, setCheckStockValue] = useState<number>(0); 
  const [prevStockValue, setPrevStockValue] = useState<number>(0);

  // 3. New Allocation State
  const [allocating, setAllocating] = useState({ materialId: '', quantity: 1, memo: '' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setMaterials(DataService.getMaterials());
    setProjects(DataService.getProjects());
    setTransactions(DataService.getTransactions());
  };

  // --- HANDLERS ---

  // 1. Global Material Edit / Create
  const handleGlobalSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGlobalMaterial.name) return;

    const material: Material = {
      id: editingGlobalMaterial.id || Date.now().toString(),
      name: editingGlobalMaterial.name!,
      category: editingGlobalMaterial.category || 'General',
      brand: editingGlobalMaterial.brand || '',
      location: editingGlobalMaterial.location || '',
      unit: editingGlobalMaterial.unit || 'pcs',
      currentStock: Number(editingGlobalMaterial.currentStock) || 0,
      minStockLevel: Number(editingGlobalMaterial.minStockLevel) || 0,
      notes: editingGlobalMaterial.notes || ''
    };

    DataService.saveMaterial(material);
    refreshData();
    setIsGlobalEditModalOpen(false);
    setEditingGlobalMaterial({});
  };

  const handleGlobalDelete = (id: string) => {
      if (window.confirm("Are you sure you want to delete this material?")) {
          DataService.deleteMaterial(id);
          refreshData();
      }
  };

  // 2. Stock Check (Updates Current Stock ONLY, does not affect Total Used)
  const handleStockCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMaterial || !selectedProjectId) return;
    
    // We strictly use CHECK type. This updates the "Current" snapshot but is excluded from "Total Used".
    const tx: MaterialTransaction = {
        id: Date.now().toString(),
        materialId: targetMaterial.id,
        projectId: selectedProjectId,
        type: MaterialTransactionType.CHECK,
        quantity: checkStockValue, // The actual number on site
        performedBy: user?.id || 'sys',
        memo: 'Stock Check Adjustment',
        createdAt: new Date().toISOString(),
        deliveryStatus: 'DELIVERED'
    };

    DataService.saveTransaction(tx); // Pass skipGlobalUpdate=false if we wanted to sync, but here we likely want isolated check
    refreshData();
    setIsStockModalOpen(false);
  };

  // 3. Allocate (Add Material -> Increases Total Used AND Current Stock)
  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocating.materialId || !selectedProjectId) return;

    const tx: MaterialTransaction = {
      id: Date.now().toString(),
      materialId: allocating.materialId,
      projectId: selectedProjectId,
      type: MaterialTransactionType.OUT,
      quantity: Number(allocating.quantity),
      performedBy: user?.id || 'sys',
      memo: allocating.memo || 'Additional Stock',
      createdAt: new Date().toISOString(),
      // NEW: Automatically set to PENDING for the Delivery module
      deliveryStatus: 'PENDING'
    };

    DataService.saveTransaction(tx);
    refreshData();
    setIsAllocModalOpen(false);
    setAllocating({ materialId: '', quantity: 1, memo: '' });
  };

  // --- OPEN MODALS ---

  const openGlobalEdit = (material?: Material) => {
      if (material) {
          setEditingGlobalMaterial(material);
      } else {
          setEditingGlobalMaterial({});
      }
      setIsGlobalEditModalOpen(true);
  };

  const openStockCheckModal = (material: Material, currentSiteStock: number) => {
      setTargetMaterial(material);
      setCheckStockValue(currentSiteStock);
      setPrevStockValue(currentSiteStock);
      setIsStockModalOpen(true);
  };

  // --- STATS LOGIC ---

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  const activeProjects = projects.filter(p => p.status !== ProjectStatus.COMPLETED);
  const completedProjects = projects.filter(p => p.status === ProjectStatus.COMPLETED);

  // New Logic for Stats:
  // Total Used = Sum(OUT)
  // Current Stock = Chronological calc (OUT adds, IN removes, CHECK resets)
  const getProjectStats = (pid: string) => {
      // Get all tx for project, sorted OLD -> NEW
      const projectTx = transactions
        .filter(t => t.projectId === pid)
        .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const statsMap: Record<string, { allocated: number, current: number }> = {};

      projectTx.forEach(t => {
          if (!statsMap[t.materialId]) {
              statsMap[t.materialId] = { allocated: 0, current: 0 };
          }
          const rec = statsMap[t.materialId];

          if (t.type === MaterialTransactionType.OUT) {
              rec.allocated += t.quantity; // Accumulates
              
              // Only add to current stock if delivered
              if (t.deliveryStatus === 'DELIVERED') {
                 rec.current += t.quantity;   
              }
              // If PENDING or IN_TRANSIT, it doesn't physically exist on site yet, so current stays same.
              
          } else if (t.type === MaterialTransactionType.IN) {
              rec.current -= t.quantity;   // Removes from stock (Returns)
          } else if (t.type === MaterialTransactionType.CHECK) {
              rec.current = t.quantity;    // Resets stock (Override)
          }
      });

      return statsMap;
  };

  const projectStats = selectedProjectId ? getProjectStats(selectedProjectId) : {};

  const projectMaterialList = selectedProjectId ? Object.keys(projectStats).map(matId => {
      const mat = materials.find(m => m.id === matId);
      if (!mat) return null;
      return {
          material: mat,
          stats: projectStats[matId]
      };
  }).filter(Boolean) as { material: Material, stats: { allocated: number, current: number } }[] : [];

  // History List: Filter OUT 'CHECK' type so it doesn't influence the "Allocation History" view
  const projectHistoryList = selectedProjectId ? transactions
    .filter(t => t.projectId === selectedProjectId && t.type !== MaterialTransactionType.CHECK) 
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Newest first
    .map(t => {
        const mat = materials.find(m => m.id === t.materialId);
        return { 
            ...t, 
            materialName: mat?.name || 'Unknown', 
            materialBrand: mat?.brand, 
            materialLocation: mat?.location,
            unit: mat?.unit 
        };
    }) : [];


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Materials Management</h1>
           <p className="text-gray-500 text-sm">Manage inventory, allocations, and history.</p>
        </div>

        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            <button 
                onClick={() => { setViewMode('global'); setSelectedProjectId(''); }}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${viewMode === 'global' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <Globe size={16} className="mr-2" /> Global Inventory
            </button>
            <button 
                onClick={() => { setViewMode('active'); setSelectedProjectId(''); }}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${viewMode === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <Layers size={16} className="mr-2" /> Active Projects
            </button>
            <button 
                onClick={() => { setViewMode('history'); setSelectedProjectId(''); }}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${viewMode === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <History size={16} className="mr-2" /> Completed History
            </button>
        </div>
      </div>

      {/* --- GLOBAL VIEW --- */}
      {viewMode === 'global' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between">
             <div className="relative max-w-md w-full">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
               <input 
                  type="text" 
                  placeholder="Search total inventory..." 
                  className="pl-10 w-full border border-gray-300 rounded-md py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             {user?.role === Role.ADMIN && (
                <Button onClick={() => openGlobalEdit()}>
                    <Plus size={16} className="mr-2" /> New Material
                </Button>
             )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  {/* ACTIONS Restored for Global View */}
                  {user?.role === Role.ADMIN && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaterials.map((m) => {
                  const isLow = m.currentStock <= m.minStockLevel;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.brand || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.location || '-'}</td>
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                          <button onClick={() => openGlobalEdit(m)} className="text-blue-600 hover:text-blue-900">Edit</button>
                          <button onClick={() => handleGlobalDelete(m.id)} className="text-red-500 hover:text-red-700">
                             <Trash2 size={16} />
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
      )}

      {/* --- ACTIVE / HISTORY PROJECT VIEW --- */}
      {viewMode !== 'global' && (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Select Project:</span>
                <select 
                    className="flex-1 max-w-md border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                    <option value="">-- Select --</option>
                    {(viewMode === 'active' ? activeProjects : completedProjects).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                    ))}
                </select>
            </div>

            {selectedProjectId && (
                <>
                {/* 1. STOCK SUMMARY (Aggregated) */}
                <div className="bg-white rounded-lg border border-blue-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-blue-100 bg-blue-50/30 flex justify-between items-center">
                        <div>
                            <h3 className="text-md font-bold text-gray-800">Site Inventory Summary</h3>
                            <p className="text-xs text-gray-500">Aggregated view of materials on site.</p>
                        </div>
                        {user?.role === Role.ADMIN && viewMode === 'active' && (
                            <Button size="sm" onClick={() => setIsAllocModalOpen(true)}>
                                <PackageCheck size={16} className="mr-2" /> Add Material
                            </Button>
                        )}
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock (On Site)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Used (Allocated)</th>
                                {user?.role === Role.ADMIN && viewMode === 'active' && <th className="px-6 py-3 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projectMaterialList.map((item) => (
                                <tr key={item.material.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div className="text-sm font-medium text-gray-900">{item.material.name}</div>
                                        <div className="text-xs text-gray-500">{item.material.brand} {item.material.location ? `• ${item.material.location}` : ''}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                                        {item.stats.current} {item.material.unit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.stats.allocated} {item.material.unit}
                                    </td>
                                    {user?.role === Role.ADMIN && viewMode === 'active' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => openStockCheckModal(item.material, item.stats.current)}
                                                className="text-gray-600 hover:text-blue-800 flex items-center justify-end w-full"
                                                title="Log Stock Check"
                                            >
                                                <ClipboardCheck size={14} className="mr-1" /> Check Stock
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {projectMaterialList.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No materials allocated.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 2. ALLOCATION HISTORY (Detailed) */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-md font-bold text-gray-800 flex items-center">
                            <History size={18} className="mr-2 text-gray-500" /> 
                            {viewMode === 'active' ? 'Allocation History' : 'Project History (Archived)'}
                        </h3>
                        <p className="text-xs text-gray-500">Detailed list of all inputs. (Adjustments & Checks excluded)</p>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Memo</th>
                                {/* Actions REMOVED for Active/History views as requested */}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projectHistoryList.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                        {new Date(tx.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{tx.materialName}</div>
                                        <div className="text-xs text-gray-500">{tx.materialBrand}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                                        <span className={`px-2 py-0.5 rounded ${tx.type === 'OUT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {tx.type === 'OUT' ? 'ALLOCATED' : 'RETURNED'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                        {tx.quantity} {tx.unit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                                        {tx.memo}
                                    </td>
                                </tr>
                            ))}
                            {projectHistoryList.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No history records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                </>
            )}
        </div>
      )}

      {/* MODAL 1: GLOBAL EDIT / CREATE */}
      <Modal 
        isOpen={isGlobalEditModalOpen} 
        onClose={() => setIsGlobalEditModalOpen(false)} 
        title={editingGlobalMaterial.id ? "Edit Material (Global)" : "Create New Material"}
      >
        <form onSubmit={handleGlobalSave} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input 
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={editingGlobalMaterial.name || ''}
                onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, name: e.target.value})}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700">Brand</label>
                <input 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={editingGlobalMaterial.brand || ''}
                    onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, brand: e.target.value})}
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={editingGlobalMaterial.location || ''}
                    onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, location: e.target.value})}
                />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={editingGlobalMaterial.category || ''}
                    onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, category: e.target.value})}
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <input 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={editingGlobalMaterial.unit || ''}
                    onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, unit: e.target.value})}
                />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700">Total Stock</label>
                <input 
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={editingGlobalMaterial.currentStock || ''}
                    onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, currentStock: Number(e.target.value)})}
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700">Min Stock Alert</label>
                <input 
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={editingGlobalMaterial.minStockLevel || ''}
                    onChange={e => setEditingGlobalMaterial({...editingGlobalMaterial, minStockLevel: Number(e.target.value)})}
                />
                </div>
            </div>
            
            <div className="flex justify-end pt-4">
            <Button type="button" variant="secondary" className="mr-2" onClick={() => setIsGlobalEditModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
            </div>
        </form>
      </Modal>

      {/* MODAL 2: STOCK CHECK (Update Current Stock Only) */}
      <Modal 
        isOpen={isStockModalOpen} 
        onClose={() => setIsStockModalOpen(false)} 
        title={`Log Stock Check: ${targetMaterial?.name}`}
      >
        <form onSubmit={handleStockCheck} className="space-y-4">
             <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 mb-4 border border-blue-100">
                <p className="font-semibold">Project: {projects.find(p => p.id === selectedProjectId)?.name}</p>
                <p className="mt-1">Enter the actual count on site. This will update the "Current Stock" display but <strong>will not</strong> affect the total allocated amount or the allocation history log.</p>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700">Actual Count on Site</label>
                <input 
                    type="number"
                    className="mt-1 block w-full rounded-md border-blue-300 shadow-sm p-2 border bg-white text-lg font-bold text-blue-700"
                    value={checkStockValue}
                    onChange={e => setCheckStockValue(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Previous System Count: {prevStockValue}</p>
             </div>
          
            <div className="flex justify-end pt-4">
                <Button type="button" variant="secondary" className="mr-2" onClick={() => setIsStockModalOpen(false)}>Cancel</Button>
                <Button type="submit">Update Display</Button>
            </div>
        </form>
      </Modal>

      {/* MODAL 3: ALLOCATE (Add Material) */}
      <Modal
        isOpen={isAllocModalOpen}
        onClose={() => setIsAllocModalOpen(false)}
        title="Add Material to Site"
      >
         <form onSubmit={handleAllocate} className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded mb-4">
              Project: <strong>{projects.find(p => p.id === selectedProjectId)?.name}</strong>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700">Select Material</label>
               <select 
                 required 
                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                 value={allocating.materialId}
                 onChange={e => setAllocating({...allocating, materialId: e.target.value})}
               >
                 <option value="">-- Choose Material --</option>
                 {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (Available: {m.currentStock} {m.unit})</option>
                 ))}
               </select>
            </div>

            <div>
              {/* Renamed to Additional Stock as requested */}
              <label className="block text-sm font-medium text-gray-700">Additional Stock (Qty)</label>
              <input 
                 type="number"
                 required
                 min="1"
                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                 value={allocating.quantity}
                 onChange={e => setAllocating({...allocating, quantity: Number(e.target.value)})}
              />
              <p className="text-xs text-gray-500 mt-1">This amount will be added to Total Used and Current Stock.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Memo / Note</label>
              <input 
                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                 placeholder="e.g. Additional batch for hallway"
                 value={allocating.memo}
                 onChange={e => setAllocating({...allocating, memo: e.target.value})}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" variant="secondary" className="mr-2" onClick={() => setIsAllocModalOpen(false)}>Cancel</Button>
              <Button type="submit">Add to Site</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};