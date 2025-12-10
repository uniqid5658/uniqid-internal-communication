import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { NotificationService } from '../services/notificationService';
import { Meeting, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Users, Video, MapPin } from 'lucide-react';

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({
    startDatetime: new Date().toISOString().slice(0, 16),
    meetingType: 'INTERNAL',
    isClientMeeting: false
  });

  useEffect(() => {
    setMeetings(DataService.getMeetings().sort((a,b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const meeting: Meeting = {
      id: Date.now().toString(),
      title: newMeeting.title!,
      description: newMeeting.description || '',
      startDatetime: newMeeting.startDatetime!,
      endDatetime: newMeeting.startDatetime!, // simplified
      location: newMeeting.location || 'Office Room 1',
      meetingType: newMeeting.meetingType as any,
      isClientMeeting: newMeeting.isClientMeeting || false,
      createdBy: user?.id || 'sys',
    };

    DataService.saveMeeting(meeting);

    // Notify Logic
    if (meeting.isClientMeeting) {
      await NotificationService.notifyMeeting(['internal', 'external_client'], meeting.title, meeting.startDatetime);
      alert('System: Meeting created. Invitations sent to staff AND client.');
    } else {
      alert('System: Meeting created. Invitations sent to staff.');
    }

    setMeetings(DataService.getMeetings());
    setIsProcessing(false);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Meetings</h1>
        {user?.role === Role.ADMIN && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Schedule Meeting
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {meetings.length === 0 && <p className="text-gray-500">No upcoming meetings.</p>}
        {meetings.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex-1">
               <div className="flex items-center space-x-3">
                 <h3 className="text-lg font-semibold text-gray-900">{m.title}</h3>
                 <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.isClientMeeting ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                   {m.meetingType}
                 </span>
               </div>
               <p className="text-gray-500 mt-1">{m.description}</p>
               <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users size={14} className="mr-1.5" />
                    {m.isClientMeeting ? 'Client & Staff' : 'Internal Staff'}
                  </div>
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1.5" />
                    {m.location}
                  </div>
               </div>
            </div>
            <div className="mt-4 sm:mt-0 text-right">
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
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Meeting">
         <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input required className="mt-1 w-full border rounded-md p-2" value={newMeeting.title || ''} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select className="mt-1 w-full border rounded-md p-2" value={newMeeting.meetingType} onChange={e => setNewMeeting({...newMeeting, meetingType: e.target.value as any})}>
                  <option value="INTERNAL">Internal</option>
                  <option value="CLIENT">Client</option>
                  <option value="SUPPLIER">Supplier</option>
                </select>
              </div>
              <div className="flex items-center mt-6">
                <input type="checkbox" id="isClient" className="mr-2" checked={newMeeting.isClientMeeting} onChange={e => setNewMeeting({...newMeeting, isClientMeeting: e.target.checked})} />
                <label htmlFor="isClient" className="text-sm text-gray-700">Client Present?</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date & Time</label>
              <input required type="datetime-local" className="mt-1 w-full border rounded-md p-2" value={newMeeting.startDatetime} onChange={e => setNewMeeting({...newMeeting, startDatetime: e.target.value})} />
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input className="mt-1 w-full border rounded-md p-2" placeholder="e.g. Conference Room A" value={newMeeting.location || ''} onChange={e => setNewMeeting({...newMeeting, location: e.target.value})} />
            </div>

             <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
               <span className="font-bold">Note:</span> Saving this meeting will automatically trigger SMS/Email notifications to all selected participants.
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
