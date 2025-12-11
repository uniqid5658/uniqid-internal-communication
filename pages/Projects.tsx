import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Meeting, Role, MeetingType, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Edit2, Download } from 'lucide-react';

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Meeting>>({});

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
      const ms = await DataService.getMeetings();
      setMeetings(ms.sort((a,b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()));
      setUsers(await DataService.getUsers());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await DataService.saveMeeting({
      id: current.id || Date.now().toString(),
      title: current.title!,
      description: current.description || '',
      startDatetime: current.startDatetime!,
      endDatetime: current.startDatetime!,
      location: current.location || '',
      meetingType: current.meetingType as MeetingType || 'STAFF',
      participantIds: current.participantIds || [],
      createdBy: user?.id || 'sys',
    });
    loadData(); setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => { if(confirm('Delete?')) { await DataService.deleteMeeting(id); loadData(); }};
  const list = viewMode === 'active' ? meetings.filter(m => new Date(m.startDatetime) >= new Date()) : meetings.filter(m => new Date(m.startDatetime) < new Date());
  
  const exportHistory = () => {
      const csv = list.map(m => `${m.startDatetime},${m.title},${m.meetingType},${m.location}`).join('\n');
      const blob = new Blob(["\uFEFFDate,Title,Type,Location\n" + csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Meetings.csv'; a.click();
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between"><h1 className="text-2xl font-bold">Meetings</h1>{user?.role === Role.ADMIN && <Button onClick={() => { setCurrent({ participantIds: [] }); setIsModalOpen(true); }}><Plus size={16}/> New</Button>}</div>
       <div className="flex gap-4 border-b"><button onClick={() => setViewMode('active')} className={`p-2 ${viewMode==='active'?'border-b-2 border-blue-600':''}`}>Upcoming</button><button onClick={() => setViewMode('history')} className={`p-2 ${viewMode==='history'?'border-b-2 border-blue-600':''}`}>History</button>{viewMode === 'history' && <button onClick={exportHistory}><Download size={16}/></button>}</div>
       {list.map(m => (
           <div key={m.id} className="bg-white p-4 rounded shadow border flex justify-between items-center">
               <div><div className="font-bold text-lg">{m.title} <span className="text-xs bg-gray-100 p-1 rounded ml-2">{m.meetingType}</span></div><div className="text-sm text-gray-500">{new Date(m.startDatetime).toLocaleString()} @ {m.location}</div></div>
               {user?.role === Role.ADMIN && <div className="flex gap-2"><button onClick={() => { setCurrent(m); setIsModalOpen(true); }}><Edit2 size={16} className="text-blue-500"/></button><button onClick={() => handleDelete(m.id)}><Trash2 size={16} className="text-red-500"/></button></div>}
           </div>
       ))}
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Meeting"><form onSubmit={handleSave} className="space-y-4"><input className="w-full border p-2" placeholder="Title" value={current.title} onChange={e => setCurrent({...current, title: e.target.value})} /><select className="w-full border p-2" value={current.meetingType} onChange={e => setCurrent({...current, meetingType: e.target.value as any})}><option value="STAFF">Staff</option><option value="CLIENT">Client</option><option value="TRADE">Trade</option><option value="SUPPLY">Supply</option></select><input type="datetime-local" className="w-full border p-2" value={current.startDatetime} onChange={e => setCurrent({...current, startDatetime: e.target.value})} /><input className="w-full border p-2" placeholder="Location" value={current.location} onChange={e => setCurrent({...current, location: e.target.value})} /><div className="h-24 overflow-y-auto border p-2">{users.map(u => (<div key={u.id} onClick={() => { const ids = current.participantIds || []; setCurrent({...current, participantIds: ids.includes(u.id) ? ids.filter(x => x!==u.id) : [...ids, u.id]}); }} className={`cursor-pointer ${current.participantIds?.includes(u.id) ? 'bg-blue-100' : ''}`}>{u.name}</div>))}</div><div className="flex justify-end"><Button type="submit">Save</Button></div></form></Modal>
    </div>
  );
};
