import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Material, Meeting } from '../types';
import { AlertTriangle, Calendar, Clock, MapPin, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([]);
  const [myUpcomingMeetings, setMyUpcomingMeetings] = useState<Meeting[]>([]);
  const [myActiveSchedules, setMyActiveSchedules] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
        // 1. Materials
        const materials = await DataService.getMaterials();
        setLowStockMaterials(materials.filter(m => m.currentStock <= m.minStockLevel));

        // 2. My Meetings
        const meetings = await DataService.getMeetings();
        const now = new Date();
        const relevantMeetings = meetings.filter(m => {
            const mDate = new Date(m.startDatetime);
            return mDate >= now && (m.participantIds || []).includes(user.id);
        });
        setMyUpcomingMeetings(relevantMeetings.sort((a,b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()).slice(0, 5));

        // 3. My Schedules
        const schedules = await DataService.getEnrichedSchedules();
        const mySchedules = schedules.filter(s => {
            const endD = new Date(s.endDatetime);
            return endD >= now && s.userId === user.id;
        });
        setMyActiveSchedules(mySchedules.sort((a,b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()));
    };

    loadData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Welcome back, {user.name}</h1><p className="text-gray-500 text-sm">Your personal overview.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"><div className="p-3 rounded-full bg-orange-100 text-orange-600"><AlertTriangle size={24} /></div><div className="ml-4"><p className="text-sm font-medium text-gray-500">Alerts</p><p className="text-2xl font-semibold text-gray-800">{lowStockMaterials.length}</p></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"><div className="p-3 rounded-full bg-blue-100 text-blue-600"><Calendar size={24} /></div><div className="ml-4"><p className="text-sm font-medium text-gray-500">Meetings</p><p className="text-2xl font-semibold text-gray-800">{myUpcomingMeetings.length}</p></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"><div className="p-3 rounded-full bg-green-100 text-green-600"><Briefcase size={24} /></div><div className="ml-4"><p className="text-sm font-medium text-gray-500">Assignments</p><p className="text-2xl font-semibold text-gray-800">{myActiveSchedules.length}</p></div></div>
      </div>
      {/* ... Keeping UI structure same, just ensuring data flows ... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50/50"><h2 className="font-semibold text-gray-800 flex items-center"><Briefcase size={18} className="mr-2 text-green-600" /> My Active Schedules</h2><Link to="/schedules" className="text-sm text-green-700 hover:underline">Full Calendar</Link></div>
                <div className="p-0 max-h-[400px] overflow-y-auto">{myActiveSchedules.length === 0 ? <div className="p-6 text-center text-gray-500 text-sm">No assignments.</div> : <div className="divide-y divide-gray-100">{myActiveSchedules.map(s => (<div key={s.id} className="px-6 py-4 hover:bg-gray-50"><div className="flex justify-between items-start mb-1"><div><p className="text-sm font-bold text-gray-900">{s.project?.name}</p><p className="text-xs text-blue-600 font-medium">{s.roleOnSite}</p></div><div className="text-right text-xs"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-md font-mono">{new Date(s.startDatetime).toLocaleDateString()}</span></div></div></div>))}</div>}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50/50"><h2 className="font-semibold text-gray-800 flex items-center"><Calendar size={18} className="mr-2 text-blue-600" /> My Meetings</h2><Link to="/meetings" className="text-sm text-blue-600 hover:underline">View All</Link></div>
                <div className="p-0">{myUpcomingMeetings.length === 0 ? <div className="p-6 text-center text-gray-500 text-sm">No meetings.</div> : <div className="divide-y divide-gray-100">{myUpcomingMeetings.map(m => (<div key={m.id} className="px-6 py-4 hover:bg-gray-50"><div className="flex justify-between"><p className="text-sm font-medium text-gray-900">{m.title}</p></div><div className="flex items-center text-xs text-gray-500 mt-2"><Clock size={12} className="mr-1" />{new Date(m.startDatetime).toLocaleString()}<span className="mx-2">•</span><MapPin size={12} className="mr-1" />{m.location}</div></div>))}</div>}</div>
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-orange-50/50"><h2 className="font-semibold text-gray-800 flex items-center"><AlertTriangle size={18} className="mr-2 text-orange-600" /> Material Shortages</h2><Link to="/materials" className="text-sm text-orange-700 hover:underline">Manage</Link></div>
          <div className="p-0">{lowStockMaterials.length === 0 ? <div className="p-6 text-center text-gray-500 text-sm">Stock levels good.</div> : <table className="min-w-full divide-y divide-gray-100"><tbody className="divide-y divide-gray-100">{lowStockMaterials.map(m => (<tr key={m.id}><td className="px-6 py-3 text-sm text-gray-800"><div className="font-medium">{m.name}</div><div className="text-xs text-gray-400">{m.brand}</div></td><td className="px-6 py-3 text-sm text-right font-medium text-red-600">{m.currentStock} / {m.minStockLevel} {m.unit}</td></tr>))}</tbody></table>}</div>
        </div>
      </div>
    </div>
  );
};
