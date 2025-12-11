import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Role, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Save, Trash2, Database } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => { loadData(); }, []);
  const loadData = async () => { setUsers(await DataService.getUsers()); };

  if (user?.role !== Role.ADMIN) return <Navigate to="/" />;
  const save = async (uid: string, role: Role) => { await DataService.saveUser({...users.find(u=>u.id===uid)!, role}); alert('Saved'); loadData(); };
  const del = async (uid: string) => { if(confirm('Delete?')) { await DataService.deleteUser(uid); loadData(); }};
  const handleSeed = async () => { if(confirm("This will upload mock data to Firebase. Continue?")) { await DataService.seedDatabase(); loadData(); alert("Seeding Complete!"); }};

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Settings</h1><button onClick={handleSeed} className="flex items-center text-sm bg-gray-100 px-3 py-2 rounded hover:bg-gray-200"><Database size={16} className="mr-2"/> Seed Database</button></div>
      <table className="min-w-full bg-white rounded shadow">
         <thead><tr><th className="p-3 text-left">User</th><th className="p-3">Role</th><th></th></tr></thead>
         <tbody>{users.map(u => (<tr key={u.id} className="border-t"><td className="p-3">{u.name}</td><td className="p-3"><select value={u.role} onChange={e=>{ const list=[...users]; list.find(x=>x.id===u.id)!.role=e.target.value as Role; setUsers(list); }}><option value="ADMIN">Admin</option><option value="STAFF">Staff</option><option value="DRIVER">Driver</option></select></td><td className="p-3 text-right"><button onClick={()=>save(u.id, u.role)} className="mr-2 text-green-600"><Save size={16}/></button>{u.id!==user.id&&<button onClick={()=>del(u.id)} className="text-red-500"><Trash2 size={16}/></button>}</td></tr>))}</tbody>
      </table>
    </div>
  );
};
