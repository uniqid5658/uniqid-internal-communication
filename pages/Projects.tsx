
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Project, Role, ProjectStatus, MaterialTransactionType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Edit2, MapPin, Phone, Mail, Download, Trash2 } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project>>({});

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setProjects(DataService.getProjects());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject.name) return;

    const project: Project = {
      id: editingProject.id || Date.now().toString(),
      name: editingProject.name!,
      clientName: editingProject.clientName || '',
      clientEmail: editingProject.clientEmail || '',
      clientPhone: editingProject.clientPhone || '',
      address: editingProject.address || '',
      status: editingProject.status || ProjectStatus.PLANNED
    };

    // Auto-complete pending deliveries if project is marked COMPLETED
    if (project.status === ProjectStatus.COMPLETED) {
        const transactions = DataService.getTransactions();
        const pending = transactions.filter(t => 
            t.projectId === project.id && 
            t.type === MaterialTransactionType.OUT && 
            t.deliveryStatus !== 'DELIVERED'
        );

        if (pending.length > 0) {
            pending.forEach(t => {
                 // skipGlobalUpdate=true ensures we don't double-deduct from warehouse. 
                 // We are just updating the status to reflect the project completion.
                 DataService.saveTransaction({ ...t, deliveryStatus: 'DELIVERED' }, true);
            });
            alert(`Project marked Completed. ${pending.length} pending deliveries have been automatically marked as DELIVERED.`);
        }
    }

    DataService.saveProject(project);
    refreshData();
    setIsModalOpen(false);
    setEditingProject({});
  };

  const handleDelete = (id: string) => {
      if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
          DataService.deleteProject(id);
          refreshData();
      }
  };

  const openEdit = (p: Project) => {
      setEditingProject(p);
      setIsModalOpen(true);
  };

  const openNew = () => {
      setEditingProject({ status: ProjectStatus.PLANNED });
      setIsModalOpen(true);
  };

  const handleExport = (project: Project) => {
    // 1. Gather all related data
    const materials = DataService.getMaterials();
    const transactions = DataService.getTransactions().filter(t => t.projectId === project.id);
    const schedules = DataService.getEnrichedSchedules().filter(s => s.projectId === project.id);
    const meetings = DataService.getMeetings().filter(m => m.projectId === project.id);
    const users = DataService.getUsers();

    // 2. Build CSV Content
    const rows: string[] = [];

    // --- Section 1: Project Details ---
    rows.push(`PROJECT REPORT`);
    rows.push(`Project Name,${project.name}`);
    rows.push(`Status,${project.status}`);
    rows.push(`Address,${project.address}`);
    rows.push(`Client,${project.clientName} (${project.clientEmail} / ${project.clientPhone})`);
    rows.push(``); // Spacer

    // --- Section 2: Material History ---
    rows.push(`MATERIAL TRANSACTIONS`);
    rows.push(`Date,Material Name,Brand,Location,Type,Quantity,Unit,Delivery Status,Memo`);
    transactions.forEach(t => {
        const mat = materials.find(m => m.id === t.materialId);
        const dateStr = new Date(t.createdAt).toLocaleDateString() + ' ' + new Date(t.createdAt).toLocaleTimeString();
        // Handle commas in text fields
        const safeMemo = (t.memo || '').replace(/,/g, ' ');
        const safeMatName = (mat?.name || 'Unknown').replace(/,/g, ' ');
        const safeBrand = (mat?.brand || '').replace(/,/g, ' ');
        const safeLoc = (mat?.location || '').replace(/,/g, ' ');
        
        rows.push(`${dateStr},${safeMatName},${safeBrand},${safeLoc},${t.type},${t.quantity},${mat?.unit || ''},${t.deliveryStatus || '-'},${safeMemo}`);
    });
    if (transactions.length === 0) rows.push(`No material transactions recorded.`);
    rows.push(``);

    // --- Section 3: Worker Schedules ---
    rows.push(`WORKER SCHEDULES`);
    rows.push(`Start Time,End Time,Worker Name,Role,Notes`);
    schedules.forEach(s => {
        const start = new Date(s.startDatetime).toLocaleString();
        const end = new Date(s.endDatetime).toLocaleString();
        const workerName = (s.user?.name || 'Unknown').replace(/,/g, ' ');
        const safeNotes = (s.notes || '').replace(/,/g, ' ');

        rows.push(`${start},${end},${workerName},${s.roleOnSite},${safeNotes}`);
    });
    if (schedules.length === 0) rows.push(`No schedules recorded.`);
    rows.push(``);

    // --- Section 4: Meetings ---
    rows.push(`MEETINGS`);
    rows.push(`Date,Title,Type,Location,Participants`);
    meetings.forEach(m => {
        const date = new Date(m.startDatetime).toLocaleString();
        const safeTitle = m.title.replace(/,/g, ' ');
        const safeLoc = m.location.replace(/,/g, ' ');
        
        const participantNames = (m.participantIds || [])
            .map(pid => users.find(u => u.id === pid)?.name)
            .filter(Boolean)
            .join('; ');
        const safeParticipants = participantNames.replace(/,/g, ' ');
        
        rows.push(`${date},${safeTitle},${m.meetingType},${safeLoc},${safeParticipants}`);
    });
    if (meetings.length === 0) rows.push(`No meetings recorded.`);

    // 3. Create Blob and Download
    const csvContent = rows.join('\n');
    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Project_Export_${project.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
           <p className="text-gray-500 text-sm">Manage construction sites and client details.</p>
        </div>
        
        {user?.role === Role.ADMIN && (
          <Button onClick={openNew}>
            <Plus size={16} className="mr-2" /> New Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-5 flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{p.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded font-medium 
                            ${p.status === ProjectStatus.ACTIVE ? 'bg-green-100 text-green-700' : 
                              p.status === ProjectStatus.COMPLETED ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
                            {p.status}
                        </span>
                    </div>
                    
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <div className="flex items-start">
                            <MapPin size={16} className="mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                            <span>{p.address}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 mt-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Client Info</p>
                            <p className="font-medium text-gray-900">{p.clientName}</p>
                            <div className="flex items-center mt-1">
                                <Mail size={14} className="mr-2 text-gray-400" />
                                {p.clientEmail}
                            </div>
                            <div className="flex items-center mt-1">
                                <Phone size={14} className="mr-2 text-gray-400" />
                                {p.clientPhone}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end space-x-3">
                    {/* Export Button for ALL Projects */}
                    <button 
                        onClick={() => handleExport(p)}
                        className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center"
                        title="Download Excel/CSV Report"
                    >
                        <Download size={14} className="mr-1" /> Data
                    </button>

                    {user?.role === Role.ADMIN && (
                        <>
                            <button onClick={() => openEdit(p)} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                                <Edit2 size={14} className="mr-1" /> Edit
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center">
                                <Trash2 size={14} className="mr-1" /> Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProject.id ? "Edit Project" : "New Project"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={editingProject.name || ''}
              onChange={e => setEditingProject({...editingProject, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={editingProject.status || ProjectStatus.PLANNED}
              onChange={e => setEditingProject({...editingProject, status: e.target.value as ProjectStatus})}
            >
                <option value={ProjectStatus.PLANNED}>Planned</option>
                <option value={ProjectStatus.ACTIVE}>Active</option>
                <option value={ProjectStatus.COMPLETED}>Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address / Location</label>
            <input 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={editingProject.address || ''}
              onChange={e => setEditingProject({...editingProject, address: e.target.value})}
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
             <p className="text-sm font-medium text-gray-900 mb-2">Client Details</p>
             <div className="space-y-3">
                <input 
                    placeholder="Client Name"
                    className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                    value={editingProject.clientName || ''}
                    onChange={e => setEditingProject({...editingProject, clientName: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-3">
                    <input 
                        placeholder="Email"
                        className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        value={editingProject.clientEmail || ''}
                        onChange={e => setEditingProject({...editingProject, clientEmail: e.target.value})}
                    />
                    <input 
                        placeholder="Phone"
                        className="block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        value={editingProject.clientPhone || ''}
                        onChange={e => setEditingProject({...editingProject, clientPhone: e.target.value})}
                    />
                </div>
             </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="secondary" className="mr-2" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};