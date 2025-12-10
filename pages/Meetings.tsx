
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { NotificationService } from '../services/notificationService';
import { Meeting, Role, User, MeetingType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Users, MapPin, Edit2, Trash2, Check, Calendar, History, Filter, Clock, Download } from 'lucide-react';

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // View State
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
  const [historyMonth, setHistoryMonth] = useState<number | 'all'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [currentMeeting, setCurrentMeeting] = useState<Partial<Meeting>>({
    startDatetime: new Date().toISOString().slice(0, 16),
    meetingType: 'STAFF',
    participantIds: []
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
      setMeetings(DataService.getMeetings().sort((a,b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()));
      setUsers(DataService.getUsers());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const meeting: Meeting = {
      id: currentMeeting.id || Date.now().toString(),
      title: currentMeeting.title!,
      description: currentMeeting.description || '',
      startDatetime: currentMeeting.startDatetime!,
      endDatetime: currentMeeting.startDatetime!, // simplified
      location: currentMeeting.location || 'Office Room 1',
      meetingType: currentMeeting.meetingType as MeetingType,
      participantIds: currentMeeting.participantIds || [],
      createdBy: currentMeeting.createdBy || user?.id || 'sys',
    };

    DataService.saveMeeting(meeting);

    // Notify Logic
    const participantCount = meeting.participantIds.length;
    await NotificationService.notifyMeeting(
        meeting.participantIds, // In a real app we would map these to emails
        meeting.title, 
        meeting.startDatetime
    );
    alert(`System: Meeting saved. Notifications sent to ${participantCount} participant(s).`);

    refreshData();
    setIsProcessing(false);
    setIsModalOpen(false);
    setCurrentMeeting({
        startDatetime: new Date().toISOString().slice(0, 16),
        meetingType: 'STAFF',
        participantIds: []
    });
  };

  const handleEdit = (m: Meeting) => {
      setCurrentMeeting({
          ...m,
          // Ensure legacy data doesn't break
          participantIds: m.participantIds || [],
          meetingType: (['STAFF', 'CLIENT', 'TRADE', 'SUPPLY'].includes(m.meetingType) ? m.meetingType : 'STAFF') as MeetingType
      });
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Delete this meeting?")) {
          DataService.deleteMeeting(id);
          refreshData();
      }
  };

  const toggleParticipant = (userId: string) => {
      const current = currentMeeting.participantIds || [];
      if (current.includes(userId)) {
          setCurrentMeeting({ ...currentMeeting, participantIds: current.filter(id => id !== userId) });
      } else {
          setCurrentMeeting({ ...currentMeeting, participantIds: [...current, userId] });
      }
  };

  // Helper to get user names
  const getParticipantNames = (ids?: string[]) => {
      if (!ids || ids.length === 0) return 'No participants selected';
      return ids.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ');
  };

  const getTypeColor = (type: string) => {
      switch (type) {
          case 'CLIENT': return 'bg-purple-100 text-purple-700';
          case 'TRADE': return 'bg-orange-100 text-orange-700';
          case 'SUPPLY': return 'bg-green-100 text-green-700';
          default: return 'bg-gray-100 text-gray-700'; // Staff
      }
  };

  // --- DATA PROCESSING FOR VIEWS ---
  const now = new Date();
  
  const upcomingMeetings = meetings.filter(m => new Date(m.startDatetime) >= now);
  const pastMeetings = meetings.filter(m => new Date(m.startDatetime) < now).sort((a,b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()); // Newest past first

  // Filter History
  const filteredHistory = pastMeetings.filter(m => {
      const d = new Date(m.startDatetime);
      const yearMatch = d.getFullYear() === historyYear;
      const monthMatch = historyMonth === 'all' || d.getMonth() + 1 === historyMonth;
      return yearMatch && monthMatch;
  });

  const displayList = viewMode === 'active' ? upcomingMeetings : filteredHistory;

  // Get Available Years for Dropdown
  const availableYears = (Array.from(new Set(pastMeetings.map(m => new Date(m.startDatetime).getFullYear()))) as number[])
                         .sort((a, b) => b - a);

  if (!availableYears.includes(new Date().getFullYear())) {
      availableYears.unshift(new Date().getFullYear());
  }

  // --- EXPORT HANDLER ---
  const handleExportHistory = () => {
    const rows = [];
    // Headers
    rows.push(['Date', 'Time', 'Title', 'Type', 'Location', 'Participants', 'Description']);
    
    filteredHistory.forEach(m => {
        const d = new Date(m.startDatetime);
        const dateStr = d.toLocaleDateString();
        const timeStr = d.toLocaleTimeString();
        const participants = getParticipantNames(m.participantIds).replace(/,/g, ';'); // Replace CSV delimiter inside field
        const cleanDesc = (m.description || '').replace(/(\r\n|\n|\r)/gm, " ").replace(/,/g, ' ');
        const cleanTitle = m.title.replace(/,/g, ' ');
        const cleanLoc = m.location.replace(/,/g, ' ');

        rows.push([dateStr, timeStr, cleanTitle, m.meetingType, cleanLoc, participants, cleanDesc]);
    });

    const csvContent = rows.map(e => e.join(",")).join("\n");
    // Add BOM
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Meeting_History_${historyYear}_${historyMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Meetings</h1>
           <p className="text-gray-500 text-sm">Schedule and manage team coordination.</p>
        </div>
        {user?.role === Role.ADMIN && (
          <Button onClick={() => {
              setCurrentMeeting({ 
                  startDatetime: new Date().toISOString().slice(0, 16), 
                  meetingType: 'STAFF',
                  participantIds: [] 
              });
              setIsModalOpen(true);
          }}>
            <Plus size={16} className="mr-2" /> Schedule Meeting
          </Button>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-1">
         <div className="flex justify-between items-end">
            <nav className="-mb-px flex space-x-8">
                <button
                    onClick={() => setViewMode('active')}
                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center ${viewMode === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    <Calendar size={16} className="mr-2" /> Upcoming
                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">{upcomingMeetings.length}</span>
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

      <div className="space-y-4">
        {displayList.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                    {viewMode === 'active' ? 'No upcoming meetings scheduled.' : 'No meeting history found for this period.'}
                </p>
            </div>
        )}
        
        {displayList.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex-1">
               <div className="flex items-center space-x-3">
                 <h3 className="text-lg font-semibold text-gray-900">{m.title}</h3>
                 <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(m.meetingType)}`}>
                   {m.meetingType}
                 </span>
               </div>
               <p className="text-gray-500 mt-1">{m.description}</p>
               <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center max-w-md">
                    <Users size={14} className="mr-1.5 flex-shrink-0" />
                    <span className="truncate">{getParticipantNames(m.participantIds)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1.5 flex-shrink-0" />
                    {m.location}
                  </div>
               </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-4">
                <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">
                        {new Date(m.startDatetime).getDate()}
                    </div>
                    <div className="text-sm font-medium text-gray-500 uppercase">
                        {new Date(m.startDatetime).toLocaleString('default', { month: 'short' })}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                        {new Date(m.startDatetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
                {user?.role === Role.ADMIN && (
                    <div className="flex flex-col gap-2 border-l border-gray-100 pl-4 ml-2">
                        <button onClick={() => handleEdit(m)} className="text-blue-600 hover:text-blue-800">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentMeeting.id ? "Edit Meeting" : "Schedule New Meeting"}>
         <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input required className="mt-1 w-full border rounded-md p-2" value={currentMeeting.title || ''} onChange={e => setCurrentMeeting({...currentMeeting, title: e.target.value})} />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select 
                    className="mt-1 w-full border rounded-md p-2" 
                    value={currentMeeting.meetingType} 
                    onChange={e => setCurrentMeeting({...currentMeeting, meetingType: e.target.value as MeetingType})}
                >
                  <option value="STAFF">Staff</option>
                  <option value="CLIENT">Client</option>
                  <option value="TRADE">Trade</option>
                  <option value="SUPPLY">Supply</option>
                </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Participants (Employees)</label>
              <div className="border rounded-md max-h-40 overflow-y-auto p-2 bg-gray-50 grid grid-cols-2 gap-2">
                  {users.map(u => {
                      const isSelected = (currentMeeting.participantIds || []).includes(u.id);
                      return (
                          <div 
                            key={u.id} 
                            onClick={() => toggleParticipant(u.id)}
                            className={`
                                cursor-pointer text-xs p-2 rounded border flex items-center justify-between
                                ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}
                            `}
                          >
                              <span>{u.name}</span>
                              {isSelected && <Check size={12} />}
                          </div>
                      );
                  })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date & Time</label>
              <input required type="datetime-local" className="mt-1 w-full border rounded-md p-2" value={currentMeeting.startDatetime} onChange={e => setCurrentMeeting({...currentMeeting, startDatetime: e.target.value})} />
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input className="mt-1 w-full border rounded-md p-2" placeholder="e.g. Conference Room A" value={currentMeeting.location || ''} onChange={e => setCurrentMeeting({...currentMeeting, location: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea className="mt-1 w-full border rounded-md p-2" rows={2} value={currentMeeting.description || ''} onChange={e => setCurrentMeeting({...currentMeeting, description: e.target.value})} />
            </div>

             <div className="flex justify-end pt-4">
              <Button type="button" variant="secondary" className="mr-2" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isProcessing}>{isProcessing ? 'Scheduling...' : 'Schedule & Notify'}</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};