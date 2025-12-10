import { MOCK_USERS, MOCK_PROJECTS, MOCK_MATERIALS, MOCK_TRANSACTIONS } from './mockData';
import { User, Project, Material, WorkerSchedule, Meeting, MaterialTransaction } from '../types';

// Helper to simulate local storage persistence
// Now includes robust error handling
const load = <T,>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultVal;
  try {
    const parsed = JSON.parse(stored);
    // Basic check to ensure we didn't load null or undefined
    return parsed || defaultVal;
  } catch (e) {
    console.warn(`Error loading ${key} from localStorage. Resetting to default.`, e);
    // If data is corrupt, return default to prevent app crash
    return defaultVal;
  }
};

const save = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
};

export const DataService = {
  getUsers: (): User[] => load('users', MOCK_USERS),
  saveUser: (user: User) => {
    const users = DataService.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    save('users', users);
  },
  deleteUser: (id: string) => {
    const users = DataService.getUsers().filter(u => u.id !== id);
    save('users', users);
  },
  
  getProjects: (): Project[] => load('projects', MOCK_PROJECTS),
  saveProject: (project: Project) => {
    const projects = DataService.getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }
    save('projects', projects);
  },
  deleteProject: (id: string) => {
    const projects = DataService.getProjects().filter(p => p.id !== id);
    save('projects', projects);
  },
  
  getMaterials: (): Material[] => load('materials', MOCK_MATERIALS),
  saveMaterial: (material: Material) => {
    const materials = DataService.getMaterials();
    const existing = materials.findIndex(m => m.id === material.id);
    if (existing >= 0) {
      materials[existing] = material;
    } else {
      materials.push(material);
    }
    save('materials', materials);
  },
  deleteMaterial: (id: string) => {
    const materials = DataService.getMaterials().filter(m => m.id !== id);
    save('materials', materials);
  },

  getTransactions: (): MaterialTransaction[] => load('transactions', MOCK_TRANSACTIONS),
  
  // Updated to support History Isolation (skipGlobalUpdate)
  saveTransaction: (transaction: MaterialTransaction, skipGlobalUpdate: boolean = false) => {
    const transactions = DataService.getTransactions();
    // Check if update or new
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    
    if (existingIndex >= 0) {
        transactions[existingIndex] = transaction;
    } else {
        transactions.push(transaction);
    }
    save('transactions', transactions);

    if (!skipGlobalUpdate) {
        // Also update material stock
        const materials = DataService.getMaterials();
        const materialIndex = materials.findIndex(m => m.id === transaction.materialId);
        if (materialIndex >= 0) {
            if (transaction.type === 'IN') {
                materials[materialIndex].currentStock += transaction.quantity;
            } else if (transaction.type === 'OUT') {
                materials[materialIndex].currentStock -= transaction.quantity;
            }
            save('materials', materials);
        }
    }
  },

  deleteTransaction: (id: string, skipGlobalUpdate: boolean = false) => {
      const transactions = DataService.getTransactions();
      const tx = transactions.find(t => t.id === id);
      const newTransactions = transactions.filter(t => t.id !== id);
      save('transactions', newTransactions);

      if (!skipGlobalUpdate && tx) {
          // Reverse the effect on stock
          const materials = DataService.getMaterials();
          const materialIndex = materials.findIndex(m => m.id === tx.materialId);
          if (materialIndex >= 0) {
               // If we deleted an 'OUT' (Allocation), we put it back (IN)
               if (tx.type === 'OUT') {
                   materials[materialIndex].currentStock += tx.quantity;
               } else if (tx.type === 'IN') {
                   materials[materialIndex].currentStock -= tx.quantity;
               }
               save('materials', materials);
          }
      }
  },

  getSchedules: (): WorkerSchedule[] => load('schedules', []),
  saveSchedule: (schedule: WorkerSchedule) => {
    const schedules = DataService.getSchedules();
    const existing = schedules.findIndex(s => s.id === schedule.id);
    if (existing >= 0) {
      schedules[existing] = schedule;
    } else {
      schedules.push(schedule);
    }
    save('schedules', schedules);
  },
  deleteSchedule: (id: string) => {
     const schedules = DataService.getSchedules().filter(s => s.id !== id);
     save('schedules', schedules);
  },

  getMeetings: (): Meeting[] => load('meetings', []),
  saveMeeting: (meeting: Meeting) => {
    const meetings = DataService.getMeetings();
    const existing = meetings.findIndex(m => m.id === meeting.id);
    if (existing >= 0) {
      meetings[existing] = meeting;
    } else {
      meetings.push(meeting);
    }
    save('meetings', meetings);
  },
  deleteMeeting: (id: string) => {
    const meetings = DataService.getMeetings().filter(m => m.id !== id);
    save('meetings', meetings);
  },

  getEnrichedSchedules: () => {
    const schedules = DataService.getSchedules();
    const users = DataService.getUsers();
    const projects = DataService.getProjects();
    
    return schedules.map(s => ({
      ...s,
      user: users.find(u => u.id === s.userId),
      project: projects.find(p => p.id === s.projectId)
    }));
  }
};
