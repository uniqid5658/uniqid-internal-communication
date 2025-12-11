import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { WorkerSchedule, Role, User, Project } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Edit2, List, Calendar, Download } from 'lucide-react';

export const SchedulesPage: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [displayType, setDisplayType] = useState<'list' | 'weekly'>('list');
  const [editingSchedule, setEditingSchedule] = useState<Partial<WorkerSchedule>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { refreshData(); }, []);
  const refreshData = async () => {
      const s = await DataService.getEnrichedSchedules();
      setSchedules(s);
      setUsers(await DataService.getUsers());
      setProjects(await DataService.getProjects());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await DataService.saveSchedule({
        id: editingSchedule.id || Date.now().toString(),
        userId: editingSchedule.userId!,
        projectId: editingSchedule.projectId!,
        roleOnSite: editingSchedule.roleOnSite || 'Worker',
        startDatetime: editingSchedule.startDatetime!,
        endDatetime: editingSchedule.endDatetime || editingSchedule.startDatetime!,
        notes: editingSchedule.notes || ''
    });
    refreshData(); setIsModalOpen(false);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (confirm("Delete schedule?")) { await DataService.deleteSchedule(id); refreshData(); }
  };

  const list = viewMode === 'active' ? schedules.filter(s => new Date(s.endDatetime) >= new Date()) : schedules.filter(s => new Date(s.endDatetime) < new Date());

  const handleExport = () => {
      const rows = [['Employee','Project','Start','End','Notes']];
      list.forEach(s => rows.push([s.user?.name, s.project?.name, s.startDatetime, s.endDatetime, s.notes]));
      const blob = new Blob(["\uFEFF" + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Schedules.csv'; a.click();
  };
  
  const getColor = (uid: string) => {
      const colors = ['bg-red-50 border-red-500 text-red-900', 'bg-blue-50 border-blue-500 text-blue-900', 'bg-green-50 border-green-500 text-green-900'];
      return colors[uid.charCodeAt(0) % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Schedules</h1><div className="flex gap-2"><button onClick={() => setDisplayType('list')}><List /></button><button onClick={() => setDisplayType('weekly')}><Calendar /></button>{user?.role === Role.ADMIN && <Button onClick={() => { setEditingSchedule({}); setIsModalOpen(true); }}><Plus size={16} /> Assign</Button>}</div></div>
      {displayType === 'list' && (<><div className="flex gap-4 border-b"><button onClick={() => setViewMode('active')} className={`p-2 ${viewMode==='active'?'border-b-2 border-blue-600':''}`}>Active</button><button onClick={() => setViewMode('history')} className={`p-2 ${viewMode==='history'?'border-b-2 border-blue-600':''}`}>History</button>{viewMode === 'history' && user?.role === Role.ADMIN && <button onClick={handleExport}><Download size={16} /></button>}</div><div className="bg-white rounded shadow overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Worker</th><th className="p-3 text-left">Project</th><th className="p-3 text-left">Time</th><th></th></tr></thead><tbody>{list.map(s => (<tr key={s.id} className="border-t"><td className="p-3 font-bold text-blue-600">{s.user?.name}</td><td className="p-3">{s.project?.name}<br/><span className="text-xs text-gray-500">{s.roleOnSite}</span></td><td className="p-3 text-sm">{new Date(s.startDatetime).toLocaleString()} - <br/>{new Date(s.endDatetime).toLocaleString()}</td><td className="p-3 text-right">{user?.role === Role.ADMIN && (<div className="flex justify-end gap-2"><button onClick={() => { setEditingSchedule(s); setIsModalOpen(true); }}><Edit2 size={16} className="text-blue-500" /></button><button onClick={() => handleDelete(s.id)}><Trash2 size={16} className="text-red-500" /></button></div>)}</td></tr>))}</tbody></table></div></>)}
      {displayType === 'weekly' && (<div className="grid grid-cols-7 gap-2">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (<div key={d} className="min-h-[200px] border p-2"><div className="font-bold text-center border-b mb-2">{d}</div>{schedules.map(s => { if (new Date(s.startDatetime).getDay() === (i + 1) % 7) { return (<div key={s.id} className={`p-1 mb-1 text-xs border-l-4 rounded ${getColor(s.userId)} relative group`}><div className="font-bold">{s.user?.name}</div><div>{new Date(s.startDatetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(s.endDatetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>{user?.role === Role.ADMIN && <button onClick={(e) => handleDelete(s.id, e)} className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>}</div>); } return null; })}</div>))}</div>)}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign"><form onSubmit={handleSave} className="space-y-4"><select className="w-full border p-2" value={editingSchedule.userId} onChange={e => setEditingSchedule({...editingSchedule, userId: e.target.value})}><option value="">Select User</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><select className="w-full border p-2" value={editingSchedule.projectId} onChange={e => setEditingSchedule({...editingSchedule, projectId: e.target.value})}><option value="">Select Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="flex gap-2"><input type="datetime-local" className="w-full border p-2" value={editingSchedule.startDatetime} onChange={e => setEditingSchedule({...editingSchedule, startDatetime: e.target.value})} /><input type="datetime-local" className="w-full border p-2" value={editingSchedule.endDatetime} onChange={e => setEditingSchedule({...editingSchedule, endDatetime: e.target.value})} /></div><input className="w-full border p-2" placeholder="Role" value={editingSchedule.roleOnSite} onChange={e => setEditingSchedule({...editingSchedule, roleOnSite: e.target.value})} /><div className="flex justify-end"><Button type="submit">Save</Button></div></form></Modal>
    </div>
  );
};
