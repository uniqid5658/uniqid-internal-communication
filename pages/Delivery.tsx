
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Project, MaterialTransaction, Material, ProjectStatus, DeliveryStatus, MaterialTransactionType, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Truck, CheckCircle, ArrowRight, Calendar, Package, Briefcase, Edit2, History, Clock, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export const DeliveryPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  // View State
  const [groupBy, setGroupBy] = useState<'date' | 'project'>('date');
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Partial<MaterialTransaction>>({});
  const [originalQty, setOriginalQty] = useState<number>(0);
  
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setTransactions(DataService.getTransactions());
    setProjects(DataService.getProjects());
    setMaterials(DataService.getMaterials());
  };

  const updateStatus = (tx: MaterialTransaction, newStatus: DeliveryStatus) => {
    const updatedTx = { ...tx, deliveryStatus: newStatus };
    // Pass skipGlobalUpdate=true because status change doesn't affect Warehouse stock (only site stock logic reads status)
    DataService.saveTransaction(updatedTx, true);
    refreshData();
  };

  const handleDelete = (id: string) => {
      if (window.confirm("Delete this delivery allocation? Items will be returned to warehouse stock.")) {
          // Default delete reverses the stock allocation (false = do NOT skip global update)
          DataService.deleteTransaction(id, false); 
          refreshData();
      }
  };

  // --- EDIT HANDLERS ---
  const openEditModal = (tx: MaterialTransaction) => {
      setEditingTx({ ...tx });
      setOriginalQty(tx.quantity);
      setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTx.id || !editingTx.quantity || !editingTx.materialId) return;

      const qtyDiff = editingTx.quantity - originalQty;

      // 1. Update the Transaction (includes Status change if modified in modal)
      // We pass skipGlobalUpdate=true to saveTransaction because we want to handle the warehouse stock adjustment manually/smartly below.
      DataService.saveTransaction(editingTx as MaterialTransaction, true);

      // 2. Adjust Warehouse Stock if Quantity Changed
      if (qtyDiff !== 0) {
          const material = materials.find(m => m.id === editingTx.materialId);
          if (material) {
              // If we increased allocation (diff > 0), warehouse stock goes DOWN.
              // If we decreased allocation (diff < 0), warehouse stock goes UP.
              material.currentStock -= qtyDiff;
              DataService.saveMaterial(material);
          }
      }

      setIsEditModalOpen(false);
      refreshData();
  };

  // --- DATA PREP ---

  // Helper to get names
  const getMaterial = (id: string) => materials.find(m => m.id === id);
  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown';

  // 1. Filter: Only OUT transactions (Allocations), active projects
  const deliveryItems = transactions
    .filter(t => t.type === MaterialTransactionType.OUT && t.projectId)
    .filter(t => {
        const proj = projects.find(p => p.id === t.projectId);
        return proj && proj.status !== ProjectStatus.COMPLETED;
    })
    // Filter by View Mode (Active vs History)
    .filter(t => {
        const isDelivered = t.deliveryStatus === 'DELIVERED';
        return viewMode === 'active' ? !isDelivered : isDelivered;
    });

  // 2. Grouping Logic
  let groupedItems: Record<string, MaterialTransaction[]> = {};
  let sortedKeys: string[] = [];

  if (groupBy === 'date') {
      groupedItems = deliveryItems.reduce((acc, item) => {
        const dateKey = new Date(item.createdAt).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
      }, {} as Record<string, MaterialTransaction[]>);

      sortedKeys = Object.keys(groupedItems).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  } else {
      // Group by Project Name
      groupedItems = deliveryItems.reduce((acc, item) => {
          const projName = getProjectName(item.projectId!);
          if (!acc[projName]) acc[projName] = [];
          acc[projName].push(item);
          return acc;
      }, {} as Record<string, MaterialTransaction[]>);
      
      sortedKeys = Object.keys(groupedItems).sort();
  }

  const getStatusColor = (status?: DeliveryStatus) => {
      switch(status) {
          case 'PENDING': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'IN_TRANSIT': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  const editingMaterial = getMaterial(editingTx.materialId || '');

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Delivery Schedule</h1>
                    <p className="text-gray-500 text-sm">Track material allocations and delivery status.</p>
                </div>
                
                {/* Group Toggle */}
                <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg self-start md:self-auto">
                        <button 
                            onClick={() => setGroupBy('date')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center ${groupBy === 'date' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <Calendar size={14} className="mr-1.5" /> By Date
                        </button>
                        <button 
                            onClick={() => setGroupBy('project')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center ${groupBy === 'project' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            <Briefcase size={14} className="mr-1.5" /> By Project
                        </button>
                </div>
           </div>

           {/* Tabs: Active vs History */}
           <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${viewMode === 'active' 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Clock size={16} className="mr-2" />
                        Active Deliveries
                        <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                            {transactions.filter(t => t.type === MaterialTransactionType.OUT && t.projectId && t.deliveryStatus !== 'DELIVERED').length}
                        </span>
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${viewMode === 'history' 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <History size={16} className="mr-2" />
                        Delivery History
                    </button>
                </nav>
           </div>
       </div>

       {sortedKeys.length === 0 ? (
           <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
               <Truck size={48} className="mx-auto text-gray-300 mb-4" />
               <p className="text-gray-500">
                   {viewMode === 'active' ? 'No active deliveries.' : 'No delivery history found.'}
               </p>
           </div>
       ) : (
           <div className="space-y-8">
               {sortedKeys.map(groupKey => (
                   <div key={groupKey} className="relative">
                       {/* Group Header */}
                       <div className="sticky top-0 bg-gray-50 z-10 py-2 mb-3 flex items-center">
                           {groupBy === 'date' ? <Calendar size={18} className="text-blue-600 mr-2" /> : <Briefcase size={18} className="text-blue-600 mr-2" />}
                           <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{groupKey}</h3>
                           <div className="h-px bg-gray-200 flex-1 ml-4"></div>
                       </div>

                       {/* List of Deliveries */}
                       <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                           {groupedItems[groupKey].map(item => {
                               const mat = getMaterial(item.materialId);
                               return (
                               <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                                   <div>
                                       <div className="flex justify-between items-start mb-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(item.deliveryStatus)}`}>
                                                {item.deliveryStatus || 'PENDING'}
                                            </span>
                                            
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-400">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                                {/* Edit Button */}
                                                <button 
                                                    onClick={() => openEditModal(item)}
                                                    className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Edit Details"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                {/* Delete Button */}
                                                {user?.role === Role.ADMIN && (
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete (Undo Allocation)"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                       </div>
                                       
                                       <div className="flex items-start mb-2">
                                           <Package size={16} className="text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                           <div>
                                               <p className="font-semibold text-gray-900">{mat?.name || 'Unknown'}</p>
                                               <p className="text-xs text-gray-500">
                                                    {mat?.brand ? `${mat.brand} • ` : ''} 
                                                    {mat?.location || 'No Loc'}
                                               </p>
                                               <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity} {mat?.unit}</p>
                                           </div>
                                       </div>

                                       <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-3">
                                           <span className="font-semibold text-gray-700 block mb-1">
                                               {groupBy === 'date' ? 'Project:' : 'Ordered:'}
                                           </span>
                                           {groupBy === 'date' ? getProjectName(item.projectId!) : new Date(item.createdAt).toLocaleString()}
                                       </div>
                                       
                                       {item.memo && (
                                           <p className="text-xs text-gray-400 italic mb-3">"{item.memo}"</p>
                                       )}
                                   </div>

                                   {/* Workflow Buttons (Only in Active View) */}
                                   {viewMode === 'active' && (
                                        <div className="pt-3 border-t border-gray-100 flex justify-end">
                                                {(!item.deliveryStatus || item.deliveryStatus === 'PENDING') && (
                                                    <button 
                                                        onClick={() => updateStatus(item, 'IN_TRANSIT')}
                                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-3 py-1.5 rounded-md"
                                                    >
                                                        Start Transit <ArrowRight size={12} className="ml-1" />
                                                    </button>
                                                )}
                                                {item.deliveryStatus === 'IN_TRANSIT' && (
                                                    <button 
                                                        onClick={() => updateStatus(item, 'DELIVERED')}
                                                        className="text-xs font-medium text-green-600 hover:text-green-800 flex items-center bg-green-50 px-3 py-1.5 rounded-md"
                                                    >
                                                        Mark Delivered <CheckCircle size={12} className="ml-1" />
                                                    </button>
                                                )}
                                        </div>
                                   )}
                                   
                                   {viewMode === 'history' && (
                                       <div className="pt-3 border-t border-gray-100 flex justify-end">
                                            <span className="text-xs text-gray-400 flex items-center">
                                                Completed <CheckCircle size={12} className="ml-1" />
                                            </span>
                                       </div>
                                   )}
                               </div>
                           );})}
                       </div>
                   </div>
               ))}
           </div>
       )}

       <Modal
         isOpen={isEditModalOpen}
         onClose={() => setIsEditModalOpen(false)}
         title="Edit Allocation Details"
       >
         <form onSubmit={handleSaveEdit} className="space-y-4">
             <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-2">
                 Editing <strong>{editingMaterial?.name}</strong> for <strong>{getProjectName(editingTx.projectId || '')}</strong>.
                 <br/>
                 <span className="text-xs font-medium text-blue-600">{editingMaterial?.brand} - {editingMaterial?.location}</span>
                 <br/>
                 <span className="text-xs opacity-75">Changes to quantity will automatically update warehouse stock.</span>
             </div>

             <div>
                 <label className="block text-sm font-medium text-gray-700">Quantity</label>
                 <input 
                    type="number"
                    min="1"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={editingTx.quantity}
                    onChange={e => setEditingTx({...editingTx, quantity: Number(e.target.value)})}
                 />
             </div>

             <div>
                 <label className="block text-sm font-medium text-gray-700">Status</label>
                 <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={editingTx.deliveryStatus || 'PENDING'}
                    onChange={e => setEditingTx({...editingTx, deliveryStatus: e.target.value as DeliveryStatus})}
                 >
                     <option value="PENDING">Pending</option>
                     <option value="IN_TRANSIT">In Transit</option>
                     <option value="DELIVERED">Delivered (Move to History)</option>
                 </select>
                 <p className="text-xs text-gray-500 mt-1">Changing to "Delivered" will move this item to the History tab.</p>
             </div>

             <div>
                 <label className="block text-sm font-medium text-gray-700">Memo</label>
                 <input 
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={editingTx.memo || ''}
                    onChange={e => setEditingTx({...editingTx, memo: e.target.value})}
                 />
             </div>

             <div className="flex justify-end pt-4">
                 <Button type="button" variant="secondary" className="mr-2" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                 <Button type="submit">Save Changes</Button>
             </div>
         </form>
       </Modal>
    </div>
  );
};