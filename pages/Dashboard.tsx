import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Material, Meeting, WorkerSchedule } from '../types';
import { AlertTriangle, Calendar, Package, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [todaysSchedules, setTodaysSchedules] = useState<WorkerSchedule[]>([]);

  useEffect(() => {
    // 1. Check Materials
    const materials = DataService.getMaterials();
    setLowStockMaterials(materials.filter(m => m.currentStock <= m.minStockLevel));

    // 2. Check Meetings (Next 24h)
    const meetings = DataService.getMeetings();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setUpcomingMeetings(meetings.filter(m => {
      const mDate = new Date(m.startDatetime);
      return mDate >= now && mDate <= tomorrow;
    }));

    // 3. Todays Schedules
    const schedules = DataService.getSchedules();
    setTodaysSchedules(schedules.filter(s => {
      const sDate = new Date(s.startDatetime);
      return sDate.toDateString() === now.toDateString();
    }));

  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <AlertTriangle size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
              <p className="text-2xl font-semibold text-gray-800">{lowStockMaterials.length}</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Calendar size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Meetings (24h)</p>
              <p className="text-2xl font-semibold text-gray-800">{upcomingMeetings.length}</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <TrendingUp size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Schedules</p>
              <p className="text-2xl font-semibold text-gray-800">{todaysSchedules.length}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
             <h2 className="font-semibold text-gray-800">Materials Attention Needed</h2>
             <Link to="/materials" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="p-0">
             {lowStockMaterials.length === 0 ? (
               <div className="p-6 text-center text-gray-500 text-sm">All stock levels look good.</div>
             ) : (
               <table className="min-w-full divide-y divide-gray-100">
                 <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {lowStockMaterials.map(m => (
                     <tr key={m.id}>
                       <td className="px-6 py-3 text-sm text-gray-800">{m.name}</td>
                       <td className="px-6 py-3 text-sm text-right font-medium text-red-600">
                         {m.currentStock} / {m.minStockLevel} {m.unit}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
             <h2 className="font-semibold text-gray-800">Upcoming Meetings</h2>
             <Link to="/meetings" className="text-sm text-blue-600 hover:underline">View Calendar</Link>
          </div>
          <div className="p-0">
             {upcomingMeetings.length === 0 ? (
               <div className="p-6 text-center text-gray-500 text-sm">No meetings in the next 24 hours.</div>
             ) : (
               <div className="divide-y divide-gray-100">
                 {upcomingMeetings.map(m => (
                   <div key={m.id} className="px-6 py-4">
                     <div className="flex justify-between">
                       <p className="text-sm font-medium text-gray-900">{m.title}</p>
                       <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{m.meetingType}</span>
                     </div>
                     <p className="text-xs text-gray-500 mt-1">
                        {new Date(m.startDatetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {m.location}
                     </p>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
