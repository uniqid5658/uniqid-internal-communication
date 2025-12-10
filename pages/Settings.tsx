
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { User, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Shield, Save, Trash2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [changedUsers, setChangedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUsers(DataService.getUsers());
  }, []);

  if (user?.role !== Role.ADMIN) {
      return <Navigate to="/" />;
  }

  const handleRoleChange = (userId: string, newRole: Role) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setChangedUsers(prev => new Set(prev).add(userId));
  };

  const saveChanges = (userId: string) => {
      const userToSave = users.find(u => u.id === userId);
      if (userToSave) {
          DataService.saveUser(userToSave);
          const newSet = new Set(changedUsers);
          newSet.delete(userId);
          setChangedUsers(newSet);
          alert(`Updated role for ${userToSave.name}`);
      }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === user?.id) {
        alert("You cannot delete your own account.");
        return;
    }
    if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
        DataService.deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Settings</h1>
        <p className="text-gray-500 text-sm">Manage user access and system preferences.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
           <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Shield className="mr-2 text-blue-600" size={20} /> User Management
           </h2>
        </div>
        <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-white">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-200 bg-white">
                {users.map(u => (
                    <tr key={u.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full bg-gray-200" />
                                <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{u.email}</div>
                            <div className="text-xs text-gray-500">{u.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <select 
                                className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={u.role}
                                disabled={u.id === user?.id} // Cannot change own role
                                onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            >
                                <option value={Role.ADMIN}>Admin</option>
                                <option value={Role.STAFF}>Staff</option>
                                <option value={Role.DRIVER}>Driver</option>
                            </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-3">
                                {changedUsers.has(u.id) && (
                                    <button 
                                        onClick={() => saveChanges(u.id)}
                                        className="text-green-600 hover:text-green-900 flex items-center"
                                        title="Save Changes"
                                    >
                                        <Save size={16} className="mr-1" /> Save
                                    </button>
                                )}
                                {u.id !== user?.id && (
                                    <button 
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="text-red-500 hover:text-red-700 flex items-center"
                                        title="Delete User"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};
