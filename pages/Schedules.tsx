
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { NotificationService } from '../services/notificationService';
import { WorkerSchedule, Role, User, Project } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, User as UserIcon, Calendar, Clock, Trash2, Edit2, History, Filter, Download, List, ChevronLeft, ChevronRight } from 'lucide-react';

export const SchedulesPage: React.FC = () => {
  const { user } = useAuth();
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // View State
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [displayType, setDisplayType] = useState<'list' | 'weekly'>('list');
  
  // Weekly View State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));

  // History Filter State
  const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
  const [historyMonth, setHistoryMonth] = useState<number | 'all'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Partial<WorkerSchedule>>({
    startDatetime: new Date().toISOString().slice(0, 16),
    endDatetime: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    refreshData();
  }, []);

  function getMonday(d: Date) {
      d = new Date(d);
      var day = d.getDay(),
          diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
      return new Date(d.setDate(diff));
  }

  const refreshData = () => {
    const enriched = DataService.getEnrichedSchedules();
    // Default Sort: Name then Date
    enriched.sort((a, b) => {
      const nameA = a.user?.name?.toLowerCase() || '';
      const nameB = b.user?.name?.toLowerCase() || '';
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime();
    });
    setAllSchedules(enriched);
    setProjects(DataService.getProjects());
    setUsers(DataService.getUsers());
  };

  // --- COLOR HELPER ---
  const colorClasses = [
    { bg: 'bg-red-50', borderL: 'border-l-red-500', text: 'text-red-800', avatarBg: 'bg-red-100', avatarText: 'text-red-600' },
    { bg: 'bg-orange-50', borderL: 'border-l-orange-500', text: 'text-orange-800', avatarBg: 'bg-orange-100', avatarText: 'text-orange-600' },
    { bg: 'bg-amber-50', borderL: 'border-l-amber-500', text: 'text-amber-800', avatarBg: 'bg-amber-100', avatarText: 'text-amber-600' },
    { bg: 'bg-yellow-50', borderL: 'border-l-yellow-500', text: 'text-yellow-800', avatarBg: 'bg-yellow-100', avatarText: 'text-yellow-600' },
    { bg: 'bg-lime-50', borderL: 'border-l-lime-500', text: 'text-lime-800', avatarBg: 'bg-lime-100', avatarText: 'text-lime-600' },
    { bg: 'bg-green-50', borderL: 'border-l-green-500', text: 'text-green-800', avatarBg: 'bg-green-100', avatarText: 'text-green-600' },
    { bg: 'bg-emerald-50', borderL: 'border-l-emerald-500', text: 'text-emerald-800', avatarBg: 'bg-emerald-100', avatarText: 'text-emerald-600' },
    { bg: 'bg-teal-50', borderL: 'border-l-teal-500', text: 'text-teal-800', avatarBg: 'bg-teal-100', avatarText: 'text-teal-600' },
    { bg: 'bg-cyan-50', borderL: 'border-l-cyan-500', text: 'text-cyan-800', avatarBg: 'bg-cyan-100', avatarText: 'text-cyan-600' },
    { bg: 'bg-sky-50', borderL: 'border-l-sky-500', text: 'text-sky-800', avatarBg: 'bg-sky-100', avatarText: 'text-sky-600' },
    { bg: 'bg-blue-50', borderL: 'border-l-blue-500', text: 'text-blue-800', avatarBg: 'bg-blue-100', avatarText: 'text-blue-600' },
    { bg: 'bg-indigo-50', borderL: 'border-l-indigo-500', text: 'text-indigo-800', avatarBg: 'bg-indigo-100', avatarText: 'text-indigo-600' },
    { bg: 'bg-violet-50', borderL: 'border-l-violet-500', text: 'text-violet-800', avatarBg: 'bg-violet-100', avatarText: 'text-violet-600' },
    { bg: 'bg-purple-50', borderL: 'border-l-purple-500', text: 'text-purple-800', avatarBg: 'bg-purple-100', avatarText: 'text-purple-600' },
    { bg: 'bg-fuchsia-50', borderL: 'border-l-fuchsia-500', text: 'text-fuchsia-800', avatarBg: 'bg-fuchsia-100', avatarText: 'text-fuchsia-600' },
    { bg: 'bg-pink-50', borderL: 'border-l-pink-500', text: 'text-pink-800', avatarBg: 'bg-pink-100', avatarText: 'text-pink-600' },
    { bg: 'bg-rose-50', borderL: 'border-l-rose-500', text: 'text-rose-800', avatarBg: 'bg-rose-100', avatarText: 'text-rose-600' },
  ];

  const getUserColor = (userId?: string) => {
    if (!userId) return colorClasses[0];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorClasses[Math.abs(hash) % colorClasses.length];
  };

  // --- DATA PROCESSING ---

  const now = new Date();

  // 1. Split Active vs History
  const activeSchedules = allSchedules.filter(s => new Date(s.endDatetime) >= now);
  const pastSchedules = allSchedules.filter(s => new Date(s.endDatetime) < now);

  // 2. Filter History
  const filteredHistory = pastSchedules.filter(s => {
      const sDate = new Date(s.startDatetime);
      const yearMatch = sDate.getFullYear() === historyYear;
      const monthMatch = historyMonth === 'all' || sDate.getMonth() + 1 === historyMonth;
      return yearMatch && monthMatch;
  });

  // 3. Get Available Years for Dropdown
  const availableYears = (Array.from(new Set(pastSchedules.map(s => new Date(s.startDatetime).getFullYear()))) as number[])
                         .sort((a, b) => b - a); // Descending

  if (!availableYears.includes(new Date().getFullYear())) {
      availableYears.unshift(new Date().getFullYear());
  }

  // --- HANDLERS ---

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule.userId || !editingSchedule.projectId || !editingSchedule.startDatetime) return;

    setIsNotifying(true);
    const isUpdate = !!editingSchedule.id;

    const schedule: WorkerSchedule = {
      id: editingSchedule.id || Date.now().toString(),
      userId: editingSchedule.userId,
      projectId: editingSchedule.projectId,
      roleOnSite: editingSchedule.roleOnSite || 'Worker',
      startDatetime: editingSchedule.startDatetime,
      endDatetime: editingSchedule.endDatetime || editingSchedule.startDatetime,
      notes: editingSchedule.notes || '',
    };

    DataService.saveSchedule(schedule);

    const worker = users.find(u => u.id === schedule.userId);
    const project = projects.find(p => p.id === schedule.projectId);
    
    if (worker && project) {
      await NotificationService.notifyScheduleChange(worker, project, schedule.startDatetime, isUpdate);
      alert(`System: SMS and Email notification sent to ${worker.name} (${worker.phone})`);
    }

    setIsNotifying(false);
    setIsModalOpen(false);
    refreshData();
    setEditingSchedule({ 
      startDatetime: new Date().toISOString().slice(0, 16),
      endDatetime: new Date().toISOString().slice(0, 16)
    });
  };

  const openEdit = (s: WorkerSchedule) => {
      setEditingSchedule(s);
      setIsModalOpen(true);
  };

  const openNew = () => {
      setEditingSchedule({
        startDatetime: new Date().toISOString().slice(0, 16),
        endDatetime: new Date().toISOString().slice(0, 16)
      });
      setIsModalOpen(true);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
      // Prevent clicking the card behind the delete button in weekly view
      if (e) {
          e.stopPropagation();
      }

      if(window.confirm("Are you sure you want to delete this schedule?")) {
          DataService.deleteSchedule(id);
          refreshData();
          setIsModalOpen(false); // Close modal if open
      }
  };

  const handleExportHistory = () => {
      const rows = [];
      // Headers
      rows.push(['Employee', 'Role', 'Project', 'Start Date', 'Start Time', 'End Date', 'End Time', 'Notes']);
      
      filteredHistory.forEach(s => {
          const start = new Date(s.startDatetime);
          const end = new Date(s.endDatetime);
          
          rows.push([
              s.user?.name || 'Unknown',
              s.roleOnSite,
              s.project?.name || 'Unknown',
              start.toLocaleDateString(),
              start.toLocaleTimeString(),
              end.toLocaleDateString(),
              end.toLocaleTimeString(),
              (s.notes || '').replace(/,/g, ' ') // Clean notes
          ]);
      });

      const csvContent = rows.map(e => e.join(",")).join("\n");
      // Add BOM
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Schedule_History_${historyYear}_${historyMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const displayList = viewMode === 'active' ? activeSchedules : filteredHistory;

  // --- WEEKLY VIEW LOGIC ---
  const handleWeekChange = (direction: 'prev' | 'next') => {
      const newDate = new Date(currentWeekStart);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      setCurrentWeekStart(newDate);
  };

  // Get week days
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      weekDays.push(day);
  }

  // Filter schedules for the current week
  // We use 'allSchedules' instead of 'displayList' because Weekly View might want to see everything
  const weeklySchedules = allSchedules.filter(s => {
      const sStart = new Date(s.startDatetime);
      const sEnd = new Date(s.endDatetime);
      
      const weekStart = new Date(currentWeekStart);
      weekStart.setHours(0,0,0,0);
      
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(23,59,59,999);
      
      return sStart <= weekEnd && sEnd >= weekStart;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Worker Schedules</h1>
           <p className="text-gray-500 text-sm">Manage staff assignments and view history.</p>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="bg-gray-200 p-1 rounded-lg flex space-x-1">
                <button 
                    onClick={() => setDisplayType('list')}
                    className={`p-2 rounded-md ${displayType === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                    title="List View"
                >
                    <List size={18} />
                </button>
                <button 
                    onClick={() => setDisplayType('weekly')}
                    className={`p-2 rounded-md ${displayType === 'weekly' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                    title="Weekly View"
                >
                    <Calendar size={18} />
                </button>
            </div>

            {user?.role === Role.ADMIN && (
              <Button onClick={openNew}>
                <Plus size={16} className="mr-2" /> Assign
              </Button>
            )}
        </div>
      </div>

      {/* --- WEEKLY VIEW --- */}
      {displayType === 'weekly' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                   <div className="flex items-center gap-4">
                       <button onClick={() => handleWeekChange('prev')} className="p-1 hover:bg-gray-200 rounded">
                           <ChevronLeft size={20} />
                       </button>
                       <span className="font-semibold text-gray-700">
                           {currentWeekStart.toLocaleDateString()} - {new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                       </span>
                       <button onClick={() => handleWeekChange('next')} className="p-1 hover:bg-gray-200 rounded">
                           <ChevronRight size={20} />
                       </button>
                   </div>
                   <button onClick={() => setCurrentWeekStart(getMonday(new Date()))} className="text-xs text-blue-600 hover:underline">
                       Today
                   </button>
              </div>
              <div className="grid grid-cols-7 divide-x divide-gray-200">
                  {weekDays.map((day, index) => {
                      const dayStart = new Date(day);
                      dayStart.setHours(0,0,0,0);
                      const dayEnd = new Date(day);
                      dayEnd.setHours(23,59,59,999);
                      
                      const isToday = day.toDateString() === new Date().toDateString();
                      
                      // Filter schedules that overlap with this day
                      const daySchedules = weeklySchedules.filter(s => {
                          const sStart = new Date(s.startDatetime);
                          const sEnd = new Date(s.endDatetime);
                          return sStart <= dayEnd && sEnd >= dayStart;
                      });
                      
                      return (
                          <div key={index} className={`min-h-[400px] flex flex-col ${isToday ? 'bg-blue-50/30' : ''}`}>
                              <div className={`text-center py-2 border-b border-gray-200 text-sm font-medium ${isToday ? 'text-blue-700 bg-blue-50' : 'text-gray-600 bg-gray-50'}`}>
                                  <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                  <div className="text-lg font-bold">{day.getDate()}</div>
                              </div>
                              <div className="flex-1 p-2 space-y-2">
                                  {daySchedules.map(s => {
                                      const colors = getUserColor(s.userId);
                                      const startD = new Date(s.startDatetime);
                                      const endD = new Date(s.endDatetime);
                                      const isSameDay = startD.toDateString() === endD.toDateString();
                                      
                                      const timeStr = isSameDay 
                                          ? `${startD.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${endD.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
                                          : `${startD.getMonth()+1}/${startD.getDate()} ${startD.getHours()}:${String(startD.getMinutes()).padStart(2,'0')} - ${endD.getMonth()+1}/${endD.getDate()} ${endD.getHours()}:${String(endD.getMinutes()).padStart(2,'0')}`;

                                      return (
                                          <div 
                                            key={s.id} 
                                            onClick={() => user?.role === Role.ADMIN && openEdit(s)}
                                            className={`
                                                relative group text-xs p-2 rounded border-l-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow
                                                ${user?.role === Role.ADMIN ? 'hover:ring-1 hover:ring-blue-300' : ''}
                                                border-gray-200 ${colors.bg} ${colors.borderL}
                                            `}
                                          >
                                              {/* Direct Delete Button for Weekly View */}
                                              {user?.role === Role.ADMIN && (
                                                  <button 
                                                    onClick={(e) => handleDelete(s.id, e)}
                                                    className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete"
                                                  >
                                                      <Trash2 size={12} />
                                                  </button>
                                              )}
                                              <div className={`font-bold truncate ${colors.text} pr-4`}>{s.user?.name}</div>
                                              <div className="text-gray-500 truncate mb-1">{s.project?.name}</div>
                                              <div className="flex items-start text-gray-500 mt-1">
                                                  <Clock size={10} className="mr-1 mt-0.5 flex-shrink-0" />
                                                  <span className="leading-tight whitespace-normal">{timeStr}</span>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- LIST VIEW --- */}
      {displayType === 'list' && (
      <>
      {/* TABS & FILTERS */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-1">
         <div className="flex justify-between items-end">
            <nav className="-mb-px flex space-x-8">
                <button
                    onClick={() => setViewMode('active')}
                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center ${viewMode === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    <Calendar size={16} className="mr-2" /> Active Schedules
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">{activeSchedules.length}</span>
                </button>
                <button
                    onClick={() => setViewMode('history')}
                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center ${viewMode === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    <History size={16} className="mr-2" /> History Archive
                </button>
            </nav>

            {/* History Filters */}
            {viewMode === 'history' && (
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-2 py-1">
                        <Filter size={14} className="text-gray-400" />
                        <select 
                            className="text-sm border-none focus:ring-0 p-1 text-gray-700"
                            value={historyYear}
                            onChange={(e) => setHistoryYear(Number(e.target.value))}
                        >
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <span className="text-gray-300">|</span>
                        <select 
                            className="text-sm border-none focus:ring-0 p-1 text-gray-700"
                            value={historyMonth}
                            onChange={(e) => setHistoryMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        >
                            <option value="all">All Months</option>
                            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{new Date(0, m-1).toLocaleString('default', { month: 'short' })}</option>
                            ))}
                        </select>
                    </div>
                    {user?.role === Role.ADMIN && (
                        <button 
                            onClick={handleExportHistory}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md border border-gray-200 bg-white"
                            title="Export to Excel"
                        >
                            <Download size={18} />
                        </button>
                    )}
                </div>
            )}
         </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Employee</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Project / Role</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Timing</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Notes</th>
                 {/* REMOVED viewMode check to allow editing in history */}
                 {user?.role === Role.ADMIN && <th className="px-6 py-3 w-10"></th>}
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {displayList.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                     {viewMode === 'active' ? 'No active schedules found.' : 'No history records found for this period.'}
                   </td>
                 </tr>
               ) : (
                 displayList.map((s) => {
                   const colors = getUserColor(s.userId);
                   return (
                   <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center">
                         <div className="flex-shrink-0 h-10 w-10">
                           <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${colors.avatarBg} ${colors.avatarText}`}>
                             {s.user?.name.charAt(0)}
                           </div>
                         </div>
                         <div className="ml-4">
                           <div className={`text-sm font-bold ${colors.text}`}>{s.user?.name}</div>
                           <div className="text-xs text-gray-500">{s.user?.role}</div>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{s.project?.name}</div>
                        <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {s.roleOnSite}
                        </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col text-sm text-gray-600 space-y-1">
                           <div className="flex items-center">
                              <span className="text-xs font-bold text-gray-400 w-10">Start</span>
                              <span>{new Date(s.startDatetime).toLocaleString([], {year: 'numeric', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                           </div>
                           <div className="flex items-center">
                              <span className="text-xs font-bold text-gray-400 w-10">End</span>
                              <span>{new Date(s.endDatetime).toLocaleString([], {year: 'numeric', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 italic max-w-xs break-words">
                           {s.notes || <span className="text-gray-300">-</span>}
                        </div>
                     </td>
                     {/* REMOVED viewMode check to allow editing in history */}
                     {user?.role === Role.ADMIN && (
                         <td className="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end space-x-2">
                             <button onClick={() => openEdit(s)} className="text-blue-500 hover:text-blue-700">
                                 <Edit2 size={16} />
                             </button>
                             <button 
                                onClick={(e) => handleDelete(s.id, e)} 
                                className="text-red-500 hover:text-red-700"
                                title="Delete Schedule"
                             >
                                 <Trash2 size={16} />
                             </button>
                         </td>
                     )}
                   </tr>
                 );})
               )}
             </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSchedule.id ? "Edit Worker Schedule" : "Assign Worker Schedule"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Worker</label>
            <select 
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={editingSchedule.userId || ''}
              onChange={e => setEditingSchedule({...editingSchedule, userId: e.target.value})}
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
              value={editingSchedule.projectId || ''}
              onChange={e => setEditingSchedule({...editingSchedule, projectId: e.target.value})}
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
                value={editingSchedule.startDatetime}
                onChange={e => setEditingSchedule({...editingSchedule, startDatetime: e.target.value})}
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input 
                type="datetime-local"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={editingSchedule.endDatetime}
                onChange={e => setEditingSchedule({...editingSchedule, endDatetime: e.target.value})}
              />
            </div>
          </div>
          
           <div>
              <label className="block text-sm font-medium text-gray-700">Role on Site</label>
              <input 
                placeholder="e.g. Carpenter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={editingSchedule.roleOnSite || ''}
                onChange={e => setEditingSchedule({...editingSchedule, roleOnSite: e.target.value})}
              />
            </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Notes</label>
             <textarea 
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
               rows={3}
               value={editingSchedule.notes || ''}
               onChange={e => setEditingSchedule({...editingSchedule, notes: e.target.value})}
             />
          </div>

          <div className="flex justify-between pt-4">
             {/* Delete Button in Modal for Weekly View/Editing */}
             {editingSchedule.id && user?.role === Role.ADMIN ? (
                 <Button type="button" variant="danger" onClick={() => handleDelete(editingSchedule.id!)}>
                     <Trash2 size={16} className="mr-2" /> Delete
                 </Button>
             ) : (
                 <div></div> // Spacer
             )}
             
             <div className="flex space-x-2">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isNotifying}>
                  {isNotifying ? 'Sending...' : (editingSchedule.id ? 'Update & Notify' : 'Assign & Notify')}
                </Button>
             </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
