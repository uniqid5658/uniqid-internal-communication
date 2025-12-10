import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { NotificationService } from '../services/notificationService';
import { WorkerSchedule, Role, User, Project } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, User as UserIcon, MapPin, Clock } from 'lucide-react';

export const SchedulesPage: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<WorkerSchedule>>({
    startDatetime: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setSchedules(DataService.getEnrichedSchedules());
    setProjects(DataService.getProjects());
    setUsers(DataService.getUsers());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.userId || !newSchedule.projectId || !newSchedule.startDatetime) return;

    setIsNotifying(true);

    const schedule: WorkerSchedule = {
      id: Date.now().toString(),
      userId: newSchedule.userId,
      projectId: newSchedule.projectId,
      roleOnSite: newSchedule.roleOnSite || 'Worker',
      startDatetime: newSchedule.startDatetime,
      endDatetime: newSchedule.endDatetime || newSchedule.startDatetime,
      notes: newSchedule.notes || '',
    };

    // 1. Save Data
    DataService.saveSchedule(schedule);

    // 2. Trigger Notifications (Simulated)
    const worker = users.find(u => u.id === schedule.userId);
    const project = projects.find(p => p.id === schedule.projectId);
    
    if (worker && project) {
      await NotificationService.notifyScheduleChange(worker, project, schedule.startDatetime, false);
      alert(`System: SMS and Email notification sent to ${worker.name} (${worker.phone})`);
    }

    setIsNotifying(false);
    setIsModalOpen(false);
    refreshData();
    setNewSchedule({ startDatetime: new Date().toISOString().slice(0, 16) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Worker Schedules</h1>
        {user?.role === Role.ADMIN && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Assign Schedule
          </Button>
        )}
      </div>

      {/* Simple List View for Demo (Could be Calendar) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-start justify-between">
                <div>
                   <h3 className="font-semibold text-gray-900">{s.project?.name}</h3>
                   <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                     {s.roleOnSite}
                   </span>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                  <UserIcon size={16} />
                </div>
             </div>
             
             <div className="mt-4 space-y-2">
               <div className="flex items-center text-sm text-gray-500">
                 <UserIcon size={14} className="mr-2" />
                 {s.user?.name}
               </div>
               <div className="flex items-center text-sm text-gray-500">
                 <Clock size={14} className="mr-2" />
                 {new Date(s.startDatetime).toLocaleString()}
               </div>
               <div className="flex items-center text-sm text-gray-500">
                 <MapPin size={14} className="mr-2" />
                 {s.project?.address}
               </div>
             </div>
             
             {s.notes && (
               <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 italic">
                 "{s.notes}"
               </div>
             )}
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Worker Schedule">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Worker</label>
            <select 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={newSchedule.userId || ''}
              onChange={e => setNewSchedule({...newSchedule, userId: e.target.value})}
            >
              <option value="">Select Worker...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Project</label>
            <select 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={newSchedule.projectId || ''}
              onChange={e => setNewSchedule({...newSchedule, projectId: e.target.value})}
            >
              <option value="">Select Project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input 
                type="datetime-local"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={newSchedule.startDatetime}
                onChange={e => setNewSchedule({...newSchedule, startDatetime: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role on Site</label>
              <input 
                placeholder="e.g. Carpenter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={newSchedule.roleOnSite || ''}
                onChange={e => setNewSchedule({...newSchedule, roleOnSite: e.target.value})}
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Notes</label>
             <textarea 
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
               rows={3}
               value={newSchedule.notes || ''}
               onChange={e => setNewSchedule({...newSchedule, notes: e.target.value})}
             />
          </div>

          <div className="flex justify-end pt-4">
             <Button type="button" variant="secondary" className="mr-2" onClick={() => setIsModalOpen(false)}>Cancel</Button>
             <Button type="submit" disabled={isNotifying}>
               {isNotifying ? 'Sending Notifications...' : 'Assign & Notify'}
             </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
